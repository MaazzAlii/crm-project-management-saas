import { NextRequest, NextResponse } from 'next/server';
import { emailVerificationRepo } from '@/lib/db/repositories/email-verification-repo';
import { userRepo } from '@/lib/db/repositories/user-repo';
import { hashToken } from '@/lib/security/invite-token';
import { apiSuccess, apiError, handleApiError } from '@/lib/utils/response';

/**
 * GET /api/auth/verify-email/confirm?token=<rawToken>
 * Consumes the token and redirects the user to /login?verified=true.
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token');
    if (!token || typeof token !== 'string') {
      const url = new URL('/login', request.url);
      url.searchParams.set('verify_error', 'INVALID_REQUEST');
      return NextResponse.redirect(url, 302);
    }

    const tokenHash = hashToken(token.trim());
    const verification = await emailVerificationRepo.findByTokenHash(tokenHash);

    if (!verification) {
      const url = new URL('/login', request.url);
      url.searchParams.set('verify_error', 'INVALID_TOKEN');
      return NextResponse.redirect(url, 302);
    }

    if (verification.consumed_at) {
      const url = new URL('/login', request.url);
      url.searchParams.set('verified', 'true');
      return NextResponse.redirect(url, 302);
    }

    if (new Date(verification.expires_at) < new Date()) {
      const url = new URL('/login', request.url);
      url.searchParams.set('verify_error', 'TOKEN_EXPIRED');
      return NextResponse.redirect(url, 302);
    }

    // Atomically consume token
    const consumed = await emailVerificationRepo.consume(verification.id);
    if (!consumed) {
      const url = new URL('/login', request.url);
      url.searchParams.set('verified', 'true');
      return NextResponse.redirect(url, 302);
    }

    // Mark user email as verified
    await userRepo.verifyEmail(verification.user_id);

    const url = new URL('/login', request.url);
    url.searchParams.set('verified', 'true');
    return NextResponse.redirect(url, 302);
  } catch {
    const url = new URL('/login', request.url);
    url.searchParams.set('verify_error', 'SERVER_ERROR');
    return NextResponse.redirect(url, 302);
  }
}

/**
 * POST /api/auth/verify-email/confirm
 * Body: { token }
 * Consumes the verification token atomically and sets users.email_verified_at.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || !body.token || typeof body.token !== 'string') {
      return apiError('Verification token is required', 400, 'INVALID_REQUEST');
    }

    const tokenHash = hashToken(body.token.trim());
    const verification = await emailVerificationRepo.findByTokenHash(tokenHash);

    if (!verification) {
      return apiError('Invalid or expired verification token', 400, 'INVALID_TOKEN');
    }

    if (verification.consumed_at) {
      return apiError('Verification token has already been used', 400, 'TOKEN_ALREADY_USED');
    }

    if (new Date(verification.expires_at) < new Date()) {
      return apiError('Verification token has expired', 400, 'TOKEN_EXPIRED');
    }

    // Atomically consume token
    const consumed = await emailVerificationRepo.consume(verification.id);
    if (!consumed) {
      return apiError('Verification token has already been used', 400, 'TOKEN_ALREADY_USED');
    }

    // Mark user email as verified
    await userRepo.verifyEmail(verification.user_id);

    return apiSuccess({
      success: true,
      message: 'Email address verified successfully',
    });
  } catch (error) {
    return handleApiError(error);
  }
}
