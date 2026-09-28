import { NextRequest } from 'next/server';
import { getAuthFromRequest } from '@/lib/auth/middleware';
import { crmService } from '@/lib/services/crm-service';
import { billingService } from '@/lib/services/billing-service';
import { apiSuccess, apiPaginated, handleApiError, apiError } from '@/lib/utils/response';

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
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;

    const result = await crmService.listClients(orgId, { page, limit, search, status });
    return apiPaginated(result.clients, result.total, page, limit);
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
    if (!orgId || !body.name) {
      return apiError('Organization ID and client name are required', 400, 'VALIDATION_ERROR');
    }

    // Check plan limits
    await billingService.assertQuotaAvailable(orgId, 'clients');

    const client = await crmService.createClient(orgId, auth.userId, body);
    return apiSuccess(client, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
