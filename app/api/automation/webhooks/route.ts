import { NextRequest } from 'next/server';
import { getAuthFromRequest } from '@/lib/auth/middleware';
import { automationService } from '@/lib/services/automation-service';
import { apiSuccess, handleApiError, apiError } from '@/lib/utils/response';

export async function POST(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth) {
      return apiError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const body = await request.json();
    const orgId = body.organizationId || auth.orgId;
    if (!orgId) {
      return apiError('Organization ID is required', 400, 'VALIDATION_ERROR');
    }

    const result = await automationService.dispatchTestWebhook(orgId, auth.userId);
    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}
