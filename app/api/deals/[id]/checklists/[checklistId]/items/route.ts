import { NextRequest } from 'next/server';
import { getPipelineSession } from '@/lib/pipeline/auth-helper';
import { dealService } from '@/lib/pipeline/deal-service';
import { jsonOk, jsonError, handleServiceError } from '@/lib/pipeline/response';

interface RouteContext {
  params: Promise<{ id: string; checklistId: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await getPipelineSession(request);
    if (!session) {
      return jsonError('UNAUTHORIZED', 'Missing or invalid authentication session', 401);
    }

    const { id, checklistId } = await context.params;
    const body = await request.json().catch(() => ({}));

    if (!body.title || typeof body.title !== 'string' || body.title.trim().length === 0) {
      return jsonError('VALIDATION_ERROR', 'Item title is required', 400);
    }

    const result = await dealService.addChecklistItem(session, id, checklistId, body.title, body.due_date);
    if (!result.success) {
      return handleServiceError(result.error!);
    }

    return jsonOk(result.data, 201);
  } catch (error: any) {
    return jsonError('INTERNAL_ERROR', error.message || 'Failed to add checklist item', 500);
  }
}
