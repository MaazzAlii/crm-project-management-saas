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
import { transaction } from '@/lib/db';

let hasRotatedAtColumn: boolean | null = null;
let hasParentHashColumn: boolean | null = null;

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

    // Execute atomic rotation inside an ACID transaction with advisory transaction lock.
    // Serializes concurrent requests within the same tokenFamily to prevent TOCTOU race conditions.
    const result = await transaction(async (client) => {
      await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [payload.tokenFamily]);

      // Check migration 0049 columns compatibility once
      if (hasRotatedAtColumn === null) {
        const checkRotated = await client.query(
          "SELECT 1 FROM information_schema.columns WHERE table_name = 'refresh_tokens' AND column_name = 'rotated_at'"
        );
        hasRotatedAtColumn = checkRotated.rows.length > 0;
      }

      if (hasParentHashColumn === null) {
        const checkParent = await client.query(
          "SELECT 1 FROM information_schema.columns WHERE table_name = 'refresh_tokens' AND column_name = 'parent_hash'"
        );
        hasParentHashColumn = checkParent.rows.length > 0;
      }

      // CRITICAL: Atomic token claim with RETURNING clause
      const updateQuery = hasRotatedAtColumn
        ? `UPDATE refresh_tokens
           SET is_revoked = true, rotated_at = NOW()
           WHERE token_hash = $1 AND is_revoked = false
           RETURNING id, token_family, user_id`
        : `UPDATE refresh_tokens
           SET is_revoked = true
           WHERE token_hash = $1 AND is_revoked = false
           RETURNING id, token_family, user_id`;

      const updateRes = await client.query<{ id: string; token_family: string; user_id: string }>(
        updateQuery,
        [refreshTokenHash]
      );

      // If 0 rows returned, the token either never existed or was already revoked/rotated.
      if (updateRes.rows.length === 0) {
        const existingRes = await client.query<{ token_family: string; is_revoked: boolean }>(
          'SELECT token_family, is_revoked FROM refresh_tokens WHERE token_hash = $1',
          [refreshTokenHash]
        );
        const existing = existingRes.rows[0];

        const familyId = existing?.token_family || payload.tokenFamily;
        if (familyId) {
          // Reuse detection: revoke all tokens belonging to this family immediately
          await client.query(
            'UPDATE refresh_tokens SET is_revoked = true WHERE token_family = $1',
            [familyId]
          );
        }

        const isReuse = existing && existing.is_revoked;
        return {
          status: 401 as const,
          errorBody: isReuse
            ? { error: 'Refresh token has been reused', code: 'REFRESH_TOKEN_REUSED' }
            : { error: 'Refresh token not found', code: 'REFRESH_TOKEN_NOT_FOUND' },
        };
      }

      // Exactly 1 row returned — won atomic claim
      const { token_family: tokenFamily, user_id: userId } = updateRes.rows[0];

      // Verify user is active
      const userResult = await client.query<{ id: string; email: string; role: any }>(
        'SELECT id, email, role FROM users WHERE id = $1 AND is_active = true',
        [userId]
      );

      if (userResult.rows.length === 0) {
        return {
          status: 401 as const,
          errorBody: { error: 'User not found or inactive' },
        };
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
      if (hasParentHashColumn) {
        await client.query(
          `INSERT INTO refresh_tokens (user_id, token_hash, token_family, parent_hash, expires_at)
           VALUES ($1, $2, $3, $4, NOW() + INTERVAL '7 days')`,
          [user.id, newRefreshTokenHash, tokenFamily, refreshTokenHash]
        );
      } else {
        await client.query(
          `INSERT INTO refresh_tokens (user_id, token_hash, token_family, expires_at)
           VALUES ($1, $2, $3, NOW() + INTERVAL '7 days')`,
          [user.id, newRefreshTokenHash, tokenFamily]
        );
      }

      return {
        status: 200 as const,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    });

    if (result.status === 401) {
      await deleteRefreshTokenCookie();
      const response = NextResponse.json(result.errorBody, { status: 401 });
      clearAuthCookies(response, request.headers);
      return response;
    }

    const sessionConfig = getDefaultSessionConfig(request.headers);

    // Set new refresh token cookie via helper
    await setRefreshTokenCookie(result.refreshToken, refreshConfig, request.headers);

    const response = NextResponse.json(
      { accessToken: result.accessToken },
      { status: 200 }
    );

    // Set access token in session cookie
    response.cookies.set(sessionConfig.cookieName, result.accessToken, {
      httpOnly: sessionConfig.cookieHttpOnly,
      secure: sessionConfig.cookieSecure,
      sameSite: sessionConfig.cookieSameSite,
      maxAge: sessionConfig.maxAge,
      domain: sessionConfig.cookieDomain,
      path: '/',
    });

    // Set new refresh token in refresh cookie
    response.cookies.set(refreshConfig.cookieName, result.refreshToken, {
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
