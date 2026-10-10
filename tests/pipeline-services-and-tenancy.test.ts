import { describe, it, expect, vi, beforeEach } from 'vitest';
import { dealService } from '@/lib/pipeline/deal-service';
import { pipelineService } from '@/lib/pipeline/pipeline-service';
import { SessionContext } from '@/lib/auth/session';
import { dealRepo } from '@/lib/db/repositories/deal-repo';
import { pipelineRepo } from '@/lib/db/repositories/pipeline-repo';

// Mock DB queries for isolated unit testing of business rules
vi.mock('@/lib/db', () => ({
  query: vi.fn(),
  transaction: vi.fn(async (cb) => {
    const mockClient = {
      query: vi.fn().mockImplementation(async (sql: string, params: any[]) => {
        if (sql.includes('SELECT * FROM public.deals WHERE org_id = $1 AND id = $2 FOR UPDATE')) {
          return {
            rows: [
              {
                id: params[1],
                org_id: params[0],
                pipeline_id: 'pipe-1',
                stage_id: 'stage-1',
                title: 'Existing Deal',
                value: 5000,
                version: 2,
                status: 'open',
              },
            ],
          };
        }
        if (sql.includes('UPDATE public.deals SET')) {
          return {
            rows: [
              {
                id: params[1],
                org_id: params[0],
                title: 'Updated Deal',
                version: 3,
                status: 'open',
              },
            ],
          };
        }
        return { rows: [] };
      }),
    };
    return cb(mockClient);
  }),
}));

describe('Pipeline & Deal Service Layer with Tenant Isolation & Role Policies', () => {
  const orgA_Admin: SessionContext = {
    userId: 'user-admin-a',
    user: { id: 'user-admin-a', email: 'admin@orga.com' },
    organization: { id: 'org-a', name: 'Org A', slug: 'org-a', plan_tier: 'enterprise' },
    orgId: 'org-a',
    userOrganizations: [],
    role: 'admin',
    isSuperAdmin: false,
  };

  const orgA_Member: SessionContext = {
    userId: 'user-member-a',
    user: { id: 'user-member-a', email: 'member@orga.com' },
    organization: { id: 'org-a', name: 'Org A', slug: 'org-a', plan_tier: 'enterprise' },
    orgId: 'org-a',
    userOrganizations: [],
    role: 'member',
    isSuperAdmin: false,
  };

  const orgA_Viewer: SessionContext = {
    userId: 'user-viewer-a',
    user: { id: 'user-viewer-a', email: 'viewer@orga.com' },
    organization: { id: 'org-a', name: 'Org A', slug: 'org-a', plan_tier: 'enterprise' },
    orgId: 'org-a',
    userOrganizations: [],
    role: 'viewer',
    isSuperAdmin: false,
  };

  const orgB_Admin: SessionContext = {
    userId: 'user-admin-b',
    user: { id: 'user-admin-b', email: 'admin@orgb.com' },
    organization: { id: 'org-b', name: 'Org B', slug: 'org-b', plan_tier: 'pro' },
    orgId: 'org-b',
    userOrganizations: [],
    role: 'admin',
    isSuperAdmin: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Optimistic Concurrency Control (Prompt 07 & 10)', () => {
    it('detects version conflicts and returns 409 conflict error when expectedVersion does not match', async () => {
      vi.spyOn(dealRepo, 'getDeal').mockResolvedValue({
        id: 'deal-1',
        org_id: 'org-a',
        pipeline_id: 'pipe-1',
        stage_id: 'stage-1',
        title: 'Concurrent Deal',
        value: 10000,
        currency: 'USD',
        probability: 50,
        position: 1000,
        status: 'open',
        version: 5, // current is v5
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      // User submits update expecting v4
      const res = await dealService.moveDeal(orgA_Member, 'deal-1', {
        toStageId: 'stage-2',
        expectedVersion: 4,
      });

      expect(res.success).toBe(false);
      expect(res.error?.code).toBe('VERSION_CONFLICT');
      expect(res.error?.currentDeal?.version).toBe(5);
    });
  });

  describe('Role Permissions & WIP Limits (Prompt 10, 14, 16)', () => {
    it('rejects deal creation by viewers with FORBIDDEN (403)', async () => {
      const res = await dealService.createDeal(orgA_Viewer, {
        pipeline_id: 'pipe-1',
        stage_id: 'stage-1',
        title: 'Unauthorized Deal',
      });

      expect(res.success).toBe(false);
      expect(res.error?.code).toBe('FORBIDDEN');
    });

    it('rejects deal deletion by members with FORBIDDEN (403)', async () => {
      const res = await dealService.deleteDeal(orgA_Member, 'deal-1');

      expect(res.success).toBe(false);
      expect(res.error?.code).toBe('FORBIDDEN');
    });

    it('allows deal deletion by admins', async () => {
      vi.spyOn(dealRepo, 'getDeal').mockResolvedValue({
        id: 'deal-1',
        org_id: 'org-a',
        pipeline_id: 'pipe-1',
        stage_id: 'stage-1',
        title: 'Deal to Delete',
        value: 1000,
        currency: 'USD',
        probability: 50,
        position: 1000,
        status: 'open',
        version: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      vi.spyOn(dealRepo, 'deleteDeal').mockResolvedValue(true);

      const res = await dealService.deleteDeal(orgA_Admin, 'deal-1');
      expect(res.success).toBe(true);
    });

    it('blocks members from moving into a stage that reached WIP limit (422 WIP_LIMIT)', async () => {
      vi.spyOn(dealRepo, 'getDeal').mockResolvedValue({
        id: 'deal-1',
        org_id: 'org-a',
        pipeline_id: 'pipe-1',
        stage_id: 'stage-1',
        title: 'Deal 1',
        value: 1000,
        currency: 'USD',
        probability: 50,
        position: 1000,
        status: 'open',
        version: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      vi.spyOn(pipelineRepo, 'getStage').mockImplementation(async (orgId, stageId) => {
        if (stageId === 'stage-2') {
          return {
            id: 'stage-2',
            org_id: 'org-a',
            pipeline_id: 'pipe-1',
            name: 'WIP Full Column',
            color: '#38bdf8',
            position: 2000,
            is_won: false,
            is_lost: false,
            wip_limit: 3,
            created_at: '',
            updated_at: '',
          };
        }
        return null;
      });

      const dbModule = await import('@/lib/db');
      vi.spyOn(dbModule, 'query').mockResolvedValue({
        rows: [{ count: '3' }],
        rowCount: 1,
        command: '',
        oid: 0,
        fields: [],
      } as any);

      const res = await dealService.moveDeal(orgA_Member, 'deal-1', {
        toStageId: 'stage-2',
      });

      expect(res.success).toBe(false);
      expect(res.error?.code).toBe('WIP_LIMIT');
      expect(res.error?.limit).toBe(3);
    });
  });

  describe('Stage Reorder Atomicity & Validation (Prompt 11 & 15)', () => {
    it('rejects stage reordering by members with FORBIDDEN', async () => {
      const res = await pipelineService.reorderStages(orgA_Member, 'pipe-1', ['s1', 's2']);
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe('FORBIDDEN');
    });

    it('rejects reordering when missing IDs or duplicate IDs are provided', async () => {
      vi.spyOn(pipelineRepo, 'listStages').mockResolvedValue([
        { id: 's1', org_id: 'org-a', pipeline_id: 'pipe-1', name: 'S1', color: '', position: 1000, is_won: false, is_lost: false, wip_limit: null, created_at: '', updated_at: '' },
        { id: 's2', org_id: 'org-a', pipeline_id: 'pipe-1', name: 'S2', color: '', position: 2000, is_won: false, is_lost: false, wip_limit: null, created_at: '', updated_at: '' },
        { id: 's3', org_id: 'org-a', pipeline_id: 'pipe-1', name: 'S3', color: '', position: 3000, is_won: false, is_lost: false, wip_limit: null, created_at: '', updated_at: '' },
      ]);

      // Missing s3
      const missingRes = await pipelineService.reorderStages(orgA_Admin, 'pipe-1', ['s1', 's2']);
      expect(missingRes.success).toBe(false);
      expect(missingRes.error?.code).toBe('BAD_REQUEST');

      // Duplicate s1
      const dupRes = await pipelineService.reorderStages(orgA_Admin, 'pipe-1', ['s1', 's1', 's2']);
      expect(dupRes.success).toBe(false);
      expect(dupRes.error?.code).toBe('BAD_REQUEST');
    });

    it('successfully reorders stages when exact matching list is provided by admin', async () => {
      vi.spyOn(pipelineRepo, 'listStages').mockResolvedValue([
        { id: 's1', org_id: 'org-a', pipeline_id: 'pipe-1', name: 'S1', color: '', position: 1000, is_won: false, is_lost: false, wip_limit: null, created_at: '', updated_at: '' },
        { id: 's2', org_id: 'org-a', pipeline_id: 'pipe-1', name: 'S2', color: '', position: 2000, is_won: false, is_lost: false, wip_limit: null, created_at: '', updated_at: '' },
      ]);

      vi.spyOn(pipelineRepo, 'reorderStages').mockResolvedValue([
        { id: 's2', org_id: 'org-a', pipeline_id: 'pipe-1', name: 'S2', color: '', position: 1000, is_won: false, is_lost: false, wip_limit: null, created_at: '', updated_at: '' },
        { id: 's1', org_id: 'org-a', pipeline_id: 'pipe-1', name: 'S1', color: '', position: 2000, is_won: false, is_lost: false, wip_limit: null, created_at: '', updated_at: '' },
      ]);

      const res = await pipelineService.reorderStages(orgA_Admin, 'pipe-1', ['s2', 's1']);
      expect(res.success).toBe(true);
      expect(res.data?.[0].id).toBe('s2');
    });
  });

  describe('Cross-Tenant Isolation (Prompt 16)', () => {
    it('returns NOT_FOUND (404) when Org B attempts to access Org A pipeline without revealing existence', async () => {
      vi.spyOn(pipelineRepo, 'getPipeline').mockResolvedValue(null); // Repo includes org_id = $1 so cross-org returns null

      const res = await pipelineService.getPipeline(orgB_Admin, 'pipe-org-a');
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe('NOT_FOUND');
    });

    it('returns NOT_FOUND (404) when Org B attempts to move or edit Org A deal', async () => {
      vi.spyOn(dealRepo, 'getDeal').mockResolvedValue(null);

      const res = await dealService.moveDeal(orgB_Admin, 'deal-org-a', {
        toStageId: 'stage-1',
      });
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe('NOT_FOUND');
    });
  });
});
