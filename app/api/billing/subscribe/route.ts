import { NextRequest } from 'next/server';
import { getAuthFromRequest } from '@/lib/auth/middleware';
import { billingService } from '@/lib/services/billing-service';
import { apiSuccess, handleApiError, apiError } from '@/lib/utils/response';

export async function POST(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth) {
      return apiError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const body = await request.json();
    const orgId = body.organizationId || auth.orgId;
    if (!orgId || !body.planTier) {
      return apiError('organizationId and planTier are required', 400, 'VALIDATION_ERROR');
    }

    const updated = await billingService.updateSubscriptionTier(orgId, auth.userId, body.planTier);
    return apiSuccess(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
