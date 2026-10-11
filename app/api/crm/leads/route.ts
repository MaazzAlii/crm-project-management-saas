import { NextRequest } from 'next/server';
import { getAuthFromRequest, getTenantOrgId } from '@/lib/auth/middleware';
import { crmService } from '@/lib/services/crm-service';
import { apiSuccess, handleApiError, apiError } from '@/lib/utils/response';

export async function GET(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    const tenant = getTenantOrgId(request, auth);
    if ('error' in tenant) {
      return apiError(tenant.error, tenant.status as any, tenant.status === 404 ? 'NOT_FOUND' : 'UNAUTHORIZED');
    }
    const orgId = tenant.orgId;

    const pipeline = await crmService.getLeadsPipeline(orgId);
    return apiSuccess(pipeline);
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

    if (!body.clientId || !body.title) {
      return apiError('clientId and title are required', 400, 'VALIDATION_ERROR');
    }

    const lead = await crmService.createLead(orgId, auth!.userId, body);
    return apiSuccess(lead, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    const body = await request.json();
    const tenant = getTenantOrgId(request, auth, body);
    if ('error' in tenant) {
      return apiError(tenant.error, tenant.status as any, tenant.status === 404 ? 'NOT_FOUND' : 'UNAUTHORIZED');
    }
    const orgId = tenant.orgId;

    const { leadId, status, stageOrder } = body;
    if (!leadId || !status) {
      return apiError('leadId and status are required', 400, 'VALIDATION_ERROR');
    }

    const updated = await crmService.updateLeadStage(leadId, orgId, auth!.userId, status, stageOrder);
    return apiSuccess(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
  return PATCH(request);
}
