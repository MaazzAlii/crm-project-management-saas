import { NextRequest } from 'next/server';
import { getAuthFromRequest } from '@/lib/auth/middleware';
import { communicationService } from '@/lib/services/communication-service';
import { apiPaginated, handleApiError, apiError } from '@/lib/utils/response';

export async function GET(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth) {
      return apiError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId') || auth.orgId;
    if (!orgId) {
      return apiError('Organization ID is required', 400, 'VALIDATION_ERROR');
    }

    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '30', 10);
    const clientId = searchParams.get('clientId') || undefined;

    const result = await communicationService.getMessages(orgId, { page, limit, clientId });
    return apiPaginated(result.messages, result.total, page, limit);
  } catch (error) {
    return handleApiError(error);
  }
}
