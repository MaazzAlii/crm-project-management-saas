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

    const preferences = await userService.getUserPreferences(auth.userId);
    return apiSuccess(preferences);
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
    if (typeof body !== 'object' || body === null) {
      return apiError('Invalid preferences body', 400, 'VALIDATION_ERROR');
    }

    const updated = await userService.updateUserPreferences(auth.userId, body);
    return apiSuccess(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
