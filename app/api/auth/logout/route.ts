import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { deleteRefreshTokenCookie, getRefreshTokenFromCookie, getDefaultSessionConfig } from '@/lib/auth/session';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const refreshToken = await getRefreshTokenFromCookie();

    if (refreshToken) {
      // Revoke the token in database
      const refreshTokenHash = crypto
        .createHash('sha256')
        .update(refreshToken)
        .digest('hex');

      await query(
        'UPDATE refresh_tokens SET is_revoked = true WHERE token_hash = $1',
        [refreshTokenHash]
      );
    }

    // Delete cookie via helper
    await deleteRefreshTokenCookie();

    const response = NextResponse.json(
      { message: 'Logged out successfully' },
      { status: 200 }
    );

    const sessionConfig = getDefaultSessionConfig();
    response.cookies.set(sessionConfig.cookieName, '', {
      httpOnly: sessionConfig.cookieHttpOnly,
      secure: sessionConfig.cookieSecure,
      sameSite: sessionConfig.cookieSameSite,
      maxAge: 0,
      domain: sessionConfig.cookieDomain,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
