import { NextRequest } from 'next/server';
import { getPipelineSession } from '@/lib/pipeline/auth-helper';
import { pipelineService } from '@/lib/pipeline/pipeline-service';
import { jsonOk, jsonError, handleServiceError } from '@/lib/pipeline/response';

interface RouteContext {
  params: Promise<{ id: string; stageId: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await getPipelineSession(request);
    if (!session) {
      return jsonError('UNAUTHORIZED', 'Missing or invalid authentication session', 401);
    }

    const { id, stageId } = await context.params;
    const body = await request.json().catch(() => ({}));

    const result = await pipelineService.updateStage(session, id, stageId, body);
    if (!result.success) {
      return handleServiceError(result.error!);
    }

    return jsonOk(result.data);
  } catch (error: any) {
    return jsonError('INTERNAL_ERROR', error.message || 'Failed to update stage', 500);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const session = await getPipelineSession(request);
    if (!session) {
      return jsonError('UNAUTHORIZED', 'Missing or invalid authentication session', 401);
    }

    const { id, stageId } = await context.params;
    const { searchParams } = new URL(request.url);
    const moveTo = searchParams.get('moveTo');

    if (!moveTo) {
      return jsonError('VALIDATION_ERROR', 'Target stage ID (moveTo) is required to reassign existing deals.', 400);
    }

    const result = await pipelineService.deleteStage(session, id, stageId, moveTo);
    if (!result.success) {
      return handleServiceError(result.error!);
    }

    return jsonOk({ success: true });
  } catch (error: any) {
    return jsonError('INTERNAL_ERROR', error.message || 'Failed to delete stage', 500);
  }
}
