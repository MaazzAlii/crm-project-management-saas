import { query, transaction } from '@/lib/db';
import {
  Deal,
  DealFilters,
  BoardStageView,
  DealChecklist,
  DealChecklistItem,
  DealComment,
  PipelineLabel,
  CreateDealInput,
  UpdateDealInput,
} from '@/lib/types/pipeline';
import { positionBetween } from '@/lib/pipeline/position';

export interface DealRepoResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  conflict?: boolean;
  current?: Deal;
}

export const dealRepo = {
  // ==========================================
  // BOARD & DEALS LISTING (Prompt 07)
  // ==========================================

  async listBoard(
    orgId: string,
    pipelineId: string,
    filters: DealFilters = {},
    limitPerStage: number = 100
  ): Promise<BoardStageView[]> {
    // 1. Fetch all stages of this pipeline
    const stagesRes = await query<{
      id: string;
      org_id: string;
      pipeline_id: string;
      name: string;
      color: string;
      position: number;
      is_won: boolean;
      is_lost: boolean;
      wip_limit: number | null;
      created_at: string;
      updated_at: string;
    }>(
      `SELECT * FROM public.pipeline_stages 
       WHERE org_id = $1 AND pipeline_id = $2 
       ORDER BY position ASC`,
      [orgId, pipelineId]
    );

    const stages = stagesRes.rows || [];
    if (stages.length === 0) {
      return [];
    }

    // 2. Build parameterized query for deals across all stages in pipeline
    const conditions: string[] = ['d.org_id = $1', 'd.pipeline_id = $2'];
    const params: any[] = [orgId, pipelineId];

    if (filters.status) {
      params.push(filters.status);
      conditions.push(`d.status = $${params.length}`);
    } else if (filters.showClosed === false) {
      conditions.push(`d.status = 'open'`);
    } else {
      conditions.push(`d.status != 'archived'`);
    }

    if (filters.ownerId) {
      params.push(filters.ownerId);
      conditions.push(`d.owner_id = $${params.length}`);
    }

    if (filters.clientId) {
      params.push(filters.clientId);
      conditions.push(`d.client_id = $${params.length}`);
    }

    if (filters.minValue !== undefined && filters.minValue !== null) {
      params.push(filters.minValue);
      conditions.push(`d.value >= $${params.length}`);
    }

    if (filters.maxValue !== undefined && filters.maxValue !== null) {
      params.push(filters.maxValue);
      conditions.push(`d.value <= $${params.length}`);
    }

    if (filters.closeBefore) {
      params.push(filters.closeBefore);
      conditions.push(`d.expected_close_date <= $${params.length}`);
    }

    if (filters.closeAfter) {
      params.push(filters.closeAfter);
      conditions.push(`d.expected_close_date >= $${params.length}`);
    }

    if (filters.q && filters.q.trim().length > 0) {
      params.push(`%${filters.q.trim()}%`);
      conditions.push(`(
        d.title ILIKE $${params.length} OR
        EXISTS (
          SELECT 1 FROM public.clients c 
          WHERE c.id = d.client_id AND (c.name ILIKE $${params.length} OR c.company ILIKE $${params.length} OR c.email ILIKE $${params.length})
        )
      )`);
    }

    if (filters.labelId) {
      params.push(filters.labelId);
      conditions.push(`EXISTS (
        SELECT 1 FROM public.deal_labels dl 
        WHERE dl.deal_id = d.id AND dl.label_id = $${params.length}
      )`);
    }

    params.push(limitPerStage);
    const limitParamIdx = params.length;

    const dealsSql = `
      WITH ranked_deals AS (
        SELECT 
          d.*,
          ROW_NUMBER() OVER (PARTITION BY d.stage_id ORDER BY d.position ASC) as rn,
          COUNT(*) OVER (PARTITION BY d.stage_id) as stage_total_deals,
          COALESCE(SUM(d.value) OVER (PARTITION BY d.stage_id), 0) as stage_total_value,
          COALESCE((
            SELECT json_agg(json_build_object('id', pl.id, 'name', pl.name, 'color', pl.color))
            FROM public.deal_labels dl
            JOIN public.pipeline_labels pl ON pl.id = dl.label_id
            WHERE dl.deal_id = d.id
          ), '[]'::json) as labels,
          COALESCE((
            SELECT COUNT(*) FROM public.deal_checklists dc
            JOIN public.deal_checklist_items dci ON dci.checklist_id = dc.id
            WHERE dc.deal_id = d.id
          ), 0) as checklist_total_count,
          COALESCE((
            SELECT COUNT(*) FROM public.deal_checklists dc
            JOIN public.deal_checklist_items dci ON dci.checklist_id = dc.id
            WHERE dc.deal_id = d.id AND dci.is_done = true
          ), 0) as checklist_done_count,
          COALESCE((
            SELECT COUNT(*) FROM public.deal_comments dcm
            WHERE dcm.deal_id = d.id AND dcm.deleted_at IS NULL
          ), 0) as comments_count
        FROM public.deals d
        WHERE ${conditions.join(' AND ')}
      )
      SELECT * FROM ranked_deals
      WHERE rn <= $${limitParamIdx}
      ORDER BY position ASC
    `;

    const dealsRes = await query<any>(dealsSql, params);
    const dealRows = dealsRes.rows || [];

    // Group deals by stage
    const dealsByStage = new Map<string, any[]>();
    const totalCountByStage = new Map<string, number>();
    const totalValueByStage = new Map<string, number>();

    for (const d of dealRows) {
      if (!dealsByStage.has(d.stage_id)) {
        dealsByStage.set(d.stage_id, []);
      }
      dealsByStage.get(d.stage_id)!.push({
        ...d,
        value: parseFloat(d.value || 0),
        probability: parseFloat(d.probability || 0),
        position: parseFloat(d.position || 0),
        labels: typeof d.labels === 'string' ? JSON.parse(d.labels) : d.labels || [],
        checklist_total_count: parseInt(d.checklist_total_count || '0', 10),
        checklist_done_count: parseInt(d.checklist_done_count || '0', 10),
        comments_count: parseInt(d.comments_count || '0', 10),
      });

      totalCountByStage.set(d.stage_id, parseInt(d.stage_total_deals || '0', 10));
      totalValueByStage.set(d.stage_id, parseFloat(d.stage_total_value || 0));
    }

    // Build the final BoardStageView list
    return stages.map((stage) => {
      const stageDeals = dealsByStage.get(stage.id) || [];
      const totalDeals = totalCountByStage.get(stage.id) || stageDeals.length;
      const totalValue = totalValueByStage.get(stage.id) || stageDeals.reduce((sum, d) => sum + (d.value || 0), 0);

      return {
        stage: {
          ...stage,
          position: parseFloat(String(stage.position || 0)),
        },
        deals: stageDeals,
        totalDeals,
        totalValue,
        hasMore: totalDeals > stageDeals.length,
      };
    });
  },

  async listStageDeals(
    orgId: string,
    stageId: string,
    cursorPos?: number,
    limit: number = 50
  ): Promise<Deal[]> {
    const params: any[] = [orgId, stageId];
    let where = `d.org_id = $1 AND d.stage_id = $2 AND d.status != 'archived'`;

    if (cursorPos !== undefined) {
      params.push(cursorPos);
      where += ` AND d.position > $${params.length}`;
    }

    params.push(limit);
    const limitIdx = params.length;

    const sql = `
      SELECT 
        d.*,
        COALESCE((
          SELECT json_agg(json_build_object('id', pl.id, 'name', pl.name, 'color', pl.color))
          FROM public.deal_labels dl
          JOIN public.pipeline_labels pl ON pl.id = dl.label_id
          WHERE dl.deal_id = d.id
        ), '[]'::json) as labels,
        COALESCE((
          SELECT COUNT(*) FROM public.deal_checklists dc
          JOIN public.deal_checklist_items dci ON dci.checklist_id = dc.id
          WHERE dc.deal_id = d.id
        ), 0) as checklist_total_count,
        COALESCE((
          SELECT COUNT(*) FROM public.deal_checklists dc
          JOIN public.deal_checklist_items dci ON dci.checklist_id = dc.id
          WHERE dc.deal_id = d.id AND dci.is_done = true
        ), 0) as checklist_done_count,
        COALESCE((
          SELECT COUNT(*) FROM public.deal_comments dcm
          WHERE dcm.deal_id = d.id AND dcm.deleted_at IS NULL
        ), 0) as comments_count
      FROM public.deals d
      WHERE ${where}
      ORDER BY d.position ASC
      LIMIT $${limitIdx}
    `;

    const res = await query<any>(sql, params);
    return (res.rows || []).map((d) => ({
      ...d,
      value: parseFloat(d.value || 0),
      probability: parseFloat(d.probability || 0),
      position: parseFloat(d.position || 0),
      labels: typeof d.labels === 'string' ? JSON.parse(d.labels) : d.labels || [],
      checklist_total_count: parseInt(d.checklist_total_count || '0', 10),
      checklist_done_count: parseInt(d.checklist_done_count || '0', 10),
      comments_count: parseInt(d.comments_count || '0', 10),
    }));
  },

  // ==========================================
  // SINGLE DEAL CRUD & OPTIMISTIC LOCKING
  // ==========================================

  async getDeal(orgId: string, dealId: string): Promise<Deal | null> {
    const res = await query<any>(
      `SELECT 
        d.*,
        COALESCE((
          SELECT json_agg(json_build_object('id', pl.id, 'name', pl.name, 'color', pl.color))
          FROM public.deal_labels dl
          JOIN public.pipeline_labels pl ON pl.id = dl.label_id
          WHERE dl.deal_id = d.id
        ), '[]'::json) as labels,
        COALESCE((
          SELECT COUNT(*) FROM public.deal_checklists dc
          JOIN public.deal_checklist_items dci ON dci.checklist_id = dc.id
          WHERE dc.deal_id = d.id
        ), 0) as checklist_total_count,
        COALESCE((
          SELECT COUNT(*) FROM public.deal_checklists dc
          JOIN public.deal_checklist_items dci ON dci.checklist_id = dc.id
          WHERE dc.deal_id = d.id AND dci.is_done = true
        ), 0) as checklist_done_count,
        COALESCE((
          SELECT COUNT(*) FROM public.deal_comments dcm
          WHERE dcm.deal_id = d.id AND dcm.deleted_at IS NULL
        ), 0) as comments_count
      FROM public.deals d
      WHERE d.org_id = $1 AND d.id = $2`,
      [orgId, dealId]
    );

    const row = res.rows?.[0];
    if (!row) return null;

    return {
      ...row,
      value: parseFloat(row.value || 0),
      probability: parseFloat(row.probability || 0),
      position: parseFloat(row.position || 0),
      labels: typeof row.labels === 'string' ? JSON.parse(row.labels) : row.labels || [],
      checklist_total_count: parseInt(row.checklist_total_count || '0', 10),
      checklist_done_count: parseInt(row.checklist_done_count || '0', 10),
      comments_count: parseInt(row.comments_count || '0', 10),
    };
  },

  async createDeal(orgId: string, input: CreateDealInput): Promise<Deal> {
    return await transaction(async (client) => {
      // Find max position in stage
      const maxRes = await client.query<{ max_pos: number | null }>(
        `SELECT MAX(position) as max_pos FROM public.deals WHERE org_id = $1 AND stage_id = $2`,
        [orgId, input.stage_id]
      );
      const position = (maxRes.rows?.[0]?.max_pos || 0) + 1000.0;

      const res = await client.query<Deal>(
        `INSERT INTO public.deals (
          org_id, pipeline_id, stage_id, title, description, value, currency,
          probability, expected_close_date, client_id, owner_id, position,
          status, version, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11, $12,
          'open', 1, NOW(), NOW()
        ) RETURNING *`,
        [
          orgId,
          input.pipeline_id,
          input.stage_id,
          input.title.trim(),
          input.description || null,
          input.value ?? 0,
          input.currency || 'USD',
          input.probability ?? 50,
          input.expected_close_date || null,
          input.client_id || null,
          input.owner_id || null,
          position,
        ]
      );

      const deal = res.rows[0];

      // Add labels if provided
      if (input.label_ids && input.label_ids.length > 0) {
        for (const lid of input.label_ids) {
          await client.query(
            `INSERT INTO public.deal_labels (deal_id, label_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [deal.id, lid]
          );
        }
      }

      return deal;
    });
  },

  async updateDeal(
    orgId: string,
    dealId: string,
    input: UpdateDealInput,
    expectedVersion?: number
  ): Promise<DealRepoResult<Deal>> {
    return await transaction(async (client) => {
      // 1. Check current record
      const curRes = await client.query<Deal>(
        `SELECT * FROM public.deals WHERE org_id = $1 AND id = $2 FOR UPDATE`,
        [orgId, dealId]
      );
      const current = curRes.rows?.[0];
      if (!current) {
        return { success: false, error: 'Deal not found.' };
      }

      // 2. Check optimistic concurrency version
      if (expectedVersion !== undefined && current.version !== expectedVersion) {
        return {
          success: false,
          conflict: true,
          error: `Deal was modified by another user (expected v${expectedVersion}, current v${current.version}).`,
          current: {
            ...current,
            value: parseFloat(String(current.value || 0)),
            probability: parseFloat(String(current.probability || 0)),
            position: parseFloat(String(current.position || 0)),
          },
        };
      }

      // 3. Build update fields
      const fields: string[] = ['updated_at = NOW()', 'version = version + 1'];
      const params: any[] = [orgId, dealId];

      if (expectedVersion !== undefined) {
        params.push(expectedVersion);
      }

      const appendField = (col: string, val: any) => {
        params.push(val);
        fields.push(`${col} = $${params.length}`);
      };

      if (input.title !== undefined) appendField('title', input.title.trim());
      if (input.value !== undefined) appendField('value', input.value);
      if (input.currency !== undefined) appendField('currency', input.currency);
      if (input.probability !== undefined) appendField('probability', input.probability);
      if (input.expected_close_date !== undefined) appendField('expected_close_date', input.expected_close_date);
      if (input.client_id !== undefined) appendField('client_id', input.client_id);
      if (input.owner_id !== undefined) appendField('owner_id', input.owner_id);
      if (input.status !== undefined) appendField('status', input.status);
      if (input.lost_reason !== undefined) appendField('lost_reason', input.lost_reason);
      if (input.closed_at !== undefined) appendField('closed_at', input.closed_at);
      if (input.stage_id !== undefined) appendField('stage_id', input.stage_id);
      if (input.position !== undefined) appendField('position', input.position);

      const versionClause = expectedVersion !== undefined ? ` AND version = $3` : '';
      const sql = `UPDATE public.deals SET ${fields.join(', ')} WHERE org_id = $1 AND id = $2${versionClause} RETURNING *`;
      const updateRes = await client.query<Deal>(sql, params);

      if (updateRes.rows.length === 0) {
        return {
          success: false,
          conflict: true,
          error: 'Version conflict occurred during deal update.',
          current,
        };
      }

      // If label_ids are updated
      if (input.label_ids !== undefined) {
        await client.query(`DELETE FROM public.deal_labels WHERE deal_id = $1`, [dealId]);
        for (const lid of input.label_ids) {
          await client.query(
            `INSERT INTO public.deal_labels (deal_id, label_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [dealId, lid]
          );
        }
      }

      const updated = updateRes.rows[0];
      return {
        success: true,
        data: {
          ...updated,
          value: parseFloat(String(updated.value || 0)),
          probability: parseFloat(String(updated.probability || 0)),
          position: parseFloat(String(updated.position || 0)),
        },
      };
    });
  },

  async archiveDeal(orgId: string, dealId: string): Promise<boolean> {
    const res = await query(
      `UPDATE public.deals SET status = 'archived', updated_at = NOW(), version = version + 1 WHERE org_id = $1 AND id = $2`,
      [orgId, dealId]
    );
    return (res.rowCount ?? 0) > 0;
  },

  async restoreDeal(orgId: string, dealId: string): Promise<boolean> {
    const res = await query(
      `UPDATE public.deals SET status = 'open', updated_at = NOW(), version = version + 1 WHERE org_id = $1 AND id = $2`,
      [orgId, dealId]
    );
    return (res.rowCount ?? 0) > 0;
  },

  async deleteDeal(orgId: string, dealId: string): Promise<boolean> {
    const res = await query(`DELETE FROM public.deals WHERE org_id = $1 AND id = $2`, [orgId, dealId]);
    return (res.rowCount ?? 0) > 0;
  },

  // ==========================================
  // STAGE REBALANCING (Prompt 08 / 14)
  // ==========================================

  async rebalanceStageDeals(orgId: string, stageId: string): Promise<void> {
    await transaction(async (client) => {
      const dealsRes = await client.query<{ id: string }>(
        `SELECT id FROM public.deals WHERE org_id = $1 AND stage_id = $2 AND status != 'archived' ORDER BY position ASC`,
        [orgId, stageId]
      );
      const rows = dealsRes.rows || [];
      for (let i = 0; i < rows.length; i++) {
        const newPos = (i + 1) * 1000.0;
        await client.query(
          `UPDATE public.deals SET position = $1, updated_at = NOW() WHERE org_id = $2 AND id = $3`,
          [newPos, orgId, rows[i].id]
        );
      }
    });
  },

  // ==========================================
  // CHECKLISTS (Prompt 26)
  // ==========================================

  async getDealChecklists(orgId: string, dealId: string): Promise<DealChecklist[]> {
    const res = await query<any>(
      `SELECT 
        dc.*,
        COALESCE((
          SELECT json_agg(
            json_build_object(
              'id', dci.id,
              'checklist_id', dci.checklist_id,
              'title', dci.title,
              'is_done', dci.is_done,
              'position', dci.position,
              'due_date', dci.due_date,
              'created_at', dci.created_at,
              'updated_at', dci.updated_at
            ) ORDER BY dci.position ASC
          )
          FROM public.deal_checklist_items dci
          WHERE dci.checklist_id = dc.id
        ), '[]'::json) as items
      FROM public.deal_checklists dc
      JOIN public.deals d ON d.id = dc.deal_id
      WHERE d.org_id = $1 AND dc.deal_id = $2
      ORDER BY dc.created_at ASC`,
      [orgId, dealId]
    );

    return (res.rows || []).map((row) => ({
      ...row,
      items: typeof row.items === 'string' ? JSON.parse(row.items) : row.items || [],
    }));
  },

  async addChecklist(orgId: string, dealId: string, title: string): Promise<DealChecklist | null> {
    const deal = await this.getDeal(orgId, dealId);
    if (!deal) return null;

    const res = await query<DealChecklist>(
      `INSERT INTO public.deal_checklists (deal_id, title, created_at, updated_at)
       VALUES ($1, $2, NOW(), NOW())
       RETURNING *`,
      [dealId, title.trim()]
    );
    return { ...res.rows[0], items: [] };
  },

  async renameChecklist(orgId: string, checklistId: string, title: string): Promise<boolean> {
    const res = await query(
      `UPDATE public.deal_checklists dc
       SET title = $1, updated_at = NOW()
       FROM public.deals d
       WHERE dc.deal_id = d.id AND d.org_id = $2 AND dc.id = $3`,
      [title.trim(), orgId, checklistId]
    );
    return (res.rowCount ?? 0) > 0;
  },

  async deleteChecklist(orgId: string, checklistId: string): Promise<boolean> {
    const res = await query(
      `DELETE FROM public.deal_checklists dc
       USING public.deals d
       WHERE dc.deal_id = d.id AND d.org_id = $1 AND dc.id = $2`,
      [orgId, checklistId]
    );
    return (res.rowCount ?? 0) > 0;
  },

  async addChecklistItem(
    orgId: string,
    checklistId: string,
    title: string,
    dueDate?: string | null
  ): Promise<DealChecklistItem | null> {
    // Verify checklist belongs to this org
    const clRes = await query(
      `SELECT dc.id FROM public.deal_checklists dc
       JOIN public.deals d ON d.id = dc.deal_id
       WHERE d.org_id = $1 AND dc.id = $2`,
      [orgId, checklistId]
    );
    if (!clRes.rows?.[0]) return null;

    const maxPosRes = await query<{ max_pos: number | null }>(
      `SELECT MAX(position) as max_pos FROM public.deal_checklist_items WHERE checklist_id = $1`,
      [checklistId]
    );
    const nextPos = (maxPosRes.rows?.[0]?.max_pos || 0) + 1000.0;

    const res = await query<DealChecklistItem>(
      `INSERT INTO public.deal_checklist_items (checklist_id, title, is_done, position, due_date, created_at, updated_at)
       VALUES ($1, $2, false, $3, $4, NOW(), NOW())
       RETURNING *`,
      [checklistId, title.trim(), nextPos, dueDate || null]
    );
    return res.rows[0];
  },

  async updateChecklistItem(
    orgId: string,
    itemId: string,
    updates: { title?: string; is_done?: boolean; due_date?: string | null }
  ): Promise<DealChecklistItem | null> {
    const fields: string[] = ['dci.updated_at = NOW()'];
    const params: any[] = [orgId, itemId];

    if (updates.title !== undefined) {
      params.push(updates.title.trim());
      fields.push(`title = $${params.length}`);
    }
    if (updates.is_done !== undefined) {
      params.push(updates.is_done);
      fields.push(`is_done = $${params.length}`);
    }
    if (updates.due_date !== undefined) {
      params.push(updates.due_date);
      fields.push(`due_date = $${params.length}`);
    }

    const sql = `
      UPDATE public.deal_checklist_items dci
      SET ${fields.join(', ')}
      FROM public.deal_checklists dc
      JOIN public.deals d ON d.id = dc.deal_id
      WHERE dci.checklist_id = dc.id AND d.org_id = $1 AND dci.id = $2
      RETURNING dci.*
    `;
    const res = await query<DealChecklistItem>(sql, params);
    return res.rows?.[0] || null;
  },

  async deleteChecklistItem(orgId: string, itemId: string): Promise<boolean> {
    const res = await query(
      `DELETE FROM public.deal_checklist_items dci
       USING public.deal_checklists dc, public.deals d
       WHERE dci.checklist_id = dc.id AND dc.deal_id = d.id AND d.org_id = $1 AND dci.id = $2`,
      [orgId, itemId]
    );
    return (res.rowCount ?? 0) > 0;
  },

  // ==========================================
  // COMMENTS (Prompt 27)
  // ==========================================

  async getDealComments(orgId: string, dealId: string): Promise<DealComment[]> {
    const res = await query<any>(
      `SELECT 
        dc.id,
        dc.org_id,
        dc.deal_id,
        dc.author_id,
        dc.body as content,
        dc.body,
        dc.created_at,
        dc.updated_at,
        u.full_name as author_name,
        u.email as author_email,
        u.avatar_url as author_avatar_url
      FROM public.deal_comments dc
      JOIN public.deals d ON d.id = dc.deal_id
      LEFT JOIN public.users u ON u.id = dc.author_id
      WHERE d.org_id = $1 AND dc.deal_id = $2 AND dc.deleted_at IS NULL
      ORDER BY dc.created_at ASC`,
      [orgId, dealId]
    );
    return res.rows || [];
  },

  async addComment(orgId: string, dealId: string, authorId: string, content: string): Promise<DealComment | null> {
    const deal = await this.getDeal(orgId, dealId);
    if (!deal) return null;

    const res = await query<DealComment>(
      `INSERT INTO public.deal_comments (org_id, deal_id, author_id, body, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING id, org_id, deal_id, author_id, body as content, created_at, updated_at`,
      [orgId, dealId, authorId, content.trim()]
    );
    return res.rows[0];
  },

  async updateComment(
    orgId: string,
    commentId: string,
    authorId: string,
    content: string
  ): Promise<DealComment | null> {
    const res = await query<DealComment>(
      `UPDATE public.deal_comments dc
       SET body = $1, updated_at = NOW()
       FROM public.deals d
       WHERE dc.deal_id = d.id AND d.org_id = $2 AND dc.id = $3 AND dc.author_id = $4 AND dc.deleted_at IS NULL
       RETURNING dc.id, dc.org_id, dc.deal_id, dc.author_id, dc.body as content, dc.created_at, dc.updated_at`,
      [content.trim(), orgId, commentId, authorId]
    );
    return res.rows?.[0] || null;
  },

  async deleteComment(
    orgId: string,
    commentId: string,
    authorId: string,
    isAdmin: boolean
  ): Promise<boolean> {
    const whereAuth = isAdmin ? '' : 'AND dc.author_id = $3';
    const params = isAdmin ? [orgId, commentId] : [orgId, commentId, authorId];

    const res = await query(
      `UPDATE public.deal_comments dc
       SET deleted_at = NOW(), updated_at = NOW()
       FROM public.deals d
       WHERE dc.deal_id = d.id AND d.org_id = $1 AND dc.id = $2 ${whereAuth}`,
      params
    );
    return (res.rowCount ?? 0) > 0;
  },
};
