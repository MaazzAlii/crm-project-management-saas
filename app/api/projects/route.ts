import { NextRequest } from 'next/server';
import { getAuthFromRequest, getTenantOrgId } from '@/lib/auth/middleware';
import { projectService } from '@/lib/services/project-service';
import { billingService } from '@/lib/services/billing-service';
import { apiSuccess, apiPaginated, handleApiError, apiError } from '@/lib/utils/response';

export async function GET(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    const tenant = getTenantOrgId(request, auth);
    if ('error' in tenant) {
      return apiError(tenant.error, tenant.status as any, tenant.status === 404 ? 'NOT_FOUND' : 'UNAUTHORIZED');
    }
    const orgId = tenant.orgId;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const clientId = searchParams.get('clientId') || undefined;
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;

    const result = await projectService.listProjects(orgId, { page, limit, clientId, status, search });
    return apiPaginated(result.projects, result.total, page, limit);
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

    if (!body.title || !body.clientId) {
      return apiError('Title and clientId are required', 400, 'VALIDATION_ERROR');
    }

    // Check plan quota
    await billingService.assertQuotaAvailable(orgId, 'projects');

    const project = await projectService.createProject(orgId, auth!.userId, body);
    return apiSuccess(project, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

