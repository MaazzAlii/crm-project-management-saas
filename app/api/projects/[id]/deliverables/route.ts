import { NextRequest } from 'next/server';
import { getAuthFromRequest } from '@/lib/auth/middleware';
import { projectService } from '@/lib/services/project-service';
import { apiSuccess, handleApiError, apiError } from '@/lib/utils/response';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth) {
      return apiError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const { id } = await params;
    const { searchParams } = request.nextUrl;
    const orgId = searchParams.get('orgId') || auth.orgId;
    if (!orgId) {
      return apiError('Organization ID is required', 400, 'VALIDATION_ERROR');
    }

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
    if (!auth) {
      return apiError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const { id } = await params;
    const body = await request.json();
    const orgId = body.organizationId || auth.orgId;
    if (!orgId || !body.title) {
      return apiError('Organization ID and deliverable title are required', 400, 'VALIDATION_ERROR');
    }

    const deliverable = await projectService.createDeliverable(orgId, auth.userId, {
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
    if (!auth) {
      return apiError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const body = await request.json();
    const { deliverableId, organizationId, status, feedback } = body;
    const orgId = organizationId || auth.orgId;

    if (!deliverableId || !orgId) {
      return apiError('deliverableId and organizationId are required', 400, 'VALIDATION_ERROR');
    }

    const updated = await projectService.updateDeliverable(deliverableId, orgId, auth.userId, {
      status,
      feedback,
    });

    return apiSuccess(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
