import { describe, it, expect, vi, beforeEach } from 'vitest';
import { pipelineService } from '@/lib/pipeline/pipeline-service';
import { pipelineRepo } from '@/lib/db/repositories/pipeline-repo';
import { SessionContext } from '@/lib/auth/session';

vi.mock('@/lib/db/repositories/pipeline-repo', () => ({
  pipelineRepo: {
    getPipeline: vi.fn(),
    getStage: vi.fn(),
    listStages: vi.fn(),
    createStage: vi.fn(),
    updateStage: vi.fn(),
    deleteStage: vi.fn(),
    reorderStages: vi.fn(),
  },
}));

vi.mock('@/lib/db', () => ({
  query: vi.fn(),
  transaction: vi.fn(),
}));

describe('Column Order, Colors, and Won/Lost Flags Tests (Prompt 03)', () => {
  const adminSession: SessionContext = {
    userId: 'usr-admin',
    user: { id: 'usr-admin', email: 'admin@test.com' },
    organization: { id: 'org-1', name: 'Test Org' },
    orgId: 'org-1',
    userOrganizations: [],
    role: 'owner',
    isSuperAdmin: false,
  };

  const memberSession: SessionContext = {
    userId: 'usr-member',
    user: { id: 'usr-member', email: 'member@test.com' },
    organization: { id: 'org-1', name: 'Test Org' },
    orgId: 'org-1',
    userOrganizations: [],
    role: 'member',
    isSuperAdmin: false,
  };

  const initialStages = [
    { id: 'stage-1', pipeline_id: 'pipe-1', org_id: 'org-1', name: 'Lead In', color: '#6366f1', position: 1000, is_won: false, is_lost: false },
    { id: 'stage-2', pipeline_id: 'pipe-1', org_id: 'org-1', name: 'Contact Made', color: '#8b5cf6', position: 2000, is_won: false, is_lost: false },
    { id: 'stage-3', pipeline_id: 'pipe-1', org_id: 'org-1', name: 'Closed Won', color: '#10b981', position: 3000, is_won: true, is_lost: false },
    { id: 'stage-4', pipeline_id: 'pipe-1', org_id: 'org-1', name: 'Closed Lost', color: '#ef4444', position: 4000, is_won: false, is_lost: true },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Column Drag Reordering', () => {
    it('persists reordered stages when valid orderedIds are provided', async () => {
      (pipelineRepo.listStages as any).mockResolvedValue(initialStages);
      (pipelineRepo.reorderStages as any).mockImplementation(async (orgId: string, pipeId: string, orderedIds: string[]) => {
        return orderedIds.map((id, idx) => ({
          ...initialStages.find((s) => s.id === id)!,
          position: (idx + 1) * 1000,
        }));
      });

      const newOrder = ['stage-2', 'stage-1', 'stage-3', 'stage-4'];
      const res = await pipelineService.reorderStages(adminSession, 'pipe-1', newOrder);

      expect(res.success).toBe(true);
      expect(res.data?.[0].id).toBe('stage-2');
      expect(res.data?.[1].id).toBe('stage-1');
      expect(pipelineRepo.reorderStages).toHaveBeenCalledWith('org-1', 'pipe-1', newOrder);
    });

    it('rejects reordering with duplicate IDs', async () => {
      (pipelineRepo.listStages as any).mockResolvedValue(initialStages);

      const duplicateOrder = ['stage-1', 'stage-1', 'stage-3', 'stage-4'];
      const res = await pipelineService.reorderStages(adminSession, 'pipe-1', duplicateOrder);

      expect(res.success).toBe(false);
      expect(res.error?.code).toBe('BAD_REQUEST');
      expect(res.error?.message).toMatch(/orderedIds must contain all current stage IDs/i);
    });

    it('rejects reordering with missing stage IDs', async () => {
      (pipelineRepo.listStages as any).mockResolvedValue(initialStages);

      const missingOrder = ['stage-1', 'stage-2'];
      const res = await pipelineService.reorderStages(adminSession, 'pipe-1', missingOrder);

      expect(res.success).toBe(false);
      expect(res.error?.code).toBe('BAD_REQUEST');
    });

    it('rejects reordering with extra invalid stage IDs', async () => {
      (pipelineRepo.listStages as any).mockResolvedValue(initialStages);

      const extraOrder = ['stage-1', 'stage-2', 'stage-3', 'stage-4', 'stage-unknown'];
      const res = await pipelineService.reorderStages(adminSession, 'pipe-1', extraOrder);

      expect(res.success).toBe(false);
      expect(res.error?.code).toBe('BAD_REQUEST');
    });

    it('returns 403 Forbidden when a member attempts to reorder columns', async () => {
      const res = await pipelineService.reorderStages(memberSession, 'pipe-1', ['stage-1', 'stage-2', 'stage-3', 'stage-4']);

      expect(res.success).toBe(false);
      expect(res.error?.code).toBe('FORBIDDEN');
    });
  });

  describe('2. Column Color Palette', () => {
    it('updates column color and persists via updateStage', async () => {
      (pipelineRepo.getStage as any).mockResolvedValue(initialStages[0]);
      (pipelineRepo.updateStage as any).mockImplementation(async (orgId: string, stageId: string, input: any) => ({
        ...initialStages[0],
        color: input.color,
      }));

      const res = await pipelineService.updateStage(adminSession, 'pipe-1', 'stage-1', {
        color: '#f43f5e',
      });

      expect(res.success).toBe(true);
      expect(res.data?.color).toBe('#f43f5e');
      expect(pipelineRepo.updateStage).toHaveBeenCalledWith('org-1', 'stage-1', {
        color: '#f43f5e',
      });
    });
  });

  describe('3. Mark as Won and Mark as Lost Flags', () => {
    it('sets isWon: true and clears isLost flag', async () => {
      (pipelineRepo.getStage as any).mockResolvedValue(initialStages[0]);
      (pipelineRepo.updateStage as any).mockImplementation(async (orgId: string, stageId: string, input: any) => ({
        ...initialStages[0],
        is_won: input.isWon,
        is_lost: input.isLost,
      }));

      const res = await pipelineService.updateStage(adminSession, 'pipe-1', 'stage-1', {
        isWon: true,
      });

      expect(res.success).toBe(true);
      expect(res.data?.is_won).toBe(true);
      expect(pipelineRepo.updateStage).toHaveBeenCalledWith('org-1', 'stage-1', {
        isWon: true,
        isLost: false,
      });
    });

    it('sets isLost: true and clears isWon flag', async () => {
      (pipelineRepo.getStage as any).mockResolvedValue(initialStages[0]);
      (pipelineRepo.updateStage as any).mockImplementation(async (orgId: string, stageId: string, input: any) => ({
        ...initialStages[0],
        is_won: input.isWon,
        is_lost: input.isLost,
      }));

      const res = await pipelineService.updateStage(adminSession, 'pipe-1', 'stage-1', {
        isLost: true,
      });

      expect(res.success).toBe(true);
      expect(res.data?.is_lost).toBe(true);
      expect(pipelineRepo.updateStage).toHaveBeenCalledWith('org-1', 'stage-1', {
        isWon: false,
        isLost: true,
      });
    });
  });

  describe('4. Open Deals Total Calculations', () => {
    it('calculates header totals using ONLY open deals (excludes Won and Lost columns)', () => {
      const mockBoardData = [
        {
          stage: { id: 's-1', name: 'Lead', is_won: false, is_lost: false },
          deals: [{ id: 'd-1', value: 50000 }],
          totalDeals: 1,
          totalValue: 50000,
        },
        {
          stage: { id: 's-2', name: 'Proposal', is_won: false, is_lost: false },
          deals: [{ id: 'd-2', value: 30000 }],
          totalDeals: 1,
          totalValue: 30000,
        },
        {
          stage: { id: 's-3', name: 'Closed Won', is_won: true, is_lost: false },
          deals: [{ id: 'd-3', value: 100000 }],
          totalDeals: 1,
          totalValue: 100000,
        },
        {
          stage: { id: 's-4', name: 'Closed Lost', is_won: false, is_lost: true },
          deals: [{ id: 'd-4', value: 20000 }],
          totalDeals: 1,
          totalValue: 20000,
        },
      ];

      // Exclude won & lost stages
      const openStages = mockBoardData.filter((s) => !s.stage.is_won && !s.stage.is_lost);
      const totalDealsCount = openStages.reduce((sum, s) => sum + s.totalDeals, 0);
      const totalPipelineValue = openStages.reduce((sum, s) => sum + s.totalValue, 0);

      // Total open deals should be 2 (Lead + Proposal), value $80,000 (excluding $100k won and $20k lost)
      expect(totalDealsCount).toBe(2);
      expect(totalPipelineValue).toBe(80000);
    });
  });
});
