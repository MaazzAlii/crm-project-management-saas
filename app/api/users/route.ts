import { NextRequest } from 'next/server';
import { getAuthFromRequest, withRole } from '@/lib/auth/middleware';
import { userService } from '@/lib/services/user-service';
import { apiSuccess, apiPaginated, handleApiError, apiError, extractPagination } from '@/lib/utils/response';

export async function GET(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth) {
      return apiError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const { searchParams } = request.nextUrl;
    const pagination = extractPagination(searchParams);
    const search = searchParams.get('search') || undefined;

    const result = await userService.listUsers({ ...pagination, search });
    return apiPaginated(result.users, result.total, pagination.page, pagination.limit);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth || (auth.role !== 'super_admin' && auth.role !== 'org_admin')) {
      return apiError('Forbidden', 403, 'FORBIDDEN');
    }

    const body = await request.json();
    if (!body.email || !body.password) {
      return apiError('Email and password are required', 400, 'VALIDATION_ERROR');
    }

    const user = await userService.adminCreateUser({
      email: body.email,
      password: body.password,
      fullName: body.fullName,
      role: body.role,
    });

    return apiSuccess(user, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
