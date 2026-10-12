import { NextRequest } from 'next/server';
import { getAuthFromRequest } from '@/lib/auth/middleware';
import { acceptInvitation } from '@/lib/services/invitation-service';
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
        return apiError(result.message, 403, 'SEAT_LIMIT_REACHED');
      }

      if (result.error === 'already_accepted') {
        return apiError(result.message, 400, 'ALREADY_ACCEPTED');
      }

      if (result.error === 'revoked') {
        return apiError(result.message, 400, 'REVOKED');
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
