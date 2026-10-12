import { NextRequest } from 'next/server';
import { getAuthFromRequest } from '@/lib/auth/middleware';
import { revokeInvitation } from '@/lib/services/invitation-service';
import { apiSuccess, apiError, handleApiError } from '@/lib/utils/response';

/**
 * POST /api/invitations/[id]/revoke
 * Revokes a pending invitation.
 * Enforces owner/admin permissions and cross-organization tenant isolation (returns 404).
 * Guaranteed zero leakage of token or token_hash.
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

    const result = await revokeInvitation(
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

    return apiSuccess({
      invitation: safeInvitation,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
