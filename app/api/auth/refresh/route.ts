import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { verifyRefreshToken, generateAccessToken, generateRefreshToken } from '@/lib/auth/jwt';
import { getRefreshTokenFromCookie, setRefreshTokenCookie, deleteRefreshTokenCookie } from '@/lib/auth/session';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Get refresh token from cookie
    const refreshToken = await getRefreshTokenFromCookie();

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token missing' },
        { status: 401 }
      );
    }

    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      await deleteRefreshTokenCookie();
      return NextResponse.json(
        { error: 'Refresh token expired or invalid' },
        { status: 401 }
      );
    }

    // Check if token is revoked in database
    const refreshTokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    const tokenResult = await query(
      'SELECT is_revoked FROM refresh_tokens WHERE token_hash = $1 AND user_id = $2',
      [refreshTokenHash, payload.userId]
    );

    if (tokenResult.rows.length === 0 || tokenResult.rows[0].is_revoked) {
      await deleteRefreshTokenCookie();
      return NextResponse.json(
        { error: 'Refresh token revoked' },
        { status: 401 }
      );
    }

    // Get user data
    const userResult = await query(
      'SELECT id, email, role FROM users WHERE id = $1 AND is_active = true',
      [payload.userId]
    );

    if (userResult.rows.length === 0) {
      await deleteRefreshTokenCookie();
      return NextResponse.json(
        { error: 'User not found or inactive' },
        { status: 401 }
      );
    }

    const user = userResult.rows[0];

    // Generate new tokens
    const newAccessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const newRefreshToken = generateRefreshToken({
      userId: user.id,
      tokenFamily: payload.tokenFamily,
    });

    // Store new refresh token
    const newRefreshTokenHash = crypto
      .createHash('sha256')
      .update(newRefreshToken)
      .digest('hex');

    await query(
      `INSERT INTO refresh_tokens (user_id, token_hash, token_family, expires_at)
       VALUES ($1, $2, $3, NOW() + INTERVAL '7 days')`,
      [user.id, newRefreshTokenHash, payload.tokenFamily]
    );

    // Set new refresh token cookie
    await setRefreshTokenCookie(newRefreshToken);

    return NextResponse.json(
      { accessToken: newAccessToken },
      { status: 200 }
    );
  } catch (error) {
    console.error('Refresh error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
