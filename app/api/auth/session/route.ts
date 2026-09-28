import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getAuthFromRequest } from '@/lib/auth/middleware';
import { getRefreshTokenFromCookie } from '@/lib/auth/session';
import { verifyRefreshToken } from '@/lib/auth/jwt';
import { queryOne } from '@/lib/db';
import { User } from '@/lib/types/database';

export async function GET(request: NextRequest) {
  try {
    let userId: string | null = null;

    // 1. Try Bearer token from header
    const auth = getAuthFromRequest(request);
    if (auth) {
      userId = auth.userId;
    } else {
      // 2. Try refresh token cookie
      const refreshToken = await getRefreshTokenFromCookie();
      if (refreshToken) {
        const payload = verifyRefreshToken(refreshToken);
        if (payload) {
          const tokenHash = crypto
            .createHash('sha256')
            .update(refreshToken)
            .digest('hex');

          // Check token in DB
          const tokenRecord = await queryOne<{ user_id: string }>(
            `SELECT user_id FROM refresh_tokens 
             WHERE token_hash = $1 
               AND is_revoked = false 
               AND expires_at > NOW()`,
            [tokenHash]
          );

          if (tokenRecord) {
            userId = tokenRecord.user_id;
          }
        }
      }
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized: No valid session or token found' },
        { status: 401 }
      );
    }

    // Fetch user details
    const user = await queryOne<User>(
      `SELECT id, email, full_name, avatar_url, role, is_active, email_verified, last_login_at, created_at 
       FROM users 
       WHERE id = $1 AND is_active = true`,
      [userId]
    );

    if (!user) {
      return NextResponse.json(
        { error: 'User not found or inactive' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        avatarUrl: user.avatar_url,
        role: user.role,
        emailVerified: user.email_verified,
        lastLoginAt: user.last_login_at,
        createdAt: user.created_at,
      },
    });
  } catch (error: any) {
    console.error('Session check error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
