import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { verifyPassword } from '@/lib/auth/password';
import { generateAccessToken, generateRefreshToken } from '@/lib/auth/jwt';
import { setRefreshTokenCookie, getDefaultSessionConfig, getRefreshSessionConfig } from '@/lib/auth/session';
import { query } from '@/lib/db';
import { ensureAutoMigrated } from '@/lib/db/auto-migrate';
import { userRepo } from '@/lib/db/repositories/user-repo';
import { checkLoginRateLimit, resetLoginRateLimit, getClientIp } from '@/lib/security/rate-limit';

export async function POST(request: NextRequest) {
  try {
    let email = '';
    let password = '';
    try {
      const body = await request.json();
      email = body?.email;
      password = body?.password;
    } catch {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Per-email (10/15min) and per-IP (50/15min) login rate limiting
    const clientIp = getClientIp(request);
    const loginRateResult = checkLoginRateLimit(email, clientIp);
    if (!loginRateResult.allowed) {
      const retryAfter = loginRateResult.retryAfterSeconds || 60;
      return NextResponse.json(
        {
          success: false,
          error: `Too many login attempts. Try again in ${retryAfter} seconds.`,
          retryAfterSeconds: retryAfter,
        },
        {
          status: 429,
          headers: { 'Retry-After': retryAfter.toString() },
        }
      );
    }

    // Ensure database schema and admin are ready
    await ensureAutoMigrated();

    // Find user
    const result = await query(
      'SELECT id, email, password_hash, role, require_password_change FROM users WHERE email = $1 AND is_active = true',
      [email.toLowerCase().trim()]
    );

    let user = result.rows[0];

    if (!user) {
      // Check if there is an active pending invitation with a temporary password
      const pendingInviteRes = await query(
        `SELECT * FROM invitations 
         WHERE lower(trim(email)) = $1 
           AND status = 'pending' 
           AND expires_at > NOW() 
           AND temp_password_hash IS NOT NULL 
         ORDER BY created_at DESC 
         LIMIT 1`,
        [email.toLowerCase().trim()]
      );

      if (pendingInviteRes.rows.length > 0) {
        const invite = pendingInviteRes.rows[0];
        const isTempValid = await verifyPassword(password, invite.temp_password_hash);
        if (!isTempValid) {
          return NextResponse.json(
            { error: 'Invalid password. Please use the invitation link sent to your email to set your password.' },
            { status: 401 }
          );
        }

        // Auto-provision user account with temporary password & require_password_change = true
        user = await userRepo.create({
          email: invite.email.toLowerCase().trim(),
          passwordHash: invite.temp_password_hash,
          role: 'user',
          requirePasswordChange: true,
        });

        // Join the invited organization
        await query(
          `INSERT INTO organization_members (organization_id, user_id, role, invited_by)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (organization_id, user_id) DO NOTHING`,
          [invite.organization_id, user.id, invite.role, invite.invited_by || null]
        );

        // Mark invitation as accepted
        await query(
          `UPDATE invitations
           SET status = 'accepted', accepted_at = NOW(), accepted_by = $1, updated_at = NOW()
           WHERE id = $2`,
          [user.id, invite.id]
        );
      } else {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        );
      }
    } else {
      // Verify password for existing user
      const isValid = await verifyPassword(password, user.password_hash);
      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        );
      }
    }

    // Find primary organization for user
    const memberRes = await query(
      'SELECT organization_id FROM organization_members WHERE user_id = $1 ORDER BY created_at ASC LIMIT 1',
      [user.id]
    );
    const orgId = memberRes.rows[0]?.organization_id;

    const requirePasswordChange = Boolean(user.require_password_change);

    // Generate tokens
    const tokenFamily = crypto.randomUUID();
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      orgId,
      requirePasswordChange,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      tokenFamily,
      email: user.email,
      role: user.role,
      orgId,
      requirePasswordChange,
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

    // Successful login — reset the per-email failed attempt counter
    resetLoginRateLimit(user.email);

    // Get session config adapted to request headers (x-forwarded-proto, etc.)
    const sessionConfig = getDefaultSessionConfig(request.headers);
    const refreshConfig = getRefreshSessionConfig(request.headers);

    // Set refresh token cookie via helper
    await setRefreshTokenCookie(refreshToken, refreshConfig, request.headers);

    const responsePayload: any = {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        orgId,
        requirePasswordChange,
      },
    };

    if (requirePasswordChange) {
      responsePayload.requirePasswordChange = true;
      responsePayload.redirectTo = '/auth/change-password?required=1';
    }

    const response = NextResponse.json(responsePayload, { status: 200 });

    // Attach access token directly to the outgoing NextResponse session cookie
    response.cookies.set(sessionConfig.cookieName, accessToken, {
      httpOnly: sessionConfig.cookieHttpOnly,
      secure: sessionConfig.cookieSecure,
      sameSite: sessionConfig.cookieSameSite,
      maxAge: sessionConfig.maxAge,
      domain: sessionConfig.cookieDomain,
      path: '/',
    });

    // Attach refresh token to dedicated refresh cookie
    response.cookies.set(refreshConfig.cookieName, refreshToken, {
      httpOnly: refreshConfig.cookieHttpOnly,
      secure: refreshConfig.cookieSecure,
      sameSite: refreshConfig.cookieSameSite,
      maxAge: refreshConfig.maxAge,
      domain: refreshConfig.cookieDomain,
      path: '/',
    });

    if (orgId) {
      response.cookies.set('organization_id', orgId, {
        httpOnly: false,
        secure: sessionConfig.cookieSecure,
        sameSite: sessionConfig.cookieSameSite,
        maxAge: sessionConfig.maxAge,
        domain: sessionConfig.cookieDomain,
        path: '/',
      });
    }

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
