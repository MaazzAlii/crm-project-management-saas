import { NextRequest } from 'next/server';
import { getPipelineSession } from '@/lib/pipeline/auth-helper';
import { dealService } from '@/lib/pipeline/deal-service';
import { jsonOk, jsonError, handleServiceError } from '@/lib/pipeline/response';

interface RouteContext {
  params: Promise<{ id: string; commentId: string }>;
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const session = await getPipelineSession(request);
    if (!session) {
      return jsonError('UNAUTHORIZED', 'Missing or invalid authentication session', 401);
    }

    const { id, commentId } = await context.params;
    const result = await dealService.deleteComment(session, id, commentId);
    if (!result.success) {
      return handleServiceError(result.error!);
    }

    return jsonOk({ success: true });
  } catch (error: any) {
    return jsonError('INTERNAL_ERROR', error.message || 'Failed to delete comment', 500);
  }
}
