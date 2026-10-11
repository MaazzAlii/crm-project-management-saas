import { NextRequest } from 'next/server';
import { getAuthFromRequest, getTenantOrgId } from '@/lib/auth/middleware';
import { communicationService } from '@/lib/services/communication-service';
import { apiPaginated, handleApiError, apiError, extractPagination } from '@/lib/utils/response';

export async function GET(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    const tenant = getTenantOrgId(request, auth);
    if ('error' in tenant) {
      return apiError(tenant.error, tenant.status as any, tenant.status === 404 ? 'NOT_FOUND' : 'UNAUTHORIZED');
    }
    const orgId = tenant.orgId;

    const clientId = request.nextUrl.searchParams.get('clientId');
    if (!clientId) {
      return apiError('clientId is required', 400, 'VALIDATION_ERROR');
    }

    const pagination = extractPagination(request.nextUrl.searchParams);
    const result = await communicationService.getClientHistory(orgId, clientId, pagination);

    return apiPaginated(result.messages, result.total, pagination.page, pagination.limit);
  } catch (error) {
    return handleApiError(error);
  }
}

