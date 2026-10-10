import { NextRequest } from 'next/server';
import { getPipelineSession } from '@/lib/pipeline/auth-helper';
import { dealService } from '@/lib/pipeline/deal-service';
import { dealRepo } from '@/lib/db/repositories/deal-repo';
import { jsonOk, jsonError, handleServiceError } from '@/lib/pipeline/response';

interface RouteContext {
  params: Promise<{ id: string; checklistId: string; itemId: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await getPipelineSession(request);
    if (!session) {
      return jsonError('UNAUTHORIZED', 'Missing or invalid authentication session', 401);
    }

    const { id, itemId } = await context.params;
    const body = await request.json().catch(() => ({}));

    if (body.is_done !== undefined) {
      const result = await dealService.toggleChecklistItem(session, id, itemId, Boolean(body.is_done));
      if (!result.success) {
        return handleServiceError(result.error!);
      }
      return jsonOk(result.data);
    }

    const updated = await dealRepo.updateChecklistItem(session.orgId!, itemId, {
      title: body.title,
      due_date: body.due_date,
    });

    if (!updated) {
      return jsonError('NOT_FOUND', 'Checklist item not found', 404);
    }

    return jsonOk(updated);
  } catch (error: any) {
    return jsonError('INTERNAL_ERROR', error.message || 'Failed to update checklist item', 500);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const session = await getPipelineSession(request);
    if (!session) {
      return jsonError('UNAUTHORIZED', 'Missing or invalid authentication session', 401);
    }

    const { itemId } = await context.params;
    const ok = await dealRepo.deleteChecklistItem(session.orgId!, itemId);
    if (!ok) {
      return jsonError('NOT_FOUND', 'Checklist item not found', 404);
    }

    return jsonOk({ success: true });
  } catch (error: any) {
    return jsonError('INTERNAL_ERROR', error.message || 'Failed to delete checklist item', 500);
  }
}
