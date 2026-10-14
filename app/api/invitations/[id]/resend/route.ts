import { NextRequest } from 'next/server';
import { getAuthFromRequest } from '@/lib/auth/middleware';
import { resendInvitation } from '@/lib/services/invitation-service';
import { checkRateLimit, createRateLimitExceededResponse, INVITE_RATE_LIMITS } from '@/lib/security/rate-limit';
import { apiSuccess, apiError, handleApiError } from '@/lib/utils/response';

/**
 * POST /api/invitations/[id]/resend
 * Resends an existing invitation by refreshing its token and expiry.
 * Enforces owner/admin permissions and cross-organization tenant isolation (returns 404).
 * Returns 409 if invitation is revoked.
 * Guaranteed zero leakage of rawToken or token_hash.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth || !auth.orgId) {
      return apiError('Unauthorized: Active organization session required', 401, 'UNAUTHORIZED');
    }

    const { id } = await params;
    if (!id) {
      return apiError('Invitation ID is required', 400, 'INVALID_INPUT');
    }

    // Rate limiting: 5 per hour per invitation
    const rateLimit = checkRateLimit(`invite:resend:${id}`, INVITE_RATE_LIMITS.INVITE_RESEND);
    if (!rateLimit.allowed) {
      return createRateLimitExceededResponse(rateLimit);
    }

    const result = await resendInvitation(
      {
        userId: auth.userId,
        orgId: auth.orgId,
        email: auth.email,
      },
      id
    );

    if (!result.success) {
      if (result.error === 'not_found') {
        return apiError(result.message, 404, 'NOT_FOUND');
      }
      if (result.error === 'forbidden') {
        return apiError(result.message, 403, 'FORBIDDEN');
      }
      if (result.error === 'unauthorized') {
        return apiError(result.message, 401, 'UNAUTHORIZED');
      }
      if (result.error === 'invalid_status') {
        return apiError(result.message, 409, 'INVALID_STATUS');
      }
      return apiError(result.message, 400, 'BAD_REQUEST');
    }

    // Never return token or token_hash in API response
    const { token_hash, ...safeInvitation } = result.invitation as any;

    const url = new URL(request.url);
    const returnLinkQuery = url.searchParams.get('returnLink') === 'true';
    let returnLinkBody = false;
    try {
      const cloned = request.clone();
      const body = await cloned.json();
      if (body?.returnLink) returnLinkBody = true;
    } catch {
      // Body may be empty
    }
    const wantsLink = returnLinkQuery || returnLinkBody;

    const baseUrl = (process.env.APP_PUBLIC_URL || 'http://localhost:3000').replace(/\/$/, '');
    const inviteLink = result.rawToken ? `${baseUrl}/invite/${result.rawToken}` : undefined;

    return apiSuccess({
      invitation: safeInvitation,
      sendFailed: result.sendFailed || false,
      warning: result.warning,
      ...(wantsLink && inviteLink ? { inviteLink } : {}),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
