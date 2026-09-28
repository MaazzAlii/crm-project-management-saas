import { NextRequest } from 'next/server';
import { getAuthFromRequest } from '@/lib/auth/middleware';
import { crmService } from '@/lib/services/crm-service';
import { apiSuccess, handleApiError, apiError, extractPagination } from '@/lib/utils/response';

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

    const clientId = searchParams.get('clientId') || undefined;
    const pagination = extractPagination(searchParams);

    const logs = await crmService.getInteractions(orgId, clientId, pagination);
    return apiSuccess(logs);
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
    if (!orgId || !body.clientId || !body.type || !body.content) {
      return apiError('organizationId, clientId, type, and content are required', 400, 'VALIDATION_ERROR');
    }

    const log = await crmService.createInteraction(orgId, auth.userId, body);
    return apiSuccess(log, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
