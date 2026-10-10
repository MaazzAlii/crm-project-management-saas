import { NextRequest } from 'next/server';
import { getPipelineSession } from '@/lib/pipeline/auth-helper';
import { pipelineService } from '@/lib/pipeline/pipeline-service';
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
    const result = await pipelineService.getPipeline(session, id);
    if (!result.success) {
      return handleServiceError(result.error!);
    }

    return jsonOk(result.data);
  } catch (error: any) {
    return jsonError('INTERNAL_ERROR', error.message || 'Failed to get pipeline', 500);
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

    const result = await pipelineService.updatePipeline(session, id, body);
    if (!result.success) {
      return handleServiceError(result.error!);
    }

    return jsonOk(result.data);
  } catch (error: any) {
    return jsonError('INTERNAL_ERROR', error.message || 'Failed to update pipeline', 500);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const session = await getPipelineSession(request);
    if (!session) {
      return jsonError('UNAUTHORIZED', 'Missing or invalid authentication session', 401);
    }

    const { id } = await context.params;
    const result = await pipelineService.deletePipeline(session, id);
    if (!result.success) {
      return handleServiceError(result.error!);
    }

    return jsonOk({ success: true });
  } catch (error: any) {
    return jsonError('INTERNAL_ERROR', error.message || 'Failed to delete pipeline', 500);
  }
}
