import { NextRequest } from 'next/server';
import { getAuthFromRequest } from '@/lib/auth/middleware';
import { projectService } from '@/lib/services/project-service';
import { apiSuccess, handleApiError, apiError } from '@/lib/utils/response';

export async function GET(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth) {
      return apiError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const { searchParams } = request.nextUrl;
    const orgId = searchParams.get('orgId') || auth.orgId;
    if (!orgId) {
      return apiError('Organization ID is required', 400, 'VALIDATION_ERROR');
    }

    const templates = await projectService.listTemplates(orgId);
    return apiSuccess(templates);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth) {
      return apiError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const body = await request.json();
    const orgId = body.organizationId || auth.orgId;

    if (body.action === 'instantiate') {
      if (!orgId || !body.templateId || !body.clientId || !body.projectName) {
        return apiError('organizationId, templateId, clientId, and projectName are required', 400, 'VALIDATION_ERROR');
      }

      const project = await projectService.createFromTemplate(
        orgId,
        auth.userId,
        body.templateId,
        body.clientId,
        body.projectName,
        body.startDate ? new Date(body.startDate) : undefined
      );

      return apiSuccess(project, 201);
    }

    // Otherwise create template
    if (!orgId || !body.name) {
      return apiError('organizationId and template name are required', 400, 'VALIDATION_ERROR');
    }

    const template = await projectService.createTemplate(orgId, auth.userId, body);
    return apiSuccess(template, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
