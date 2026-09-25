import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { deleteRefreshTokenCookie, getRefreshTokenFromCookie } from '@/lib/auth/session';
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

    // Delete cookie
    await deleteRefreshTokenCookie();

    return NextResponse.json(
      { message: 'Logged out successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
