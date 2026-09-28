import { NextRequest } from 'next/server';
import { getAuthFromRequest } from '@/lib/auth/middleware';
import { communicationService } from '@/lib/services/communication-service';
import { apiSuccess, handleApiError, apiError } from '@/lib/utils/response';

export async function POST(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth) {
      return apiError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const body = await request.json();
    const orgId = body.organizationId || auth.orgId;
    if (!orgId || !body.channelId || !body.body) {
      return apiError('organizationId, channelId, and body are required', 400, 'VALIDATION_ERROR');
    }

    const message = await communicationService.sendMessage(orgId, auth.userId, {
      channelId: body.channelId,
      clientId: body.clientId,
      body: body.body,
      senderName: body.senderName,
    });

    return apiSuccess(message, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
