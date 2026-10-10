import { query, transaction } from '@/lib/db';
import { Pipeline, PipelineStage, PipelineLabel } from '@/lib/types/pipeline';

export const pipelineRepo = {
  // ==========================================
  // PIPELINES
  // ==========================================

  async listPipelines(orgId: string): Promise<Pipeline[]> {
    const res = await query<Pipeline>(
      `SELECT * FROM public.pipelines WHERE org_id = $1 ORDER BY is_default DESC, created_at ASC`,
      [orgId]
    );
    return res.rows || [];
  },

  async getPipeline(orgId: string, pipelineId: string): Promise<Pipeline | null> {
    const res = await query<Pipeline>(
      `SELECT * FROM public.pipelines WHERE org_id = $1 AND id = $2`,
      [orgId, pipelineId]
    );
    return res.rows?.[0] || null;
  },

  async getDefaultPipeline(orgId: string): Promise<Pipeline | null> {
    const res = await query<Pipeline>(
      `SELECT * FROM public.pipelines WHERE org_id = $1 AND is_default = true LIMIT 1`,
      [orgId]
    );
    return res.rows?.[0] || null;
  },

  async createPipeline(
    orgId: string,
    input: { name: string; description?: string | null; isDefault?: boolean; createdBy?: string | null }
  ): Promise<Pipeline> {
    return await transaction(async (client) => {
      if (input.isDefault) {
        await client.query(`UPDATE public.pipelines SET is_default = false WHERE org_id = $1`, [orgId]);
      }

      const res = await client.query<Pipeline>(
        `INSERT INTO public.pipelines (org_id, name, description, is_default, created_by, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
         RETURNING *`,
        [orgId, input.name.trim(), input.description?.trim() || null, input.isDefault || false, input.createdBy || null]
      );
      return res.rows[0];
    });
  },

  async updatePipeline(
    orgId: string,
    pipelineId: string,
    input: { name?: string; description?: string | null; isDefault?: boolean }
  ): Promise<Pipeline | null> {
    return await transaction(async (client) => {
      if (input.isDefault) {
        await client.query(
          `UPDATE public.pipelines SET is_default = false WHERE org_id = $1 AND id != $2`,
          [orgId, pipelineId]
        );
      }

      const fields: string[] = ['updated_at = NOW()'];
      const params: any[] = [orgId, pipelineId];

      if (input.name !== undefined) {
        params.push(input.name.trim());
        fields.push(`name = $${params.length}`);
      }
      if (input.description !== undefined) {
        params.push(input.description?.trim() || null);
        fields.push(`description = $${params.length}`);
      }
      if (input.isDefault !== undefined) {
        params.push(input.isDefault);
        fields.push(`is_default = $${params.length}`);
      }

      const sql = `UPDATE public.pipelines SET ${fields.join(', ')} WHERE org_id = $1 AND id = $2 RETURNING *`;
      const res = await client.query<Pipeline>(sql, params);
      return res.rows?.[0] || null;
    });
  },

  async deletePipeline(orgId: string, pipelineId: string): Promise<{ success: boolean; error?: string }> {
    const totalCountRes = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM public.pipelines WHERE org_id = $1`,
      [orgId]
    );
    const count = parseInt(totalCountRes.rows?.[0]?.count || '0', 10);
    if (count <= 1) {
      return { success: false, error: 'Cannot delete the only sales pipeline in the organization.' };
    }

    await query(`DELETE FROM public.pipelines WHERE org_id = $1 AND id = $2`, [orgId, pipelineId]);
    return { success: true };
  },

  // ==========================================
  // STAGES (COLUMNS)
  // ==========================================

  async listStages(orgId: string, pipelineId: string): Promise<PipelineStage[]> {
    const res = await query<PipelineStage>(
      `SELECT * FROM public.pipeline_stages WHERE org_id = $1 AND pipeline_id = $2 ORDER BY position ASC`,
      [orgId, pipelineId]
    );
    return res.rows || [];
  },

  async getStage(orgId: string, stageId: string): Promise<PipelineStage | null> {
    const res = await query<PipelineStage>(
      `SELECT * FROM public.pipeline_stages WHERE org_id = $1 AND id = $2`,
      [orgId, stageId]
    );
    return res.rows?.[0] || null;
  },

  async createStage(
    orgId: string,
    pipelineId: string,
    input: { name: string; color?: string; isWon?: boolean; isLost?: boolean; wipLimit?: number | null }
  ): Promise<PipelineStage> {
    const maxPosRes = await query<{ max_pos: number | null }>(
      `SELECT MAX(position) as max_pos FROM public.pipeline_stages WHERE org_id = $1 AND pipeline_id = $2`,
      [orgId, pipelineId]
    );
    const nextPos = (maxPosRes.rows?.[0]?.max_pos || 0) + 1000.0;

    const res = await query<PipelineStage>(
      `INSERT INTO public.pipeline_stages (
        org_id, pipeline_id, name, color, position, is_won, is_lost, wip_limit, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING *`,
      [
        orgId,
        pipelineId,
        input.name.trim(),
        input.color || '#6366f1',
        nextPos,
        input.isWon || false,
        input.isLost || false,
        input.wipLimit || null,
      ]
    );
    return res.rows[0];
  },

  async updateStage(
    orgId: string,
    stageId: string,
    input: { name?: string; color?: string; isWon?: boolean; isLost?: boolean; wipLimit?: number | null }
  ): Promise<PipelineStage | null> {
    const fields: string[] = ['updated_at = NOW()'];
    const params: any[] = [orgId, stageId];

    if (input.name !== undefined) {
      params.push(input.name.trim());
      fields.push(`name = $${params.length}`);
    }
    if (input.color !== undefined) {
      params.push(input.color);
      fields.push(`color = $${params.length}`);
    }
    if (input.isWon !== undefined) {
      params.push(input.isWon);
      fields.push(`is_won = $${params.length}`);
    }
    if (input.isLost !== undefined) {
      params.push(input.isLost);
      fields.push(`is_lost = $${params.length}`);
    }
    if (input.wipLimit !== undefined) {
      params.push(input.wipLimit);
      fields.push(`wip_limit = $${params.length}`);
    }

    const sql = `UPDATE public.pipeline_stages SET ${fields.join(', ')} WHERE org_id = $1 AND id = $2 RETURNING *`;
    const res = await query<PipelineStage>(sql, params);
    return res.rows?.[0] || null;
  },

  async deleteStage(
    orgId: string,
    stageId: string,
    moveDealsToStageId: string
  ): Promise<{ success: boolean; error?: string }> {
    if (stageId === moveDealsToStageId) {
      return { success: false, error: 'Target stage cannot be the same as the deleted stage.' };
    }

    return await transaction(async (client) => {
      // 1. Move all deals to target stage
      await client.query(
        `UPDATE public.deals SET stage_id = $1, updated_at = NOW() WHERE org_id = $2 AND stage_id = $3`,
        [moveDealsToStageId, orgId, stageId]
      );

      // 2. Delete the stage
      await client.query(
        `DELETE FROM public.pipeline_stages WHERE org_id = $1 AND id = $2`,
        [orgId, stageId]
      );

      return { success: true };
    });
  },

  async reorderStages(orgId: string, pipelineId: string, stageIds: string[]): Promise<PipelineStage[]> {
    return await transaction(async (client) => {
      for (let i = 0; i < stageIds.length; i++) {
        const pos = (i + 1) * 1000.0;
        await client.query(
          `UPDATE public.pipeline_stages SET position = $1, updated_at = NOW() WHERE org_id = $2 AND pipeline_id = $3 AND id = $4`,
          [pos, orgId, pipelineId, stageIds[i]]
        );
      }

      const res = await client.query<PipelineStage>(
        `SELECT * FROM public.pipeline_stages WHERE org_id = $1 AND pipeline_id = $2 ORDER BY position ASC`,
        [orgId, pipelineId]
      );
      return res.rows || [];
    });
  },

  // ==========================================
  // LABELS
  // ==========================================

  async listLabels(orgId: string, pipelineId: string): Promise<PipelineLabel[]> {
    const res = await query<PipelineLabel>(
      `SELECT * FROM public.pipeline_labels WHERE org_id = $1 AND pipeline_id = $2 ORDER BY name ASC`,
      [orgId, pipelineId]
    );
    return res.rows || [];
  },

  async createLabel(orgId: string, pipelineId: string, name: string, color: string): Promise<PipelineLabel> {
    const res = await query<PipelineLabel>(
      `INSERT INTO public.pipeline_labels (org_id, pipeline_id, name, color, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (pipeline_id, name) DO UPDATE SET color = EXCLUDED.color
       RETURNING *`,
      [orgId, pipelineId, name.trim(), color]
    );
    return res.rows[0];
  },

  async deleteLabel(orgId: string, labelId: string): Promise<void> {
    await query(`DELETE FROM public.pipeline_labels WHERE org_id = $1 AND id = $2`, [orgId, labelId]);
  },

  // ==========================================
  // DEFAULT PIPELINE BOOTSTRAP / SEEDING (Prompt 05)
  // ==========================================

  async ensureDefaultPipeline(orgId: string, createdBy?: string | null): Promise<Pipeline> {
    const existing = await this.getDefaultPipeline(orgId);
    if (existing) {
      return existing;
    }

    return await transaction(async (client) => {
      // 1. Create default pipeline
      const pRes = await client.query<Pipeline>(
        `INSERT INTO public.pipelines (org_id, name, description, is_default, created_by, created_at, updated_at)
         VALUES ($1, 'Sales Pipeline', 'Main organizational sales pipeline and deal tracking board.', true, $2, NOW(), NOW())
         ON CONFLICT (org_id) WHERE is_default = true DO NOTHING
         RETURNING *`,
        [orgId, createdBy || null]
      );

      let pipeline = pRes.rows?.[0];
      if (!pipeline) {
        const pGet = await client.query<Pipeline>(
          `SELECT * FROM public.pipelines WHERE org_id = $1 AND is_default = true LIMIT 1`,
          [orgId]
        );
        pipeline = pGet.rows[0];
      }

      // 2. Insert standard 6 stages (Prompt 05)
      const defaultStages = [
        { name: 'Lead', color: '#94a3b8', pos: 1000, won: false, lost: false },
        { name: 'Qualified', color: '#38bdf8', pos: 2000, won: false, lost: false },
        { name: 'Proposal', color: '#a78bfa', pos: 3000, won: false, lost: false },
        { name: 'Negotiation', color: '#fb923c', pos: 4000, won: false, lost: false },
        { name: 'Won', color: '#22c55e', pos: 5000, won: true, lost: false },
        { name: 'Lost', color: '#ef4444', pos: 6000, won: false, lost: true },
      ];

      for (const s of defaultStages) {
        await client.query(
          `INSERT INTO public.pipeline_stages (
            org_id, pipeline_id, name, color, position, is_won, is_lost, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
          ON CONFLICT DO NOTHING`,
          [orgId, pipeline.id, s.name, s.color, s.pos, s.won, s.lost]
        );
      }

      // 3. Seed starter pipeline labels
      const defaultLabels = [
        { name: 'High Value', color: '#ef4444' },
        { name: 'Enterprise', color: '#8b5cf6' },
        { name: 'Fast Track', color: '#10b981' },
        { name: 'Follow Up Needed', color: '#f59e0b' },
      ];

      for (const l of defaultLabels) {
        await client.query(
          `INSERT INTO public.pipeline_labels (org_id, pipeline_id, name, color, created_at)
           VALUES ($1, $2, $3, $4, NOW())
           ON CONFLICT DO NOTHING`,
          [orgId, pipeline.id, l.name, l.color]
        );
      }

      return pipeline;
    });
  },
};
