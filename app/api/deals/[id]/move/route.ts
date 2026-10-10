import { NextRequest } from 'next/server';
import { getPipelineSession } from '@/lib/pipeline/auth-helper';
import { dealService } from '@/lib/pipeline/deal-service';
import { jsonOk, jsonError, handleServiceError } from '@/lib/pipeline/response';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await getPipelineSession(request);
    if (!session) {
      return jsonError('UNAUTHORIZED', 'Missing or invalid authentication session', 401);
    }

    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));

    if (!body.toStageId || typeof body.toStageId !== 'string') {
      return jsonError('VALIDATION_ERROR', 'toStageId is required', 400);
    }

    const result = await dealService.moveDeal(session, id, {
      toStageId: body.toStageId,
      beforeId: body.beforeId || null,
      afterId: body.afterId || null,
      expectedVersion: typeof body.expectedVersion === 'number' ? body.expectedVersion : undefined,
      lostReason: body.lostReason || null,
    });

    if (!result.success) {
      return handleServiceError(result.error!);
    }

    return jsonOk(result.data);
  } catch (error: any) {
    return jsonError('INTERNAL_ERROR', error.message || 'Failed to move deal', 500);
  }
}
