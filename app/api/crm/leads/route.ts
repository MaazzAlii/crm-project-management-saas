import { NextRequest } from 'next/server';
import { getAuthFromRequest } from '@/lib/auth/middleware';
import { crmService } from '@/lib/services/crm-service';
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

    const pipeline = await crmService.getLeadsPipeline(orgId);
    return apiSuccess(pipeline);
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
    if (!orgId || !body.clientId || !body.title) {
      return apiError('organizationId, clientId, and title are required', 400, 'VALIDATION_ERROR');
    }

    const lead = await crmService.createLead(orgId, auth.userId, body);
    return apiSuccess(lead, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth) {
      return apiError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const body = await request.json();
    const { leadId, organizationId, status, stageOrder } = body;
    const orgId = organizationId || auth.orgId;

    if (!leadId || !orgId || !status) {
      return apiError('leadId, organizationId, and status are required', 400, 'VALIDATION_ERROR');
    }

    const updated = await crmService.updateLeadStage(leadId, orgId, auth.userId, status, stageOrder);
    return apiSuccess(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
  return PATCH(request);
}
