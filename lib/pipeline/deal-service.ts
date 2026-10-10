import { dealRepo, DealRepoResult } from '@/lib/db/repositories/deal-repo';
import { pipelineRepo } from '@/lib/db/repositories/pipeline-repo';
import { recordActivity } from '@/lib/pipeline/activity';
import { positionBetween, needsRebalance } from '@/lib/pipeline/position';
import { SessionContext } from '@/lib/auth/session';
import {
  Deal,
  DealFilters,
  BoardStageView,
  CreateDealInput,
  UpdateDealInput,
  DealChecklist,
  DealChecklistItem,
  DealComment,
} from '@/lib/types/pipeline';
import { query } from '@/lib/db';

export interface ServiceError {
  code: 'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND' | 'VERSION_CONFLICT' | 'WIP_LIMIT' | 'LOST_REASON_REQUIRED' | 'BAD_REQUEST';
  message: string;
  stageName?: string;
  limit?: number;
  currentDeal?: Deal;
}

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: ServiceError;
}

export function canUserManage(session: SessionContext): boolean {
  if (session.isSuperAdmin) return true;
  const role = session.role?.toLowerCase();
  return role === 'owner' || role === 'admin' || role === 'org_admin';
}

export function canUserWrite(session: SessionContext): boolean {
  if (session.isSuperAdmin) return true;
  const role = session.role?.toLowerCase();
  if (role === 'viewer') return false;
  return true; // member, billing_manager, owner, admin, etc.
}

export const dealService = {
  // ==========================================
  // BOARD & DEALS
  // ==========================================

  async listBoard(
    session: SessionContext,
    pipelineId: string,
    filters: DealFilters = {},
    limitPerStage: number = 100
  ): Promise<ServiceResult<BoardStageView[]>> {
    const orgId = session.orgId;
    if (!orgId) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'No organization context found.' } };
    }

    // Verify pipeline belongs to this org
    const pipeline = await pipelineRepo.getPipeline(orgId, pipelineId);
    if (!pipeline) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Pipeline not found.' } };
    }

    const board = await dealRepo.listBoard(orgId, pipelineId, filters, limitPerStage);
    return { success: true, data: board };
  },

  async getDeal(session: SessionContext, dealId: string): Promise<ServiceResult<Deal>> {
    const orgId = session.orgId;
    if (!orgId) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'No organization context found.' } };
    }

    const deal = await dealRepo.getDeal(orgId, dealId);
    if (!deal) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Deal not found.' } };
    }

    return { success: true, data: deal };
  },

  async createDeal(session: SessionContext, input: CreateDealInput): Promise<ServiceResult<Deal>> {
    const orgId = session.orgId;
    if (!orgId) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'No organization context found.' } };
    }

    if (!canUserWrite(session)) {
      return { success: false, error: { code: 'FORBIDDEN', message: 'Viewers are not permitted to create deals.' } };
    }

    // Verify pipeline & stage
    const pipeline = await pipelineRepo.getPipeline(orgId, input.pipeline_id);
    if (!pipeline) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Pipeline not found.' } };
    }

    const stage = await pipelineRepo.getStage(orgId, input.stage_id);
    if (!stage || stage.pipeline_id !== input.pipeline_id) {
      return { success: false, error: { code: 'BAD_REQUEST', message: 'Stage does not belong to specified pipeline.' } };
    }

    // Check WIP Limit
    if (stage.wip_limit && stage.wip_limit > 0 && !canUserManage(session)) {
      const countRes = await query<{ count: string }>(
        `SELECT COUNT(*) as count FROM public.deals WHERE org_id = $1 AND stage_id = $2 AND status = 'open'`,
        [orgId, stage.id]
      );
      const currentCount = parseInt(countRes.rows?.[0]?.count || '0', 10);
      if (currentCount >= stage.wip_limit) {
        return {
          success: false,
          error: {
            code: 'WIP_LIMIT',
            message: `Stage "${stage.name}" has reached its maximum work-in-progress limit of ${stage.wip_limit} deals.`,
            stageName: stage.name,
            limit: stage.wip_limit,
          },
        };
      }
    }

    const deal = await dealRepo.createDeal(orgId, {
      ...input,
      owner_id: input.owner_id || session.userId,
    });

    // Record activity
    await recordActivity(orgId, deal.id, session.userId, 'created', {
      deal_title: deal.title,
      stage_id: deal.stage_id,
      stage_name: stage.name,
      value: deal.value,
    });

    const fullDeal = await dealRepo.getDeal(orgId, deal.id);
    return { success: true, data: fullDeal || deal };
  },

  async updateDeal(
    session: SessionContext,
    dealId: string,
    input: UpdateDealInput,
    expectedVersion?: number
  ): Promise<ServiceResult<Deal>> {
    const orgId = session.orgId;
    if (!orgId) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'No organization context found.' } };
    }

    if (!canUserWrite(session)) {
      return { success: false, error: { code: 'FORBIDDEN', message: 'Viewers cannot modify deals.' } };
    }

    const current = await dealRepo.getDeal(orgId, dealId);
    if (!current) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Deal not found.' } };
    }

    const result = await dealRepo.updateDeal(orgId, dealId, input, expectedVersion);
    if (!result.success) {
      if (result.conflict) {
        return {
          success: false,
          error: {
            code: 'VERSION_CONFLICT',
            message: result.error || 'Conflict: deal was modified by another user.',
            currentDeal: result.current,
          },
        };
      }
      return {
        success: false,
        error: { code: 'BAD_REQUEST', message: result.error || 'Failed to update deal.' },
      };
    }

    const updated = result.data!;

    // Record activity
    await recordActivity(orgId, dealId, session.userId, 'updated', {
      before: {
        title: current.title,
        value: current.value,
        stage_id: current.stage_id,
        probability: current.probability,
      },
      after: {
        title: updated.title,
        value: updated.value,
        stage_id: updated.stage_id,
        probability: updated.probability,
      },
    });

    const fullDeal = await dealRepo.getDeal(orgId, dealId);
    return { success: true, data: fullDeal || updated };
  },

  // ==========================================
  // MOVE DEAL (Prompt 14 - Drag and Drop Engine)
  // ==========================================

  async moveDeal(
    session: SessionContext,
    dealId: string,
    opts: {
      toStageId: string;
      beforeId?: string | null;
      afterId?: string | null;
      expectedVersion?: number;
      lostReason?: string | null;
    }
  ): Promise<ServiceResult<Deal>> {
    const orgId = session.orgId;
    if (!orgId) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'No organization context found.' } };
    }

    if (!canUserWrite(session)) {
      return { success: false, error: { code: 'FORBIDDEN', message: 'Viewers cannot move deals.' } };
    }

    // 1. Get current deal with lock-like fetch
    const current = await dealRepo.getDeal(orgId, dealId);
    if (!current) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Deal not found.' } };
    }

    // Concurrency version check
    if (opts.expectedVersion !== undefined && current.version !== opts.expectedVersion) {
      return {
        success: false,
        error: {
          code: 'VERSION_CONFLICT',
          message: `Deal was moved or updated by another user (v${current.version}).`,
          currentDeal: current,
        },
      };
    }

    // 2. Target Stage verification
    const toStage = await pipelineRepo.getStage(orgId, opts.toStageId);
    if (!toStage || toStage.pipeline_id !== current.pipeline_id) {
      return {
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Destination stage is invalid or belongs to another pipeline.' },
      };
    }

    const fromStage = await pipelineRepo.getStage(orgId, current.stage_id);

    // 3. WIP limit check if moving to different stage
    const isStageChange = current.stage_id !== opts.toStageId;
    if (isStageChange && toStage.wip_limit && toStage.wip_limit > 0 && !canUserManage(session)) {
      const countRes = await query<{ count: string }>(
        `SELECT COUNT(*) as count FROM public.deals WHERE org_id = $1 AND stage_id = $2 AND status = 'open'`,
        [orgId, toStage.id]
      );
      const currentCount = parseInt(countRes.rows?.[0]?.count || '0', 10);
      if (currentCount >= toStage.wip_limit) {
        return {
          success: false,
          error: {
            code: 'WIP_LIMIT',
            message: `Stage "${toStage.name}" has reached its WIP limit of ${toStage.wip_limit}.`,
            stageName: toStage.name,
            limit: toStage.wip_limit,
          },
        };
      }
    }

    // 4. Lost reason validation
    if (toStage.is_lost && !opts.lostReason && !current.lost_reason) {
      return {
        success: false,
        error: {
          code: 'LOST_REASON_REQUIRED',
          message: 'A reason is required when moving a deal to a Lost stage.',
        },
      };
    }

    // 5. Calculate new position from beforeId / afterId
    let beforePos: number | null = null;
    let afterPos: number | null = null;

    if (opts.beforeId) {
      const bDeal = await dealRepo.getDeal(orgId, opts.beforeId);
      if (bDeal) beforePos = bDeal.position;
    }
    if (opts.afterId) {
      const aDeal = await dealRepo.getDeal(orgId, opts.afterId);
      if (aDeal) afterPos = aDeal.position;
    }

    const newPosition = positionBetween(beforePos, afterPos);

    // 6. Check if destination column needs rebalancing
    if (needsRebalance(beforePos, afterPos)) {
      await dealRepo.rebalanceStageDeals(orgId, opts.toStageId);
    }

    // 7. Status transitions
    let newStatus: 'open' | 'won' | 'lost' | 'archived' = 'open';
    let closedAt: string | null = null;
    let lostReason: string | null = null;

    if (toStage.is_won) {
      newStatus = 'won';
      closedAt = new Date().toISOString();
    } else if (toStage.is_lost) {
      newStatus = 'lost';
      closedAt = new Date().toISOString();
      lostReason = opts.lostReason || current.lost_reason || null;
    } else {
      newStatus = 'open';
      closedAt = null;
      lostReason = null;
    }

    const updatePayload: UpdateDealInput = {
      stage_id: opts.toStageId,
      position: newPosition,
      status: newStatus,
      closed_at: closedAt,
      lost_reason: lostReason,
    };

    const updateRes = await dealRepo.updateDeal(orgId, dealId, updatePayload, opts.expectedVersion);
    if (!updateRes.success) {
      return {
        success: false,
        error: {
          code: 'VERSION_CONFLICT',
          message: updateRes.error || 'Concurrent conflict during move.',
          currentDeal: updateRes.current,
        },
      };
    }

    // 8. Log activities
    if (isStageChange) {
      await recordActivity(orgId, dealId, session.userId, 'moved', {
        from_stage_id: current.stage_id,
        from_stage_name: fromStage?.name || 'Previous Stage',
        to_stage_id: toStage.id,
        to_stage_name: toStage.name,
      });

      if (newStatus === 'won' && current.status !== 'won') {
        await recordActivity(orgId, dealId, session.userId, 'won', {
          stage_id: toStage.id,
          stage_name: toStage.name,
          value: current.value,
        });
      } else if (newStatus === 'lost' && current.status !== 'lost') {
        await recordActivity(orgId, dealId, session.userId, 'lost', {
          stage_id: toStage.id,
          stage_name: toStage.name,
          lost_reason: lostReason,
        });
      } else if (newStatus === 'open' && (current.status === 'won' || current.status === 'lost')) {
        await recordActivity(orgId, dealId, session.userId, 'reopened', {
          from_status: current.status,
          to_stage_id: toStage.id,
          to_stage_name: toStage.name,
        });
      }
    }

    const finalDeal = await dealRepo.getDeal(orgId, dealId);
    return { success: true, data: finalDeal || updateRes.data };
  },

  async setDealStatus(
    session: SessionContext,
    dealId: string,
    status: 'open' | 'won' | 'lost',
    lostReason?: string
  ): Promise<ServiceResult<Deal>> {
    const orgId = session.orgId;
    if (!orgId) return { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } };
    if (!canUserWrite(session)) return { success: false, error: { code: 'FORBIDDEN', message: 'Forbidden' } };

    if (status === 'lost' && !lostReason) {
      return { success: false, error: { code: 'LOST_REASON_REQUIRED', message: 'Lost reason required' } };
    }

    return await this.updateDeal(session, dealId, {
      status,
      closed_at: status === 'open' ? null : new Date().toISOString(),
      lost_reason: status === 'lost' ? lostReason : null,
    });
  },

  async archiveDeal(session: SessionContext, dealId: string): Promise<ServiceResult<boolean>> {
    const orgId = session.orgId;
    if (!orgId) return { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } };
    if (!canUserWrite(session)) return { success: false, error: { code: 'FORBIDDEN', message: 'Forbidden' } };

    const deal = await dealRepo.getDeal(orgId, dealId);
    if (!deal) return { success: false, error: { code: 'NOT_FOUND', message: 'Deal not found' } };

    const ok = await dealRepo.archiveDeal(orgId, dealId);
    if (ok) {
      await recordActivity(orgId, dealId, session.userId, 'archived', { title: deal.title });
    }
    return { success: ok };
  },

  async restoreDeal(session: SessionContext, dealId: string): Promise<ServiceResult<boolean>> {
    const orgId = session.orgId;
    if (!orgId) return { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } };
    if (!canUserWrite(session)) return { success: false, error: { code: 'FORBIDDEN', message: 'Forbidden' } };

    const deal = await dealRepo.getDeal(orgId, dealId);
    if (!deal) return { success: false, error: { code: 'NOT_FOUND', message: 'Deal not found' } };

    const ok = await dealRepo.restoreDeal(orgId, dealId);
    if (ok) {
      await recordActivity(orgId, dealId, session.userId, 'restored', { title: deal.title });
    }
    return { success: ok };
  },

  async deleteDeal(session: SessionContext, dealId: string): Promise<ServiceResult<boolean>> {
    const orgId = session.orgId;
    if (!orgId) return { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } };

    if (!canUserManage(session)) {
      return { success: false, error: { code: 'FORBIDDEN', message: 'Only admins or owners may permanently delete deals.' } };
    }

    const deal = await dealRepo.getDeal(orgId, dealId);
    if (!deal) return { success: false, error: { code: 'NOT_FOUND', message: 'Deal not found' } };

    const ok = await dealRepo.deleteDeal(orgId, dealId);
    return { success: ok };
  },

  // ==========================================
  // CHECKLISTS SERVICE
  // ==========================================

  async getChecklists(session: SessionContext, dealId: string): Promise<ServiceResult<DealChecklist[]>> {
    const orgId = session.orgId;
    if (!orgId) return { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } };

    const deal = await dealRepo.getDeal(orgId, dealId);
    if (!deal) return { success: false, error: { code: 'NOT_FOUND', message: 'Deal not found' } };

    const lists = await dealRepo.getDealChecklists(orgId, dealId);
    return { success: true, data: lists };
  },

  async addChecklist(session: SessionContext, dealId: string, title: string): Promise<ServiceResult<DealChecklist>> {
    const orgId = session.orgId;
    if (!orgId) return { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } };
    if (!canUserWrite(session)) return { success: false, error: { code: 'FORBIDDEN', message: 'Forbidden' } };

    const cl = await dealRepo.addChecklist(orgId, dealId, title);
    if (!cl) return { success: false, error: { code: 'NOT_FOUND', message: 'Deal not found' } };

    await recordActivity(orgId, dealId, session.userId, 'checklist_added', { title });
    return { success: true, data: cl };
  },

  async addChecklistItem(
    session: SessionContext,
    dealId: string,
    checklistId: string,
    title: string,
    dueDate?: string | null
  ): Promise<ServiceResult<DealChecklistItem>> {
    const orgId = session.orgId;
    if (!orgId) return { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } };
    if (!canUserWrite(session)) return { success: false, error: { code: 'FORBIDDEN', message: 'Forbidden' } };

    const item = await dealRepo.addChecklistItem(orgId, checklistId, title, dueDate);
    if (!item) return { success: false, error: { code: 'NOT_FOUND', message: 'Checklist not found' } };

    await recordActivity(orgId, dealId, session.userId, 'checklist_item_added', { title });
    return { success: true, data: item };
  },

  async toggleChecklistItem(
    session: SessionContext,
    dealId: string,
    itemId: string,
    isDone: boolean
  ): Promise<ServiceResult<DealChecklistItem>> {
    const orgId = session.orgId;
    if (!orgId) return { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } };
    if (!canUserWrite(session)) return { success: false, error: { code: 'FORBIDDEN', message: 'Forbidden' } };

    const item = await dealRepo.updateChecklistItem(orgId, itemId, { is_done: isDone });
    if (!item) return { success: false, error: { code: 'NOT_FOUND', message: 'Item not found' } };

    await recordActivity(
      orgId,
      dealId,
      session.userId,
      isDone ? 'checklist_item_completed' : 'checklist_item_uncompleted',
      { title: item.title }
    );
    return { success: true, data: item };
  },

  // ==========================================
  // COMMENTS SERVICE
  // ==========================================

  async getComments(session: SessionContext, dealId: string): Promise<ServiceResult<DealComment[]>> {
    const orgId = session.orgId;
    if (!orgId) return { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } };

    const deal = await dealRepo.getDeal(orgId, dealId);
    if (!deal) return { success: false, error: { code: 'NOT_FOUND', message: 'Deal not found' } };

    const comments = await dealRepo.getDealComments(orgId, dealId);
    return { success: true, data: comments };
  },

  async addComment(session: SessionContext, dealId: string, content: string): Promise<ServiceResult<DealComment>> {
    const orgId = session.orgId;
    if (!orgId) return { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } };
    if (!canUserWrite(session)) return { success: false, error: { code: 'FORBIDDEN', message: 'Forbidden' } };

    const comment = await dealRepo.addComment(orgId, dealId, session.userId, content);
    if (!comment) return { success: false, error: { code: 'NOT_FOUND', message: 'Deal not found' } };

    await recordActivity(orgId, dealId, session.userId, 'comment_added', {
      snippet: content.length > 50 ? content.slice(0, 50) + '...' : content,
    });
    return { success: true, data: comment };
  },

  async deleteComment(session: SessionContext, dealId: string, commentId: string): Promise<ServiceResult<boolean>> {
    const orgId = session.orgId;
    if (!orgId) return { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } };

    const isAdmin = canUserManage(session);
    const ok = await dealRepo.deleteComment(orgId, commentId, session.userId, isAdmin);
    if (!ok) {
      return { success: false, error: { code: 'FORBIDDEN', message: 'Not authorized to delete this comment.' } };
    }
    return { success: true, data: true };
  },
};
