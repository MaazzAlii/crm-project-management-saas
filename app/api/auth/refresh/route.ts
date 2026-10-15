import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { verifyRefreshToken, generateAccessToken, generateRefreshToken } from '@/lib/auth/jwt';
import {
  getRefreshTokenFromCookie,
  setRefreshTokenCookie,
  deleteRefreshTokenCookie,
  getDefaultSessionConfig,
  getRefreshSessionConfig,
} from '@/lib/auth/session';
import { clearAuthCookies } from '@/lib/auth/logout';
import { query, queryOne } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const refreshConfig = getRefreshSessionConfig(request.headers);

    // Get refresh token from request cookies or next/headers store
    const refreshToken =
      request.cookies.get(refreshConfig.cookieName)?.value ||
      (await getRefreshTokenFromCookie(refreshConfig.cookieName));

    if (!refreshToken) {
      const response = NextResponse.json(
        { error: 'Refresh token missing' },
        { status: 401 }
      );
      clearAuthCookies(response, request.headers);
      return response;
    }

    // Verify cryptographic signature and expiry
    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      await deleteRefreshTokenCookie();
      const response = NextResponse.json(
        { error: 'Refresh token expired or invalid' },
        { status: 401 }
      );
      clearAuthCookies(response, request.headers);
      return response;
    }

    const refreshTokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    // CRITICAL: Atomic token claim with RETURNING clause.
    // Closes TOCTOU race condition for concurrent refresh requests.
    let updateRes;
    try {
      updateRes = await query<{ id: string; token_family: string; user_id: string }>(
        `UPDATE refresh_tokens
         SET is_revoked = true, rotated_at = NOW()
         WHERE token_hash = $1 AND is_revoked = false
         RETURNING id, token_family, user_id`,
        [refreshTokenHash]
      );
    } catch (err: any) {
      if (err?.code === '42703') {
        // Fallback if rotated_at column has not been added yet (pre-migration 0049)
        updateRes = await query<{ id: string; token_family: string; user_id: string }>(
          `UPDATE refresh_tokens
           SET is_revoked = true
           WHERE token_hash = $1 AND is_revoked = false
           RETURNING id, token_family, user_id`,
          [refreshTokenHash]
        );
      } else {
        throw err;
      }
    }

    // If 0 rows returned, the token either never existed or was already revoked/rotated.
    if (updateRes.rows.length === 0) {
      const existing = await queryOne<{ token_family: string; is_revoked: boolean }>(
        'SELECT token_family, is_revoked FROM refresh_tokens WHERE token_hash = $1',
        [refreshTokenHash]
      );

      const familyId = existing?.token_family || payload.tokenFamily;
      if (familyId) {
        // Reuse detection: revoke all tokens belonging to this family immediately
        await query(
          'UPDATE refresh_tokens SET is_revoked = true WHERE token_family = $1',
          [familyId]
        );
        try {
          await query(
            `INSERT INTO refresh_tokens (user_id, token_hash, token_family, is_revoked, expires_at)
             VALUES ($1, $2, $3, true, NOW() + INTERVAL '7 days')`,
            [payload.userId, `family_revoked:${familyId}`, familyId]
          );
        } catch {
          // Ignore unique conflict
        }
      }

      await deleteRefreshTokenCookie();

      const isReuse = existing && existing.is_revoked;
      const errorResponse = NextResponse.json(
        isReuse
          ? { error: 'Refresh token has been reused', code: 'REFRESH_TOKEN_REUSED' }
          : { error: 'Refresh token not found', code: 'REFRESH_TOKEN_NOT_FOUND' },
        { status: 401 }
      );
      clearAuthCookies(errorResponse, request.headers);
      return errorResponse;
    }

    // Exactly 1 row returned — this request won the atomic claim
    const { token_family: tokenFamily, user_id: userId } = updateRes.rows[0];

    // Verify user is active
    const userResult = await query(
      'SELECT id, email, role FROM users WHERE id = $1 AND is_active = true',
      [userId]
    );

    if (userResult.rows.length === 0) {
      await deleteRefreshTokenCookie();
      const response = NextResponse.json(
        { error: 'User not found or inactive' },
        { status: 401 }
      );
      clearAuthCookies(response, request.headers);
      return response;
    }

    const user = userResult.rows[0];

    // Issue new token pair preserving the exact tokenFamily
    const newAccessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      orgId: payload.orgId,
    });

    const newRefreshToken = generateRefreshToken({
      userId: user.id,
      tokenFamily,
      email: user.email,
      role: user.role,
      orgId: payload.orgId,
    });

    const newRefreshTokenHash = crypto
      .createHash('sha256')
      .update(newRefreshToken)
      .digest('hex');

    // Store new refresh token
    try {
      await query(
        `INSERT INTO refresh_tokens (user_id, token_hash, token_family, parent_hash, expires_at)
         VALUES ($1, $2, $3, $4, NOW() + INTERVAL '7 days')`,
        [user.id, newRefreshTokenHash, tokenFamily, refreshTokenHash]
      );
    } catch (err: any) {
      if (err?.code === '42703') {
        // Fallback if parent_hash column not present yet (pre-migration 0049)
        await query(
          `INSERT INTO refresh_tokens (user_id, token_hash, token_family, expires_at)
           VALUES ($1, $2, $3, NOW() + INTERVAL '7 days')`,
          [user.id, newRefreshTokenHash, tokenFamily]
        );
      } else {
        throw err;
      }
    }

    // In concurrent race conditions, check if the family was revoked by another request during rotation
    const familyRevokedMarker = await queryOne<{ id: string }>(
      'SELECT id FROM refresh_tokens WHERE token_hash = $1',
      [`family_revoked:${tokenFamily}`]
    );
    if (familyRevokedMarker) {
      await query(
        'UPDATE refresh_tokens SET is_revoked = true WHERE token_family = $1',
        [tokenFamily]
      );
    }

    const sessionConfig = getDefaultSessionConfig(request.headers);

    // Set new refresh token cookie via helper
    await setRefreshTokenCookie(newRefreshToken, refreshConfig, request.headers);

    const response = NextResponse.json(
      { accessToken: newAccessToken },
      { status: 200 }
    );

    // Set access token in session cookie
    response.cookies.set(sessionConfig.cookieName, newAccessToken, {
      httpOnly: sessionConfig.cookieHttpOnly,
      secure: sessionConfig.cookieSecure,
      sameSite: sessionConfig.cookieSameSite,
      maxAge: sessionConfig.maxAge,
      domain: sessionConfig.cookieDomain,
      path: '/',
    });

    // Set new refresh token in refresh cookie
    response.cookies.set(refreshConfig.cookieName, newRefreshToken, {
      httpOnly: refreshConfig.cookieHttpOnly,
      secure: refreshConfig.cookieSecure,
      sameSite: refreshConfig.cookieSameSite,
      maxAge: refreshConfig.maxAge,
      domain: refreshConfig.cookieDomain,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Refresh error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
