import { NextRequest } from 'next/server';
import { getPipelineSession } from '@/lib/pipeline/auth-helper';
import { dealService } from '@/lib/pipeline/deal-service';
import { jsonOk, jsonError, handleServiceError } from '@/lib/pipeline/response';

export async function POST(request: NextRequest) {
  try {
    const session = await getPipelineSession(request);
    if (!session) {
      return jsonError('UNAUTHORIZED', 'Missing or invalid authentication session', 401);
    }

    const body = await request.json().catch(() => ({}));
    if (!body.title || typeof body.title !== 'string' || body.title.trim().length === 0) {
      return jsonError('VALIDATION_ERROR', 'Deal title is required', 400);
    }
    if (!body.pipeline_id || !body.stage_id) {
      return jsonError('VALIDATION_ERROR', 'pipeline_id and stage_id are required', 400);
    }

    const result = await dealService.createDeal(session, {
      pipeline_id: body.pipeline_id,
      stage_id: body.stage_id,
      title: body.title,
      value: body.value !== undefined ? parseFloat(body.value) : 0,
      currency: body.currency || 'USD',
      probability: body.probability !== undefined ? parseInt(body.probability, 10) : 50,
      expected_close_date: body.expected_close_date || null,
      company_name: body.company_name || null,
      contact_name: body.contact_name || null,
      contact_email: body.contact_email || null,
      contact_phone: body.contact_phone || null,
      client_id: body.client_id || null,
      owner_id: body.owner_id || null,
      label_ids: Array.isArray(body.label_ids) ? body.label_ids : undefined,
    });

    if (!result.success) {
      return handleServiceError(result.error!);
    }

    return jsonOk(result.data, 201);
  } catch (error: any) {
    return jsonError('INTERNAL_ERROR', error.message || 'Failed to create deal', 500);
  }
}
