import { NextRequest } from 'next/server';
import { getAuthFromRequest } from '@/lib/auth/middleware';
import { userService } from '@/lib/services/user-service';
import { apiSuccess, handleApiError, apiError } from '@/lib/utils/response';

export async function GET(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth) {
      return apiError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const user = await userService.getUserProfile(auth.userId);
    const orgs = await userService.getUserOrganizations(auth.userId);

    return apiSuccess({
      user,
      organizations: orgs,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth) {
      return apiError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const body = await request.json();
    const updated = await userService.updateProfile(auth.userId, {
      fullName: body.fullName,
      avatarUrl: body.avatarUrl,
    });

    return apiSuccess(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
