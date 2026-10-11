import { NextRequest } from 'next/server';
import { getAuthFromRequest, getTenantOrgId } from '@/lib/auth/middleware';
import { projectService } from '@/lib/services/project-service';
import { apiSuccess, handleApiError, apiError } from '@/lib/utils/response';

export async function GET(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    const tenant = getTenantOrgId(request, auth);
    if ('error' in tenant) {
      return apiError(tenant.error, tenant.status as any, tenant.status === 404 ? 'NOT_FOUND' : 'UNAUTHORIZED');
    }
    const orgId = tenant.orgId;

    const templates = await projectService.listTemplates(orgId);
    return apiSuccess(templates);
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

    if (body.action === 'instantiate') {
      if (!body.templateId || !body.clientId || !body.projectName) {
        return apiError('templateId, clientId, and projectName are required', 400, 'VALIDATION_ERROR');
      }

      const project = await projectService.createFromTemplate(
        orgId,
        auth!.userId,
        body.templateId,
        body.clientId,
        body.projectName,
        body.startDate ? new Date(body.startDate) : undefined
      );

      return apiSuccess(project, 201);
    }

    // Otherwise create template
    if (!body.name) {
      return apiError('Template name is required', 400, 'VALIDATION_ERROR');
    }

    const template = await projectService.createTemplate(orgId, auth!.userId, body);
    return apiSuccess(template, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

