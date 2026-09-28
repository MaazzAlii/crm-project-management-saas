import { NextRequest } from 'next/server';
import { getAuthFromRequest } from '@/lib/auth/middleware';
import { communicationService } from '@/lib/services/communication-service';
import { apiPaginated, handleApiError, apiError, extractPagination } from '@/lib/utils/response';

export async function GET(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth) {
      return apiError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const { searchParams } = request.nextUrl;
    const orgId = searchParams.get('orgId') || auth.orgId;
    const clientId = searchParams.get('clientId');

    if (!orgId || !clientId) {
      return apiError('orgId and clientId are required', 400, 'VALIDATION_ERROR');
    }

    const pagination = extractPagination(searchParams);
    const result = await communicationService.getClientHistory(orgId, clientId, pagination);

    return apiPaginated(result.messages, result.total, pagination.page, pagination.limit);
  } catch (error) {
    return handleApiError(error);
  }
}
