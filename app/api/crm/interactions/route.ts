import { NextRequest } from 'next/server';
import { getAuthFromRequest, getTenantOrgId } from '@/lib/auth/middleware';
import { crmService } from '@/lib/services/crm-service';
import { apiSuccess, handleApiError, apiError, extractPagination } from '@/lib/utils/response';

export async function GET(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    const tenant = getTenantOrgId(request, auth);
    if ('error' in tenant) {
      return apiError(tenant.error, tenant.status as any, tenant.status === 404 ? 'NOT_FOUND' : 'UNAUTHORIZED');
    }
    const orgId = tenant.orgId;

    const clientId = request.nextUrl.searchParams.get('clientId') || undefined;
    const pagination = extractPagination(request.nextUrl.searchParams);

    const logs = await crmService.getInteractions(orgId, clientId, pagination);
    return apiSuccess(logs);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    const body = await request.json();
    const tenant = getTenantOrgId(request, auth, body);
    if ('error' in tenant) {
      return apiError(tenant.error, tenant.status as any, tenant.status === 404 ? 'NOT_FOUND' : 'UNAUTHORIZED');
    }
    const orgId = tenant.orgId;

    if (!body.clientId || !body.type || !body.content) {
      return apiError('clientId, type, and content are required', 400, 'VALIDATION_ERROR');
    }

    const log = await crmService.createInteraction(orgId, auth!.userId, body);
    return apiSuccess(log, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

