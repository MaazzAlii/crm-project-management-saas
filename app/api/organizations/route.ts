import { NextRequest } from 'next/server';
import { getAuthFromRequest } from '@/lib/auth/middleware';
import { orgService } from '@/lib/services/org-service';
import { userService } from '@/lib/services/user-service';
import { apiSuccess, handleApiError, apiError } from '@/lib/utils/response';

export async function GET(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth) {
      return apiError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const orgs = await userService.getUserOrganizations(auth.userId);
    return apiSuccess(orgs);
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
    if (!body.name || !body.slug) {
      return apiError('Name and slug are required', 400, 'VALIDATION_ERROR');
    }

    const org = await orgService.createOrganization(auth.userId, {
      name: body.name,
      slug: body.slug,
      logoUrl: body.logoUrl,
    });

    return apiSuccess(org, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
