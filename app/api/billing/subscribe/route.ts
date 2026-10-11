import { NextRequest } from 'next/server';
import { getAuthFromRequest, getTenantOrgId } from '@/lib/auth/middleware';
import { billingService } from '@/lib/services/billing-service';
import { apiSuccess, handleApiError, apiError } from '@/lib/utils/response';

export async function POST(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    const body = await request.json();
    const tenant = getTenantOrgId(request, auth, body);
    if ('error' in tenant) {
      return apiError(tenant.error, tenant.status as any, tenant.status === 404 ? 'NOT_FOUND' : 'UNAUTHORIZED');
    }
    const orgId = tenant.orgId;

    if (!body.planTier) {
      return apiError('planTier is required', 400, 'VALIDATION_ERROR');
    }

    const updated = await billingService.updateSubscriptionTier(orgId, auth!.userId, body.planTier);
    return apiSuccess(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

