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
  },
}));

vi.mock('@/lib/db', () => ({
  query: vi.fn(),
  transaction: vi.fn(),
}));

describe('Editable Columns Tests (Prompt 02)', () => {
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
    { id: 'stage-1', pipeline_id: 'pipe-1', org_id: 'org-1', name: 'Lead In', position: 1000, is_won: false, is_lost: false },
    { id: 'stage-2', pipeline_id: 'pipe-1', org_id: 'org-1', name: 'Contact Made', position: 2000, is_won: false, is_lost: false },
    { id: 'stage-3', pipeline_id: 'pipe-1', org_id: 'org-1', name: 'Closed Won', position: 3000, is_won: true, is_lost: false },
    { id: 'stage-4', pipeline_id: 'pipe-1', org_id: 'org-1', name: 'Closed Lost', position: 4000, is_won: false, is_lost: true },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Inline Rename Column', () => {
    it('renames a column and persists changes', async () => {
      (pipelineRepo.getStage as any).mockResolvedValue(initialStages[0]);
      (pipelineRepo.updateStage as any).mockImplementation(async (orgId: string, stageId: string, input: any) => ({
        ...initialStages[0],
        name: input.name,
      }));

      const res = await pipelineService.updateStage(adminSession, 'pipe-1', 'stage-1', {
        name: 'New Leads 2026',
      });

      expect(res.success).toBe(true);
      expect(res.data?.name).toBe('New Leads 2026');
      expect(pipelineRepo.updateStage).toHaveBeenCalledWith('org-1', 'stage-1', {
        name: 'New Leads 2026',
      });
    });

    it('rejects empty or whitespace-only stage names', async () => {
      (pipelineRepo.getStage as any).mockResolvedValue(initialStages[0]);

      const res = await pipelineService.updateStage(adminSession, 'pipe-1', 'stage-1', {
        name: '   ',
      });

      expect(res.success).toBe(false);
      expect(res.error?.code).toBe('BAD_REQUEST');
      expect(res.error?.message).toMatch(/cannot be empty/i);
    });

    it('rejects stage names exceeding 50 characters', async () => {
      (pipelineRepo.getStage as any).mockResolvedValue(initialStages[0]);

      const res = await pipelineService.updateStage(adminSession, 'pipe-1', 'stage-1', {
        name: 'A'.repeat(51),
      });

      expect(res.success).toBe(false);
      expect(res.error?.code).toBe('BAD_REQUEST');
      expect(res.error?.message).toMatch(/50 characters/i);
    });
  });

  describe('2. Add Column (+ Add another list)', () => {
    it('creates a new stage at the end of the board', async () => {
      (pipelineRepo.getPipeline as any).mockResolvedValue({ id: 'pipe-1', org_id: 'org-1' });
      (pipelineRepo.createStage as any).mockImplementation(async (orgId: string, pipeId: string, input: any) => ({
        id: 'stage-new',
        org_id: orgId,
        pipeline_id: pipeId,
        name: input.name,
        position: 5000,
        is_won: false,
        is_lost: false,
      }));

      const res = await pipelineService.createStage(adminSession, 'pipe-1', {
        name: 'Follow Up Needed',
      });

      expect(res.success).toBe(true);
      expect(res.data?.name).toBe('Follow Up Needed');
      expect(res.data?.position).toBe(5000);
    });

    it('rejects adding a stage with empty name or exceeding 50 chars', async () => {
      (pipelineRepo.getPipeline as any).mockResolvedValue({ id: 'pipe-1', org_id: 'org-1' });

      const resEmpty = await pipelineService.createStage(adminSession, 'pipe-1', { name: '' });
      expect(resEmpty.success).toBe(false);
      expect(resEmpty.error?.code).toBe('BAD_REQUEST');

      const resLong = await pipelineService.createStage(adminSession, 'pipe-1', { name: 'X'.repeat(51) });
      expect(resLong.success).toBe(false);
      expect(resLong.error?.code).toBe('BAD_REQUEST');
    });
  });

  describe('3. Delete Column & Reassign Deals', () => {
    it('deletes column and moves deals to target column', async () => {
      (pipelineRepo.listStages as any).mockResolvedValue(initialStages);
      (pipelineRepo.deleteStage as any).mockResolvedValue({ success: true });

      const res = await pipelineService.deleteStage(adminSession, 'pipe-1', 'stage-1', 'stage-2');

      expect(res.success).toBe(true);
      expect(pipelineRepo.deleteStage).toHaveBeenCalledWith('org-1', 'stage-1', 'stage-2');
    });

    it('refuses deleting the last remaining column', async () => {
      (pipelineRepo.listStages as any).mockResolvedValue([initialStages[0]]);

      const res = await pipelineService.deleteStage(adminSession, 'pipe-1', 'stage-1', 'stage-2');

      expect(res.success).toBe(false);
      expect(res.error?.code).toBe('BAD_REQUEST');
      expect(res.error?.message).toMatch(/last remaining/i);
    });

    it('refuses deleting Won or Lost columns', async () => {
      (pipelineRepo.listStages as any).mockResolvedValue(initialStages);

      // Attempt to delete Closed Won
      const resWon = await pipelineService.deleteStage(adminSession, 'pipe-1', 'stage-3', 'stage-1');
      expect(resWon.success).toBe(false);
      expect(resWon.error?.code).toBe('BAD_REQUEST');
      expect(resWon.error?.message).toMatch(/won or lost/i);

      // Attempt to delete Closed Lost
      const resLost = await pipelineService.deleteStage(adminSession, 'pipe-1', 'stage-4', 'stage-1');
      expect(resLost.success).toBe(false);
      expect(resLost.error?.code).toBe('BAD_REQUEST');
      expect(resLost.error?.message).toMatch(/won or lost/i);
    });
  });

  describe('4. Role & Permissions', () => {
    it('disallows non-admin members from creating, updating, or deleting columns', async () => {
      const createRes = await pipelineService.createStage(memberSession, 'pipe-1', { name: 'Test' });
      expect(createRes.success).toBe(false);
      expect(createRes.error?.code).toBe('FORBIDDEN');

      const updateRes = await pipelineService.updateStage(memberSession, 'pipe-1', 'stage-1', { name: 'Test' });
      expect(updateRes.success).toBe(false);
      expect(updateRes.error?.code).toBe('FORBIDDEN');

      const deleteRes = await pipelineService.deleteStage(memberSession, 'pipe-1', 'stage-1', 'stage-2');
      expect(deleteRes.success).toBe(false);
      expect(deleteRes.error?.code).toBe('FORBIDDEN');
    });
  });
});
