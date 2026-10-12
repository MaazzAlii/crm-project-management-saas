import { NextRequest } from 'next/server';
import { declineInvitation } from '@/lib/services/invitation-service';
import { apiSuccess, apiError, handleApiError } from '@/lib/utils/response';

/**
 * POST /api/invitations/decline
 * Body: { token }
 * Marks a pending invitation as declined.
 * Rejects with 400 if expired or not in pending state.
 * Emits invite.declined audit event.
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

    const result = await declineInvitation(token);

    if (!result.success) {
      if (result.error === 'invalid_status') {
        return apiError(result.message, 400, 'INVALID_STATUS');
      }
      return apiError(result.message, 400, 'INVALID_OR_EXPIRED');
    }

    // Strip sensitive token_hash
    const { token_hash, ...safeInvitation } = result.invitation as any;

    return apiSuccess({
      invitation: safeInvitation,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
