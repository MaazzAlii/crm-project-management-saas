import { NextRequest } from 'next/server';
import { getAuthFromRequest, getTenantOrgId } from '@/lib/auth/middleware';
import { projectService } from '@/lib/services/project-service';
import { apiSuccess, handleApiError, apiError } from '@/lib/utils/response';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = getAuthFromRequest(request);
    const tenant = getTenantOrgId(request, auth);
    if ('error' in tenant) {
      return apiError(tenant.error, tenant.status as any, tenant.status === 404 ? 'NOT_FOUND' : 'UNAUTHORIZED');
    }
    const orgId = tenant.orgId;

    const { id } = await params;
    const deliverables = await projectService.getDeliverables(id, orgId);
    return apiSuccess(deliverables);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = getAuthFromRequest(request);
    const body = await request.json();
    const tenant = getTenantOrgId(request, auth, body);
    if ('error' in tenant) {
      return apiError(tenant.error, tenant.status as any, tenant.status === 404 ? 'NOT_FOUND' : 'UNAUTHORIZED');
    }
    const orgId = tenant.orgId;

    const { id } = await params;
    if (!body.title) {
      return apiError('Deliverable title is required', 400, 'VALIDATION_ERROR');
    }

    const deliverable = await projectService.createDeliverable(orgId, auth!.userId, {
      projectId: id,
      title: body.title,
      fileUrl: body.fileUrl,
      driveLink: body.driveLink,
    });

    return apiSuccess(deliverable, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = getAuthFromRequest(request);
    const body = await request.json();
    const tenant = getTenantOrgId(request, auth, body);
    if ('error' in tenant) {
      return apiError(tenant.error, tenant.status as any, tenant.status === 404 ? 'NOT_FOUND' : 'UNAUTHORIZED');
    }
    const orgId = tenant.orgId;

    const { deliverableId, status, feedback } = body;
    if (!deliverableId) {
      return apiError('deliverableId is required', 400, 'VALIDATION_ERROR');
    }

    const updated = await projectService.updateDeliverable(deliverableId, orgId, auth!.userId, {
      status,
      feedback,
    });

    return apiSuccess(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

