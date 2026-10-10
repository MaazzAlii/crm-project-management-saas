import { query } from '@/lib/db';
import { DealActivity, DealActivityType } from '@/lib/types/pipeline';

/**
 * Records activity events on deals (Trello history feed).
 * Safe execution: errors are caught so they do not break core business mutations.
 */
export async function recordActivity(
  orgId: string,
  dealId: string,
  actorId: string | null,
  type: DealActivityType,
  data: Record<string, any> = {}
): Promise<void> {
  try {
    // Sanitize data: only store short labels / field names, never secrets
    const sanitizedData: Record<string, any> = {};
    for (const [k, v] of Object.entries(data)) {
      if (typeof v === 'string' && v.length > 500) {
        sanitizedData[k] = v.substring(0, 500) + '...';
      } else {
        sanitizedData[k] = v;
      }
    }

    await query(
      `INSERT INTO deal_activities (org_id, deal_id, actor_id, type, data, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [orgId, dealId, actorId, type, JSON.stringify(sanitizedData)]
    );
  } catch (err) {
    console.error('[RecordActivityError] Non-fatal activity write failed:', err);
  }
}

/**
 * List activity entries for a deal, newest first, with cursor pagination.
 */
export async function listActivity(
  orgId: string,
  dealId: string,
  limit: number = 50,
  cursorCreatedAt?: string
): Promise<{ items: DealActivity[]; nextCursor?: string }> {
  let sql = `
    SELECT 
      da.id, da.org_id, da.deal_id, da.actor_id, da.type, da.data, da.created_at,
      u.full_name as actor_name
    FROM deal_activities da
    LEFT JOIN users u ON da.actor_id = u.id
    WHERE da.org_id = $1 AND da.deal_id = $2
  `;
  const params: any[] = [orgId, dealId];

  if (cursorCreatedAt) {
    params.push(cursorCreatedAt);
    sql += ` AND da.created_at < $${params.length}`;
  }

  params.push(limit + 1);
  sql += ` ORDER BY da.created_at DESC LIMIT $${params.length}`;

  const res = await query<any>(sql, params);
  const rows = res.rows || [];

  let nextCursor: string | undefined = undefined;
  if (rows.length > limit) {
    const extra = rows.pop();
    nextCursor = rows[rows.length - 1]?.created_at;
  }

  const items: DealActivity[] = rows.map((r: any) => ({
    id: r.id,
    org_id: r.org_id,
    deal_id: r.deal_id,
    actor_id: r.actor_id,
    actor_name: r.actor_name || null,
    action: r.type || 'activity',
    type: r.type,
    data: typeof r.data === 'string' ? JSON.parse(r.data) : r.data || {},
    created_at: r.created_at,
  }));

  return { items, nextCursor };
}

/**
 * Helper to compute diff of changed fields between old and new state.
 */
export function calculateDealDiff(
  oldDeal: Record<string, any>,
  newDeal: Record<string, any>,
  fieldsToCheck: string[] = ['title', 'description', 'value', 'stage_id', 'status', 'owner_id', 'expected_close_date', 'probability']
): Record<string, { from: any; to: any }> {
  const changes: Record<string, { from: any; to: any }> = {};

  for (const field of fieldsToCheck) {
    if (newDeal[field] !== undefined && newDeal[field] !== oldDeal[field]) {
      changes[field] = {
        from: oldDeal[field] !== undefined ? oldDeal[field] : null,
        to: newDeal[field],
      };
    }
  }

  return changes;
}
