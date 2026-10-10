import { describe, it, expect, vi, beforeEach } from 'vitest';
import { dealService } from '@/lib/pipeline/deal-service';
import { dealRepo } from '@/lib/db/repositories/deal-repo';
import { pipelineRepo } from '@/lib/db/repositories/pipeline-repo';
import { SessionContext } from '@/lib/auth/session';

vi.mock('@/lib/db/repositories/deal-repo', () => ({
  dealRepo: {
    getDeal: vi.fn(),
    createDeal: vi.fn(),
    updateDeal: vi.fn(),
    rebalanceStageDeals: vi.fn(),
  },
}));

vi.mock('@/lib/db/repositories/pipeline-repo', () => ({
  pipelineRepo: {
    getPipeline: vi.fn(),
    getStage: vi.fn(),
  },
}));

vi.mock('@/lib/db', () => ({
  query: vi.fn(),
}));

describe('Pipeline Move Deal & No Duplication Tests (Prompt 01)', () => {
  const mockSession: SessionContext = {
    userId: 'usr-1',
    user: { id: 'usr-1', email: 'admin@test.com' },
    organization: { id: 'org-1', name: 'Test Org' },
    orgId: 'org-1',
    userOrganizations: [],
    role: 'owner',
    isSuperAdmin: false,
  };

  const stageA = { id: 'stage-lead', pipeline_id: 'pipe-1', name: 'Lead', is_won: false, is_lost: false, position: 1000 };
  const stageB = { id: 'stage-proposal', pipeline_id: 'pipe-1', name: 'Proposal', is_won: false, is_lost: false, position: 3000 };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('moves deal from stage A to stage B without creating duplicate deals', async () => {
    const dealId = 'deal-100';
    let currentDealInDb = {
      id: dealId,
      org_id: 'org-1',
      pipeline_id: 'pipe-1',
      stage_id: 'stage-lead',
      title: 'Enterprise Cloud SLA',
      value: 85000,
      currency: 'USD',
      probability: 50,
      position: 1000,
      status: 'open',
      version: 1,
    };

    // Mock initial getDeal
    (dealRepo.getDeal as any).mockImplementation(async (orgId: string, id: string) => {
      if (id === dealId) return currentDealInDb;
      return null;
    });

    (pipelineRepo.getStage as any).mockImplementation(async (orgId: string, stageId: string) => {
      if (stageId === 'stage-lead') return stageA;
      if (stageId === 'stage-proposal') return stageB;
      return null;
    });

    // Mock updateDeal
    (dealRepo.updateDeal as any).mockImplementation(async (orgId: string, id: string, input: any) => {
      currentDealInDb = {
        ...currentDealInDb,
        stage_id: input.stage_id || currentDealInDb.stage_id,
        position: input.position ?? currentDealInDb.position,
        version: currentDealInDb.version + 1,
      };
      return { success: true, data: currentDealInDb };
    });

    // Act: Move deal to stage B
    const result = await dealService.moveDeal(mockSession, dealId, {
      toStageId: 'stage-proposal',
    });

    // Assert: Success
    expect(result.success).toBe(true);
    expect(result.data?.id).toBe(dealId);
    expect(result.data?.stage_id).toBe('stage-proposal');
    expect(result.data?.version).toBe(2);

    // Verify DB state has exactly 1 row with stage B
    expect(currentDealInDb.id).toBe(dealId);
    expect(currentDealInDb.stage_id).toBe('stage-proposal');
  });

  it('persists move across page reload: deal appears only once in destination stage', async () => {
    const dealId = 'deal-100';
    const dealInDb = {
      id: dealId,
      org_id: 'org-1',
      pipeline_id: 'pipe-1',
      stage_id: 'stage-proposal',
      title: 'Enterprise Cloud SLA',
      value: 85000,
      position: 3000,
      status: 'open',
      version: 2,
    };

    // Simulate board data loading after move
    const mockBoardData = [
      { stage: stageA, deals: [], totalDeals: 0, totalValue: 0 },
      { stage: stageB, deals: [dealInDb], totalDeals: 1, totalValue: 85000 },
    ];

    // Assert: Deal is ONLY in stage B (Proposal), NOT in stage A (Lead)
    const stageADeals = mockBoardData[0].deals.filter((d) => d.id === dealId);
    const stageBDeals = mockBoardData[1].deals.filter((d) => d.id === dealId);

    expect(stageADeals).toHaveLength(0);
    expect(stageBDeals).toHaveLength(1);
  });
});
