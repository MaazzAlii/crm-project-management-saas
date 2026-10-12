import { NextRequest } from 'next/server';
import { getInvitationAcceptInfo } from '@/lib/services/invitation-service';
import { apiSuccess, apiError, handleApiError } from '@/lib/utils/response';

/**
 * GET /api/invitations/accept-info?token=...
 * Returns public metadata for unauthenticated acceptance UI:
 * - organizationName, organizationSlug, domain, maskedEmail, accountExists, role.
 * - Guaranteed: full email is never revealed to an unauthenticated caller.
 * - Invalid/expired token returns generic 400 response.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const token = searchParams.get('token');

    if (!token || typeof token !== 'string') {
      return apiError('This invitation is invalid or has expired', 400, 'INVALID_OR_EXPIRED');
    }

    const result = await getInvitationAcceptInfo(token);

    if (!result.success) {
      return apiError(result.message, 400, 'INVALID_OR_EXPIRED');
    }

    return apiSuccess({
      organizationName: result.organizationName,
      organizationSlug: result.organizationSlug,
      domain: result.domain,
      maskedEmail: result.maskedEmail,
      accountExists: result.accountExists,
      role: result.role,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
