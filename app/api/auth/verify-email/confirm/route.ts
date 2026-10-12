import { NextRequest } from 'next/server';
import { emailVerificationRepo } from '@/lib/db/repositories/email-verification-repo';
import { userRepo } from '@/lib/db/repositories/user-repo';
import { hashToken } from '@/lib/security/invite-token';
import { apiSuccess, apiError, handleApiError } from '@/lib/utils/response';

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
