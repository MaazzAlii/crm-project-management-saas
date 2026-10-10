import { NextRequest } from 'next/server';
import { getPipelineSession } from '@/lib/pipeline/auth-helper';
import { listActivity } from '@/lib/pipeline/activity';
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
    const dealRes = await dealService.getDeal(session, id);
    if (!dealRes.success) {
      return handleServiceError(dealRes.error!);
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const before = searchParams.get('before') || undefined;

    const activities = await listActivity(session.orgId!, id, limit, before);
    return jsonOk(activities);
  } catch (error: any) {
    return jsonError('INTERNAL_ERROR', error.message || 'Failed to list deal activity', 500);
  }
}
