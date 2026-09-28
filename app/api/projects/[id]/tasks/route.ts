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
    if (!auth) {
      return apiError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const { id } = await params;
    const body = await request.json();
    const orgId = body.organizationId || auth.orgId;
    if (!orgId || !body.title) {
      return apiError('Organization ID and task title are required', 400, 'VALIDATION_ERROR');
    }

    const task = await projectService.createTask(orgId, auth.userId, {
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
    if (!auth) {
      return apiError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const body = await request.json();
    const { taskId, organizationId, status, ...rest } = body;
    const orgId = organizationId || auth.orgId;

    if (!taskId || !orgId) {
      return apiError('taskId and organizationId are required', 400, 'VALIDATION_ERROR');
    }

    let updated;
    if (status && Object.keys(rest).length === 0) {
      updated = await projectService.updateTaskStatus(taskId, orgId, auth.userId, status);
    } else {
      updated = await projectService.updateTask(taskId, orgId, auth.userId, { status, ...rest });
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
    if (!auth) {
      return apiError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const { searchParams } = request.nextUrl;
    const taskId = searchParams.get('taskId');
    const orgId = searchParams.get('orgId') || auth.orgId;

    if (!taskId || !orgId) {
      return apiError('taskId and organizationId are required', 400, 'VALIDATION_ERROR');
    }

    await projectService.deleteTask(taskId, orgId, auth.userId);
    return apiSuccess({ deleted: true, taskId });
  } catch (error) {
    return handleApiError(error);
  }
}
