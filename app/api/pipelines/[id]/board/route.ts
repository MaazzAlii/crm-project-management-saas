import { NextRequest } from 'next/server';
import { getPipelineSession } from '@/lib/pipeline/auth-helper';
import { dealService } from '@/lib/pipeline/deal-service';
import { jsonOk, jsonError, handleServiceError } from '@/lib/pipeline/response';
import { DealFilters } from '@/lib/types/pipeline';

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
    const { searchParams } = new URL(request.url);

    const filters: DealFilters = {};
    if (searchParams.get('ownerId')) filters.ownerId = searchParams.get('ownerId')!;
    if (searchParams.get('clientId')) filters.clientId = searchParams.get('clientId')!;
    if (searchParams.get('labelId')) filters.labelId = searchParams.get('labelId')!;
    if (searchParams.get('q')) filters.q = searchParams.get('q')!;
    if (searchParams.get('minValue')) filters.minValue = parseFloat(searchParams.get('minValue')!);
    if (searchParams.get('maxValue')) filters.maxValue = parseFloat(searchParams.get('maxValue')!);
    if (searchParams.get('closeBefore')) filters.closeBefore = searchParams.get('closeBefore')!;
    if (searchParams.get('closeAfter')) filters.closeAfter = searchParams.get('closeAfter')!;
    if (searchParams.get('status')) filters.status = searchParams.get('status') as any;
    if (searchParams.get('showClosed')) filters.showClosed = searchParams.get('showClosed') === 'true';

    const limit = parseInt(searchParams.get('limit') || '100', 10);

    const result = await dealService.listBoard(session, id, filters, limit);
    if (!result.success) {
      return handleServiceError(result.error!);
    }

    return jsonOk(result.data);
  } catch (error: any) {
    return jsonError('INTERNAL_ERROR', error.message || 'Failed to fetch pipeline board', 500);
  }
}
