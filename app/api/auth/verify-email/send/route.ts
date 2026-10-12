import { NextRequest } from 'next/server';
import { getAuthFromRequest } from '@/lib/auth/middleware';
import { userRepo } from '@/lib/db/repositories/user-repo';
import { emailVerificationRepo } from '@/lib/db/repositories/email-verification-repo';
import { generateToken, hashToken } from '@/lib/security/invite-token';
import { checkRateLimit, createRateLimitExceededResponse, INVITE_RATE_LIMITS } from '@/lib/security/rate-limit';
import { apiSuccess, apiError, handleApiError } from '@/lib/utils/response';

/**
 * POST /api/auth/verify-email/send
 * Sends an email verification link to the logged-in user.
 * Invalidates older unconsumed codes and enforces a 60-second rate limit.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth || !auth.userId) {
      return apiError('Unauthorized: Authentication required', 401, 'UNAUTHORIZED');
    }

    // Rate limiting: 1 send per 60 seconds per user
    const rateLimit = checkRateLimit(`verify-email:send:${auth.userId}`, INVITE_RATE_LIMITS.VERIFY_EMAIL_SEND);
    if (!rateLimit.allowed) {
      return createRateLimitExceededResponse(rateLimit);
    }

    const user = await userRepo.findById(auth.userId);
    if (!user) {
      return apiError('User not found', 404, 'NOT_FOUND');
    }

    // Rate limiting: 1 send per 60 seconds per user
    const latest = await emailVerificationRepo.getLatest(auth.userId);
    if (latest) {
      const timeSinceLastSend = Date.now() - new Date(latest.created_at).getTime();
      if (timeSinceLastSend < 60000) {
        const waitSeconds = Math.ceil((60000 - timeSinceLastSend) / 1000);
        return apiError(
          `Rate limit exceeded. Please wait ${waitSeconds} seconds before requesting another verification email.`,
          429,
          'RATE_LIMIT_EXCEEDED'
        );
      }
    }

    // Invalidate any older unconsumed codes for this user
    await emailVerificationRepo.invalidateOlder(auth.userId);

    // Generate secure token and record
    const rawToken = generateToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours expiry

    await emailVerificationRepo.insertVerification(
      auth.userId,
      user.email,
      tokenHash,
      expiresAt
    );

    // Email dispatch (console / provider mock until prompt 29)
    console.log(`[VERIFY_EMAIL_SENT] To: ${user.email}, UserId: ${auth.userId}`);

    return apiSuccess({
      success: true,
      message: 'Verification email sent successfully',
    });
  } catch (error) {
    return handleApiError(error);
  }
}
