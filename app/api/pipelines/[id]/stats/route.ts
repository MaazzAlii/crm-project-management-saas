import { NextRequest } from 'next/server';
import { getPipelineSession } from '@/lib/pipeline/auth-helper';
import { query } from '@/lib/db';
import { jsonOk, jsonError } from '@/lib/pipeline/response';

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

    // 1. Check pipeline belongs to org
    const pipeRes = await query<{ id: string }>(
      `SELECT id FROM public.pipelines WHERE org_id = $1 AND id = $2`,
      [session.orgId, id]
    );
    if (!pipeRes.rows?.[0]) {
      return jsonError('NOT_FOUND', 'Pipeline not found', 404);
    }

    // 2. Open deals aggregate stats
    const openStatsRes = await query<{
      total_open_value: string;
      weighted_forecast: string;
      total_open_deals: string;
      avg_deal_size: string;
    }>(
      `SELECT 
        COALESCE(SUM(value), 0) as total_open_value,
        COALESCE(SUM(value * (probability / 100.0)), 0) as weighted_forecast,
        COUNT(*) as total_open_deals,
        COALESCE(AVG(value), 0) as avg_deal_size
       FROM public.deals
       WHERE org_id = $1 AND pipeline_id = $2 AND status = 'open'`,
      [session.orgId, id]
    );

    const openStats = openStatsRes.rows[0];

    // 3. 90-day win rate
    const winRateRes = await query<{
      won_count: string;
      lost_count: string;
    }>(
      `SELECT 
        COUNT(*) FILTER (WHERE status = 'won') as won_count,
        COUNT(*) FILTER (WHERE status = 'lost') as lost_count
       FROM public.deals
       WHERE org_id = $1 AND pipeline_id = $2 
         AND status IN ('won', 'lost')
         AND closed_at >= NOW() - INTERVAL '90 days'`,
      [session.orgId, id]
    );

    const won90 = parseInt(winRateRes.rows[0]?.won_count || '0', 10);
    const lost90 = parseInt(winRateRes.rows[0]?.lost_count || '0', 10);
    const totalClosed90 = won90 + lost90;
    const winRate = totalClosed90 > 0 ? Math.round((won90 / totalClosed90) * 100) : 0;

    // 4. This month Won / Lost
    const thisMonthRes = await query<{
      won_month_count: string;
      won_month_value: string;
      lost_month_count: string;
      lost_month_value: string;
    }>(
      `SELECT 
        COUNT(*) FILTER (WHERE status = 'won') as won_month_count,
        COALESCE(SUM(value) FILTER (WHERE status = 'won'), 0) as won_month_value,
        COUNT(*) FILTER (WHERE status = 'lost') as lost_month_count,
        COALESCE(SUM(value) FILTER (WHERE status = 'lost'), 0) as lost_month_value
       FROM public.deals
       WHERE org_id = $1 AND pipeline_id = $2 
         AND status IN ('won', 'lost')
         AND closed_at >= date_trunc('month', CURRENT_DATE)`,
      [session.orgId, id]
    );

    const thisMonth = thisMonthRes.rows[0];

    // 5. Lost reasons breakdown
    const lostReasonsRes = await query<{
      lost_reason: string;
      count: string;
      total_value: string;
    }>(
      `SELECT 
        COALESCE(lost_reason, 'Unspecified') as lost_reason,
        COUNT(*) as count,
        COALESCE(SUM(value), 0) as total_value
       FROM public.deals
       WHERE org_id = $1 AND pipeline_id = $2 AND status = 'lost'
       GROUP BY lost_reason
       ORDER BY count DESC`,
      [session.orgId, id]
    );

    // 6. Monthly forecast projections for open deals
    const monthlyForecastRes = await query<{
      close_month: string;
      total_value: string;
      weighted_value: string;
      deals_count: string;
    }>(
      `SELECT 
        to_char(COALESCE(expected_close_date, CURRENT_DATE), 'YYYY-MM') as close_month,
        COALESCE(SUM(value), 0) as total_value,
        COALESCE(SUM(value * (probability / 100.0)), 0) as weighted_value,
        COUNT(*) as deals_count
       FROM public.deals
       WHERE org_id = $1 AND pipeline_id = $2 AND status = 'open'
       GROUP BY close_month
       ORDER BY close_month ASC
       LIMIT 12`,
      [session.orgId, id]
    );

    return jsonOk({
      totalOpenValue: parseFloat(openStats.total_open_value || '0'),
      weightedForecast: parseFloat(openStats.weighted_forecast || '0'),
      totalOpenDeals: parseInt(openStats.total_open_deals || '0', 10),
      avgDealSize: parseFloat(openStats.avg_deal_size || '0'),
      winRate,
      won90,
      lost90,
      wonThisMonth: {
        count: parseInt(thisMonth.won_month_count || '0', 10),
        value: parseFloat(thisMonth.won_month_value || '0'),
      },
      lostThisMonth: {
        count: parseInt(thisMonth.lost_month_count || '0', 10),
        value: parseFloat(thisMonth.lost_month_value || '0'),
      },
      lostReasons: (lostReasonsRes.rows || []).map((r) => ({
        reason: r.lost_reason,
        count: parseInt(r.count, 10),
        totalValue: parseFloat(r.total_value),
      })),
      monthlyForecast: (monthlyForecastRes.rows || []).map((m) => ({
        month: m.close_month,
        totalValue: parseFloat(m.total_value),
        weightedValue: parseFloat(m.weighted_value),
        dealsCount: parseInt(m.deals_count, 10),
      })),
    });
  } catch (error: any) {
    return jsonError('INTERNAL_ERROR', error.message || 'Failed to fetch pipeline stats', 500);
  }
}
