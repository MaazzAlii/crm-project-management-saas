import { NextRequest } from 'next/server';
import { getAuthFromRequest } from '@/lib/auth/middleware';
import { crmService } from '@/lib/services/crm-service';
import { apiSuccess, handleApiError, apiError, extractPagination } from '@/lib/utils/response';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth) {
      return apiError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const { id } = await params;
    const { searchParams } = request.nextUrl;
    const orgId = searchParams.get('orgId') || auth.orgId;
    if (!orgId) {
      return apiError('Organization ID is required', 400, 'VALIDATION_ERROR');
    }

    const pagination = extractPagination(searchParams);
    const logs = await crmService.getInteractions(orgId, id, pagination);
    return apiSuccess(logs);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth) {
      return apiError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const { id } = await params;
    const body = await request.json();
    const orgId = body.organizationId || request.nextUrl.searchParams.get('orgId') || auth.orgId;
    if (!orgId || !body.type || !body.content) {
      return apiError('Organization ID, type, and content are required', 400, 'VALIDATION_ERROR');
    }

    const log = await crmService.createInteraction(orgId, auth.userId, {
      ...body,
      clientId: id,
    });

    return apiSuccess(log, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
