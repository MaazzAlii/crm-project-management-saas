import { pipelineRepo } from '@/lib/db/repositories/pipeline-repo';
import { SessionContext } from '@/lib/auth/session';
import { Pipeline, PipelineStage, PipelineLabel } from '@/lib/types/pipeline';
import { canUserManage, canUserWrite, ServiceResult } from './deal-service';

export const pipelineService = {
  // ==========================================
  // PIPELINES
  // ==========================================

  async ensureDefaultPipeline(orgId: string, createdBy?: string | null): Promise<Pipeline> {
    return await pipelineRepo.ensureDefaultPipeline(orgId, createdBy);
  },

  async listPipelines(session: SessionContext): Promise<ServiceResult<Pipeline[]>> {
    const orgId = session.orgId;
    if (!orgId) return { success: false, error: { code: 'UNAUTHORIZED', message: 'No org context' } };

    // Auto-bootstrap default pipeline if none exists for this tenant
    await pipelineRepo.ensureDefaultPipeline(orgId, session.userId);

    const pipelines = await pipelineRepo.listPipelines(orgId);
    return { success: true, data: pipelines };
  },

  async getPipeline(session: SessionContext, pipelineId: string): Promise<ServiceResult<Pipeline>> {
    const orgId = session.orgId;
    if (!orgId) return { success: false, error: { code: 'UNAUTHORIZED', message: 'No org context' } };

    const pipeline = await pipelineRepo.getPipeline(orgId, pipelineId);
    if (!pipeline) return { success: false, error: { code: 'NOT_FOUND', message: 'Pipeline not found' } };

    return { success: true, data: pipeline };
  },

  async createPipeline(
    session: SessionContext,
    input: { name: string; description?: string | null; isDefault?: boolean }
  ): Promise<ServiceResult<Pipeline>> {
    const orgId = session.orgId;
    if (!orgId) return { success: false, error: { code: 'UNAUTHORIZED', message: 'No org context' } };
    if (!canUserManage(session)) return { success: false, error: { code: 'FORBIDDEN', message: 'Only admins can create pipelines' } };

    if (!input.name || input.name.trim().length === 0) {
      return { success: false, error: { code: 'BAD_REQUEST', message: 'Pipeline name is required' } };
    }

    const pipeline = await pipelineRepo.createPipeline(orgId, {
      ...input,
      createdBy: session.userId,
    });

    // Create standard default stages for this new pipeline
    const defaultStages = [
      { name: 'Lead', color: '#94a3b8', pos: 1000, won: false, lost: false },
      { name: 'Qualified', color: '#38bdf8', pos: 2000, won: false, lost: false },
      { name: 'Proposal', color: '#a78bfa', pos: 3000, won: false, lost: false },
      { name: 'Negotiation', color: '#fb923c', pos: 4000, won: false, lost: false },
      { name: 'Won', color: '#22c55e', pos: 5000, won: true, lost: false },
      { name: 'Lost', color: '#ef4444', pos: 6000, won: false, lost: true },
    ];

    for (const s of defaultStages) {
      await pipelineRepo.createStage(orgId, pipeline.id, {
        name: s.name,
        color: s.color,
        isWon: s.won,
        isLost: s.lost,
      });
    }

    return { success: true, data: pipeline };
  },

  async updatePipeline(
    session: SessionContext,
    pipelineId: string,
    input: { name?: string; description?: string | null; isDefault?: boolean }
  ): Promise<ServiceResult<Pipeline>> {
    const orgId = session.orgId;
    if (!orgId) return { success: false, error: { code: 'UNAUTHORIZED', message: 'No org context' } };
    if (!canUserManage(session)) return { success: false, error: { code: 'FORBIDDEN', message: 'Only admins can update pipelines' } };

    const pipeline = await pipelineRepo.getPipeline(orgId, pipelineId);
    if (!pipeline) return { success: false, error: { code: 'NOT_FOUND', message: 'Pipeline not found' } };

    const updated = await pipelineRepo.updatePipeline(orgId, pipelineId, input);
    return { success: true, data: updated || pipeline };
  },

  async deletePipeline(session: SessionContext, pipelineId: string): Promise<ServiceResult<boolean>> {
    const orgId = session.orgId;
    if (!orgId) return { success: false, error: { code: 'UNAUTHORIZED', message: 'No org context' } };
    if (!canUserManage(session)) return { success: false, error: { code: 'FORBIDDEN', message: 'Only admins can delete pipelines' } };

    const pipeline = await pipelineRepo.getPipeline(orgId, pipelineId);
    if (!pipeline) return { success: false, error: { code: 'NOT_FOUND', message: 'Pipeline not found' } };

    const res = await pipelineRepo.deletePipeline(orgId, pipelineId);
    if (!res.success) {
      return { success: false, error: { code: 'BAD_REQUEST', message: res.error || 'Failed to delete pipeline' } };
    }
    return { success: true, data: true };
  },

  // ==========================================
  // STAGES (COLUMNS)
  // ==========================================

  async listStages(session: SessionContext, pipelineId: string): Promise<ServiceResult<PipelineStage[]>> {
    const orgId = session.orgId;
    if (!orgId) return { success: false, error: { code: 'UNAUTHORIZED', message: 'No org context' } };

    const pipeline = await pipelineRepo.getPipeline(orgId, pipelineId);
    if (!pipeline) return { success: false, error: { code: 'NOT_FOUND', message: 'Pipeline not found' } };

    const stages = await pipelineRepo.listStages(orgId, pipelineId);
    return { success: true, data: stages };
  },

  async createStage(
    session: SessionContext,
    pipelineId: string,
    input: { name: string; color?: string; isWon?: boolean; isLost?: boolean; wipLimit?: number | null }
  ): Promise<ServiceResult<PipelineStage>> {
    const orgId = session.orgId;
    if (!orgId) return { success: false, error: { code: 'UNAUTHORIZED', message: 'No org context' } };
    if (!canUserManage(session)) return { success: false, error: { code: 'FORBIDDEN', message: 'Only admins can manage stages' } };

    const pipeline = await pipelineRepo.getPipeline(orgId, pipelineId);
    if (!pipeline) return { success: false, error: { code: 'NOT_FOUND', message: 'Pipeline not found' } };

    if (!input.name || input.name.trim().length === 0) {
      return { success: false, error: { code: 'BAD_REQUEST', message: 'Stage name is required' } };
    }

    const stage = await pipelineRepo.createStage(orgId, pipelineId, input);
    return { success: true, data: stage };
  },

  async updateStage(
    session: SessionContext,
    pipelineId: string,
    stageId: string,
    input: { name?: string; color?: string; isWon?: boolean; isLost?: boolean; wipLimit?: number | null }
  ): Promise<ServiceResult<PipelineStage>> {
    const orgId = session.orgId;
    if (!orgId) return { success: false, error: { code: 'UNAUTHORIZED', message: 'No org context' } };
    if (!canUserManage(session)) return { success: false, error: { code: 'FORBIDDEN', message: 'Only admins can manage stages' } };

    const stage = await pipelineRepo.getStage(orgId, stageId);
    if (!stage || stage.pipeline_id !== pipelineId) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Stage not found' } };
    }

    const updated = await pipelineRepo.updateStage(orgId, stageId, input);
    return { success: true, data: updated || stage };
  },

  async deleteStage(
    session: SessionContext,
    pipelineId: string,
    stageId: string,
    moveToStageId: string
  ): Promise<ServiceResult<boolean>> {
    const orgId = session.orgId;
    if (!orgId) return { success: false, error: { code: 'UNAUTHORIZED', message: 'No org context' } };
    if (!canUserManage(session)) return { success: false, error: { code: 'FORBIDDEN', message: 'Only admins can delete stages' } };

    const stage = await pipelineRepo.getStage(orgId, stageId);
    if (!stage || stage.pipeline_id !== pipelineId) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Stage not found' } };
    }

    const targetStage = await pipelineRepo.getStage(orgId, moveToStageId);
    if (!targetStage || targetStage.pipeline_id !== pipelineId) {
      return { success: false, error: { code: 'BAD_REQUEST', message: 'Target stage to move deals into is invalid' } };
    }

    const res = await pipelineRepo.deleteStage(orgId, stageId, moveToStageId);
    if (!res.success) {
      return { success: false, error: { code: 'BAD_REQUEST', message: res.error || 'Failed to delete stage' } };
    }
    return { success: true, data: true };
  },

  async reorderStages(
    session: SessionContext,
    pipelineId: string,
    orderedIds: string[]
  ): Promise<ServiceResult<PipelineStage[]>> {
    const orgId = session.orgId;
    if (!orgId) return { success: false, error: { code: 'UNAUTHORIZED', message: 'No org context' } };
    if (!canUserManage(session)) return { success: false, error: { code: 'FORBIDDEN', message: 'Only admins can reorder stages' } };

    const currentStages = await pipelineRepo.listStages(orgId, pipelineId);
    if (currentStages.length === 0) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Pipeline not found or has no stages' } };
    }

    // Validate orderedIds matches current stage IDs exactly (Prompt 15)
    const currentIdSet = new Set(currentStages.map((s) => s.id));
    const inputIdSet = new Set(orderedIds);

    if (
      orderedIds.length !== currentStages.length ||
      inputIdSet.size !== orderedIds.length ||
      orderedIds.some((id) => !currentIdSet.has(id))
    ) {
      return {
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: 'orderedIds must contain all current stage IDs of the pipeline exactly once without extra or missing IDs.',
        },
      };
    }

    const updated = await pipelineRepo.reorderStages(orgId, pipelineId, orderedIds);
    return { success: true, data: updated };
  },

  // ==========================================
  // LABELS
  // ==========================================

  async listLabels(session: SessionContext, pipelineId: string): Promise<ServiceResult<PipelineLabel[]>> {
    const orgId = session.orgId;
    if (!orgId) return { success: false, error: { code: 'UNAUTHORIZED', message: 'No org context' } };

    const labels = await pipelineRepo.listLabels(orgId, pipelineId);
    return { success: true, data: labels };
  },

  async createLabel(
    session: SessionContext,
    pipelineId: string,
    name: string,
    color: string
  ): Promise<ServiceResult<PipelineLabel>> {
    const orgId = session.orgId;
    if (!orgId) return { success: false, error: { code: 'UNAUTHORIZED', message: 'No org context' } };
    if (!canUserWrite(session)) return { success: false, error: { code: 'FORBIDDEN', message: 'Viewers cannot create labels' } };

    const label = await pipelineRepo.createLabel(orgId, pipelineId, name, color);
    return { success: true, data: label };
  },

  async deleteLabel(session: SessionContext, labelId: string): Promise<ServiceResult<boolean>> {
    const orgId = session.orgId;
    if (!orgId) return { success: false, error: { code: 'UNAUTHORIZED', message: 'No org context' } };
    if (!canUserManage(session)) return { success: false, error: { code: 'FORBIDDEN', message: 'Only admins can delete labels' } };

    await pipelineRepo.deleteLabel(orgId, labelId);
    return { success: true, data: true };
  },
};
