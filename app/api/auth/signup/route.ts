import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { hashPassword, validatePasswordStrength, calculatePasswordStrength } from '@/lib/auth/password';
import { generateAccessToken, generateRefreshToken } from '@/lib/auth/jwt';
import { setRefreshTokenCookie, getDefaultSessionConfig } from '@/lib/auth/session';
import { query } from '@/lib/db';
import { ensureAutoMigrated } from '@/lib/db/auto-migrate';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName } = await request.json();

    // 1. Validate required fields
    if (!email || typeof email !== 'string' || !email.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            field: 'email',
            message: 'Email address is required.',
          },
        },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    if (!EMAIL_REGEX.test(cleanEmail)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            field: 'email',
            message: 'Please enter a valid email address.',
          },
        },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            field: 'password',
            message: 'Password is required.',
          },
        },
        { status: 400 }
      );
    }

    // 2. Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    const passwordStrength = calculatePasswordStrength(password);
    if (!passwordValidation.isValid || passwordStrength.score < 3) {
      const errorMsg =
        passwordValidation.errors.length > 0
          ? passwordValidation.errors.join('. ')
          : 'Password is too weak. Please choose a stronger password.';
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            field: 'password',
            message: errorMsg,
          },
        },
        { status: 400 }
      );
    }

    // Ensure database schema and admin are ready
    await ensureAutoMigrated();

    // 3. Check duplicate email
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [cleanEmail]
    );

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'EMAIL_ALREADY_EXISTS',
            field: 'email',
            message: 'User with this email already exists',
          },
        },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const result = await query(
      `INSERT INTO users (email, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, role`,
      [email.toLowerCase(), passwordHash, fullName || null, 'user']
    );

    const user = result.rows[0];

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

    // Mirror to public.profiles and auth.users for relational integrity
    try {
      await query(
        'INSERT INTO auth.users (id, email) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [user.id, email.toLowerCase()]
      );
      await query(
        `INSERT INTO public.profiles (id, email, full_name)
         VALUES ($1, $2, $3)
         ON CONFLICT (id) DO NOTHING`,
        [user.id, email.toLowerCase(), fullName || null]
      );
    } catch {}

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

    // Get session config adapted to request headers (x-forwarded-proto, etc.)
    const sessionConfig = getDefaultSessionConfig(request.headers);

    // Set refresh token cookie via helper
    await setRefreshTokenCookie(refreshToken, sessionConfig, request.headers);

    // Trigger email verification token creation & send (graceful failure)
    try {
      const { emailVerificationRepo } = await import('@/lib/db/repositories/email-verification-repo');
      const { generateToken, hashToken } = await import('@/lib/security/invite-token');
      const { sendEmail } = await import('@/lib/email/sender');
      const { renderVerifyEmail } = await import('@/lib/email/templates');

      const verifyToken = generateToken();
      const verifyTokenHash = hashToken(verifyToken);
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await emailVerificationRepo.insertVerification(user.id, user.email, verifyTokenHash, expiresAt);

      const emailContent = renderVerifyEmail({
        rawToken: verifyToken,
        userEmail: user.email,
        userName: fullName || undefined,
      });

      await sendEmail({
        to: user.email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      });
    } catch (e) {
      console.warn('[SIGNUP_ROUTE_VERIFICATION_EMAIL_FAILED]', e);
    }

    const response = NextResponse.json(
      {
        success: true,
        message: 'User created successfully',
        accessToken,
        user: { id: user.id, email: user.email },
      },
      { status: 201 }
    );

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
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
