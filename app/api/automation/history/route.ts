import { NextRequest } from 'next/server';
import { getAuthFromRequest, getTenantOrgId } from '@/lib/auth/middleware';
import { automationService } from '@/lib/services/automation-service';
import { apiSuccess, handleApiError, apiError } from '@/lib/utils/response';

export async function GET(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    const tenant = getTenantOrgId(request, auth);
    if ('error' in tenant) {
      return apiError(tenant.error, tenant.status as any, tenant.status === 404 ? 'NOT_FOUND' : 'UNAUTHORIZED');
    }
    const orgId = tenant.orgId;

    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50', 10);
    const history = await automationService.getAutomationHistory(orgId, limit);
    return apiSuccess(history);
  } catch (error) {
    return handleApiError(error);
  }
}

