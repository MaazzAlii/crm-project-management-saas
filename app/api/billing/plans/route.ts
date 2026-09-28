import { NextRequest } from 'next/server';
import { billingService } from '@/lib/services/billing-service';
import { apiSuccess, handleApiError } from '@/lib/utils/response';

export async function GET(request: NextRequest) {
  try {
    const plans = billingService.getPlans();
    return apiSuccess(plans);
  } catch (error) {
    return handleApiError(error);
  }
}
