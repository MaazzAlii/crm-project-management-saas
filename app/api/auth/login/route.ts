import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { verifyPassword } from '@/lib/auth/password';
import { generateAccessToken, generateRefreshToken } from '@/lib/auth/jwt';
import { setRefreshTokenCookie, getDefaultSessionConfig } from '@/lib/auth/session';
import { query } from '@/lib/db';
import { ensureAutoMigrated } from '@/lib/db/auto-migrate';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Ensure database schema and admin are ready
    await ensureAutoMigrated();

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
      email: user.email,
      role: user.role,
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

    // Get session config adapted to request headers (x-forwarded-proto, etc.)
    const sessionConfig = getDefaultSessionConfig(request.headers);

    // Set refresh token cookie via helper
    await setRefreshTokenCookie(refreshToken, sessionConfig, request.headers);

    const response = NextResponse.json(
      {
        accessToken,
        user: { id: user.id, email: user.email, role: user.role },
      },
      { status: 200 }
    );

    // Also attach cookie directly to the outgoing NextResponse
    response.cookies.set(sessionConfig.cookieName, refreshToken, {
      httpOnly: sessionConfig.cookieHttpOnly,
      secure: sessionConfig.cookieSecure,
      sameSite: sessionConfig.cookieSameSite,
      maxAge: sessionConfig.maxAge,
      domain: sessionConfig.cookieDomain,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
