import { NextRequest } from 'next/server';
import { getAuthFromRequest, getTenantOrgId } from '@/lib/auth/middleware';
import { crmService } from '@/lib/services/crm-service';
import { transaction } from '@/lib/db';
import { checkClientLimit } from '@/lib/services/plan-limits';
import { apiSuccess, apiPaginated, handleApiError, apiError, apiPlanLimitError } from '@/lib/utils/response';

export async function GET(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    const tenant = getTenantOrgId(request, auth);
    if ('error' in tenant) {
      return apiError(tenant.error, tenant.status as any, tenant.status === 404 ? 'NOT_FOUND' : 'UNAUTHORIZED');
    }
    const orgId = tenant.orgId;

    const { searchParams } = new URL(request.url);
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
    const body = await request.json();
    const tenant = getTenantOrgId(request, auth, body);
    if ('error' in tenant) {
      return apiError(tenant.error, tenant.status as any, tenant.status === 404 ? 'NOT_FOUND' : 'UNAUTHORIZED');
    }
    const orgId = tenant.orgId;

    if (!body.name) {
      return apiError('Client name is required', 400, 'VALIDATION_ERROR');
    }

    // Atomic plan quota enforcement with row lock to eliminate race conditions
    const result = await transaction(async (client) => {
      await client.query('SELECT id FROM organizations WHERE id = $1 FOR UPDATE', [orgId]);

      const limitCheck = await checkClientLimit(orgId, { client });
      if (!limitCheck.allowed) {
        return { limitError: limitCheck };
      }

      const newClient = await crmService.createClient(orgId, auth!.userId, body, { client });
      return { client: newClient };
    });

    if ('limitError' in result) {
      return apiPlanLimitError(result.limitError, 'CLIENT_LIMIT_REACHED');
    }

    return apiSuccess(result.client, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

