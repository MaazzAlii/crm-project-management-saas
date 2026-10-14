import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/lib/auth/middleware';
import { acceptInvitation } from '@/lib/services/invitation-service';
import { checkRateLimit, createRateLimitExceededResponse, getClientIp, INVITE_RATE_LIMITS } from '@/lib/security/rate-limit';
import { apiSuccess, apiError, handleApiError } from '@/lib/utils/response';

/**
 * POST /api/invitations/accept
 * Body: { token }
 * Uses active session context (cookies or header).
 * Enforces email matching (wrongAccount 403), active session presence (needsAccount 401),
 * and transactional seat capacity checks.
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 30 per hour per IP
    const ip = getClientIp(request);
    const rateLimit = checkRateLimit(`invite:accept_decline:${ip}`, INVITE_RATE_LIMITS.ACCEPT_DECLINE);
    if (!rateLimit.allowed) {
      return createRateLimitExceededResponse(rateLimit);
    }
    let body: any;
    try {
      body = await request.json();
    } catch {
      return apiError('Invalid JSON payload', 400, 'INVALID_INPUT');
    }

    const token = body?.token;
    if (!token || typeof token !== 'string') {
      return apiError('Token is required', 400, 'INVALID_INPUT');
    }

    const auth = getAuthFromRequest(request);

    const result = await acceptInvitation(token, auth);

    if (!result.success) {
      if (result.error === 'needs_account') {
        return apiError(result.message, 401, 'NEEDS_ACCOUNT', {
          needsAccount: true,
          email: result.email,
          organizationId: result.organizationId,
          role: result.role,
        });
      }

      if (result.error === 'wrong_account') {
        return apiError(result.message, 403, 'WRONG_ACCOUNT', {
          expectedEmail: result.expectedEmail,
          currentEmail: result.currentEmail,
        });
      }

      if (result.error === 'seat_limit_reached') {
        const currentCount = (result as any).currentCount ?? (result as any).maxMembers;
        const limit = (result as any).limit ?? (result as any).maxMembers;
        const planName = (result as any).planName || 'Free';
        const upgradeUrl = (result as any).upgradeUrl || '/settings/billing';

        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'SEAT_LIMIT_REACHED',
              message: result.message,
              currentCount,
              limit,
              planName,
              upgradeUrl,
              details: {
                currentCount,
                limit,
                planName,
                upgradeUrl,
              },
            },
          },
          { status: 402 }
        );
      }

      if (result.error === 'already_accepted') {
        return apiError(result.message, 400, 'ALREADY_ACCEPTED');
      }

      if (result.error === 'revoked') {
        return apiError(result.message, 400, 'REVOKED');
      }

      if (result.error === 'expired') {
        return apiError(result.message, 410, 'EXPIRED');
      }

      return apiError(result.message, 400, 'INVALID_OR_EXPIRED');
    }

    // Strip sensitive token_hash
    const { token_hash, ...safeInvitation } = result.invitation as any;

    return apiSuccess({
      invitation: safeInvitation,
      organizationId: result.organizationId,
      role: result.role,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
