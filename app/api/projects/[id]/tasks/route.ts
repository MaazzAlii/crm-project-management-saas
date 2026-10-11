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
    const tasks = await projectService.getTasks(id, orgId);
    return apiSuccess(tasks);
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
      return apiError('Task title is required', 400, 'VALIDATION_ERROR');
    }

    const task = await projectService.createTask(orgId, auth!.userId, {
      projectId: id,
      title: body.title,
      description: body.description,
      priority: body.priority,
      assignedTo: body.assignedTo,
      dueDate: body.dueDate,
    });

    return apiSuccess(task, 201);
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

    const { taskId, status, ...rest } = body;
    if (!taskId) {
      return apiError('taskId is required', 400, 'VALIDATION_ERROR');
    }

    let updated;
    if (status && Object.keys(rest).length === 0) {
      updated = await projectService.updateTaskStatus(taskId, orgId, auth!.userId, status);
    } else {
      updated = await projectService.updateTask(taskId, orgId, auth!.userId, { status, ...rest });
    }

    return apiSuccess(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
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

    const { searchParams } = request.nextUrl;
    const taskId = searchParams.get('taskId');
    if (!taskId) {
      return apiError('taskId parameter is required', 400, 'VALIDATION_ERROR');
    }

    await projectService.deleteTask(taskId, orgId, auth!.userId);
    return apiSuccess({ deleted: true, taskId });
  } catch (error) {
    return handleApiError(error);
  }
}

