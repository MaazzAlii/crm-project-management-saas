import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { verifyPassword } from '@/lib/auth/password';
import { generateAccessToken, generateRefreshToken } from '@/lib/auth/jwt';
import { setRefreshTokenCookie } from '@/lib/auth/session';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user
    const result = await query(
      'SELECT id, email, password_hash, role FROM users WHERE email = $1 AND is_active = true',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const user = result.rows[0];

    // Verify password
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Generate tokens
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

    // Store refresh token hash
    const refreshTokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    await query(
      `INSERT INTO refresh_tokens (user_id, token_hash, token_family, expires_at)
       VALUES ($1, $2, $3, NOW() + INTERVAL '7 days')`,
      [user.id, refreshTokenHash, tokenFamily]
    );

    // Update last login
    await query(
      'UPDATE users SET last_login_at = NOW() WHERE id = $1',
      [user.id]
    );

    // Set refresh token cookie
    await setRefreshTokenCookie(refreshToken);

    return NextResponse.json(
      {
        accessToken,
        user: { id: user.id, email: user.email, role: user.role },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
