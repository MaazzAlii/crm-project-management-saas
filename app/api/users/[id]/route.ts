import { NextRequest } from 'next/server';
import { getAuthFromRequest } from '@/lib/auth/middleware';
import { userService } from '@/lib/services/user-service';
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
    const user = await userService.getUserProfile(id);
    return apiSuccess(user);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth) {
      return apiError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const { id } = await params;
    if (auth.userId !== id && auth.role !== 'super_admin' && auth.role !== 'org_admin') {
      return apiError('Forbidden', 403, 'FORBIDDEN');
    }

    const body = await request.json();
    const updated = await userService.updateProfile(id, {
      fullName: body.fullName,
      avatarUrl: body.avatarUrl,
    });

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
    if (!auth || (auth.role !== 'super_admin' && auth.role !== 'org_admin')) {
      return apiError('Forbidden', 403, 'FORBIDDEN');
    }

    const { id } = await params;
    await userService.deactivateUser(id, auth.userId);
    return apiSuccess({ deleted: true, userId: id });
  } catch (error) {
    return handleApiError(error);
  }
}
