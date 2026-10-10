import { NextRequest } from 'next/server';
import { getPipelineSession } from '@/lib/pipeline/auth-helper';
import { pipelineService } from '@/lib/pipeline/pipeline-service';
import { jsonOk, jsonError, handleServiceError } from '@/lib/pipeline/response';

export async function GET(request: NextRequest) {
  try {
    const session = await getPipelineSession(request);
    if (!session) {
      return jsonError('UNAUTHORIZED', 'Missing or invalid authentication session', 401);
    }

    const result = await pipelineService.listPipelines(session);
    if (!result.success) {
      return handleServiceError(result.error!);
    }

    return jsonOk(result.data);
  } catch (error: any) {
    return jsonError('INTERNAL_ERROR', error.message || 'Failed to list pipelines', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getPipelineSession(request);
    if (!session) {
      return jsonError('UNAUTHORIZED', 'Missing or invalid authentication session', 401);
    }

    const body = await request.json().catch(() => ({}));
    if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
      return jsonError('VALIDATION_ERROR', 'Pipeline name is required', 400);
    }

    const result = await pipelineService.createPipeline(session, {
      name: body.name,
      description: body.description,
      isDefault: body.isDefault,
    });

    if (!result.success) {
      return handleServiceError(result.error!);
    }

    return jsonOk(result.data, 201);
  } catch (error: any) {
    return jsonError('INTERNAL_ERROR', error.message || 'Failed to create pipeline', 500);
  }
}
