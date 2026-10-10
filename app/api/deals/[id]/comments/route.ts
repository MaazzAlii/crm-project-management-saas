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
    const result = await dealService.getComments(session, id);
    if (!result.success) {
      return handleServiceError(result.error!);
    }

    return jsonOk(result.data);
  } catch (error: any) {
    return jsonError('INTERNAL_ERROR', error.message || 'Failed to get comments', 500);
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await getPipelineSession(request);
    if (!session) {
      return jsonError('UNAUTHORIZED', 'Missing or invalid authentication session', 401);
    }

    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));

    if (!body.content || typeof body.content !== 'string' || body.content.trim().length === 0) {
      return jsonError('VALIDATION_ERROR', 'Comment content is required', 400);
    }

    const result = await dealService.addComment(session, id, body.content);
    if (!result.success) {
      return handleServiceError(result.error!);
    }

    return jsonOk(result.data, 201);
  } catch (error: any) {
    return jsonError('INTERNAL_ERROR', error.message || 'Failed to add comment', 500);
  }
}
