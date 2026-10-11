import { NextRequest } from 'next/server';
import { getAuthFromRequest, getTenantOrgId } from '@/lib/auth/middleware';
import { communicationService } from '@/lib/services/communication-service';
import { apiSuccess, handleApiError, apiError } from '@/lib/utils/response';

export async function POST(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    const body = await request.json();
    const tenant = getTenantOrgId(request, auth, body);
    if ('error' in tenant) {
      return apiError(tenant.error, tenant.status as any, tenant.status === 404 ? 'NOT_FOUND' : 'UNAUTHORIZED');
    }
    const orgId = tenant.orgId;

    if (!body.channelId || !body.body) {
      return apiError('channelId and body are required', 400, 'VALIDATION_ERROR');
    }

    const message = await communicationService.sendMessage(orgId, auth!.userId, {
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

