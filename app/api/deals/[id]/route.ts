import { NextRequest } from 'next/server';
import { getPipelineSession } from '@/lib/pipeline/auth-helper';
import { dealService } from '@/lib/pipeline/deal-service';
import { jsonOk, jsonError, handleServiceError } from '@/lib/pipeline/response';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await getPipelineSession(request);
    if (!session) {
      return jsonError('UNAUTHORIZED', 'Missing or invalid authentication session', 401);
    }

    const { id } = await context.params;
    const result = await dealService.getDeal(session, id);
    if (!result.success) {
      return handleServiceError(result.error!);
    }

    return jsonOk(result.data);
  } catch (error: any) {
    return jsonError('INTERNAL_ERROR', error.message || 'Failed to get deal', 500);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await getPipelineSession(request);
    if (!session) {
      return jsonError('UNAUTHORIZED', 'Missing or invalid authentication session', 401);
    }

    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));

    const expectedVersion = typeof body.expectedVersion === 'number' ? body.expectedVersion : undefined;

    const result = await dealService.updateDeal(session, id, body, expectedVersion);
    if (!result.success) {
      return handleServiceError(result.error!);
    }

    return jsonOk(result.data);
  } catch (error: any) {
    return jsonError('INTERNAL_ERROR', error.message || 'Failed to update deal', 500);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const session = await getPipelineSession(request);
    if (!session) {
      return jsonError('UNAUTHORIZED', 'Missing or invalid authentication session', 401);
    }

    const { id } = await context.params;
    const result = await dealService.deleteDeal(session, id);
    if (!result.success) {
      return handleServiceError(result.error!);
    }

    return jsonOk({ success: true });
  } catch (error: any) {
    return jsonError('INTERNAL_ERROR', error.message || 'Failed to delete deal', 500);
  }
}
