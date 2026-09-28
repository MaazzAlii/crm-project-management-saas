import { NextRequest } from 'next/server';
import { getAuthFromRequest } from '@/lib/auth/middleware';
import { automationService } from '@/lib/services/automation-service';
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

    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const history = await automationService.getAutomationHistory(orgId, limit);
    return apiSuccess(history);
  } catch (error) {
    return handleApiError(error);
  }
}
