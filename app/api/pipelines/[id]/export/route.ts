import { NextRequest, NextResponse } from 'next/server';
import { getPipelineSession } from '@/lib/pipeline/auth-helper';
import { query } from '@/lib/db';
import { jsonError } from '@/lib/pipeline/response';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await getPipelineSession(request);
    if (!session || !session.orgId) {
      return jsonError('UNAUTHORIZED', 'Missing or invalid authentication session', 401);
    }

    const { id } = await context.params;

    const dealsRes = await query<any>(
      `SELECT 
        d.title,
        d.value,
        d.currency,
        d.probability,
        (d.value * (d.probability / 100.0)) as weighted_value,
        ps.name as stage_name,
        d.status,
        d.company_name,
        d.contact_name,
        d.contact_email,
        d.expected_close_date,
        d.closed_at,
        d.lost_reason,
        d.created_at
       FROM public.deals d
       JOIN public.pipeline_stages ps ON ps.id = d.stage_id
       WHERE d.org_id = $1 AND d.pipeline_id = $2 AND d.status != 'archived'
       ORDER BY ps.position ASC, d.position ASC`,
      [session.orgId, id]
    );

    const rows = dealsRes.rows || [];

    const headers = [
      'Title',
      'Stage',
      'Status',
      'Value',
      'Currency',
      'Probability (%)',
      'Weighted Value',
      'Company',
      'Contact Name',
      'Contact Email',
      'Expected Close Date',
      'Closed At',
      'Lost Reason',
      'Created At',
    ];

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const csvLines = [headers.join(',')];
    for (const r of rows) {
      csvLines.push(
        [
          escapeCsv(r.title),
          escapeCsv(r.stage_name),
          escapeCsv(r.status),
          r.value,
          escapeCsv(r.currency),
          r.probability,
          parseFloat(r.weighted_value || 0).toFixed(2),
          escapeCsv(r.company_name),
          escapeCsv(r.contact_name),
          escapeCsv(r.contact_email),
          escapeCsv(r.expected_close_date),
          escapeCsv(r.closed_at),
          escapeCsv(r.lost_reason),
          escapeCsv(r.created_at),
        ].join(',')
      );
    }

    const csvString = csvLines.join('\n');

    return new NextResponse(csvString, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="pipeline-deals-export-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error: any) {
    return jsonError('INTERNAL_ERROR', error.message || 'Failed to export deals CSV', 500);
  }
}
