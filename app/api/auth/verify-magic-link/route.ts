import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { verifyMagicLinkToken } from '@/lib/auth/magic-link';
import { generateAccessToken, generateRefreshToken } from '@/lib/auth/jwt';
import { setRefreshTokenCookie } from '@/lib/auth/session';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { email, token } = await request.json();

    if (!email || !token) {
      return NextResponse.json(
        { error: 'Email and verification token are required' },
        { status: 400 }
      );
    }

    const user = await verifyMagicLinkToken(email, token);

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid, expired, or previously used magic link token' },
        { status: 401 }
      );
    }

    // Generate token family and JWT tokens
    const tokenFamily = crypto.randomUUID();
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      tokenFamily,
    });

    const refreshTokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    // Store refresh token
    await query(
      `INSERT INTO refresh_tokens (user_id, token_hash, token_family, expires_at)
       VALUES ($1, $2, $3, NOW() + INTERVAL '7 days')`,
      [user.id, refreshTokenHash, tokenFamily]
    );

    // Set refresh token cookie
    await setRefreshTokenCookie(refreshToken);

    return NextResponse.json({
      message: 'Authentication successful',
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        emailVerified: user.email_verified,
      },
    });
  } catch (error: any) {
    console.error('Magic link verification error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error during verification' },
      { status: 500 }
    );
  }
}
