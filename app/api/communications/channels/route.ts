import { NextRequest } from 'next/server';
import { getAuthFromRequest } from '@/lib/auth/middleware';
import { communicationService } from '@/lib/services/communication-service';
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

    const channels = await communicationService.getChannels(orgId);
    return apiSuccess(channels);
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
    if (!orgId || !body.provider || !body.externalAccountId) {
      return apiError('organizationId, provider, and externalAccountId are required', 400, 'VALIDATION_ERROR');
    }

    const channel = await communicationService.configureChannel(orgId, auth.userId, body);
    return apiSuccess(channel, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
