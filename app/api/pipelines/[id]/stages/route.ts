import { NextRequest } from 'next/server';
import { getPipelineSession } from '@/lib/pipeline/auth-helper';
import { pipelineService } from '@/lib/pipeline/pipeline-service';
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

    if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
      return jsonError('VALIDATION_ERROR', 'Stage name is required', 400);
    }

    const result = await pipelineService.createStage(session, id, {
      name: body.name,
      color: body.color,
      isWon: body.isWon,
      isLost: body.isLost,
      wipLimit: body.wipLimit,
    });

    if (!result.success) {
      return handleServiceError(result.error!);
    }

    return jsonOk(result.data, 201);
  } catch (error: any) {
    return jsonError('INTERNAL_ERROR', error.message || 'Failed to create stage', 500);
  }
}
