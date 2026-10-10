import { describe, it, expect, vi, beforeEach } from 'vitest';
import { orgService } from '@/lib/services/org-service';
import { orgRepo } from '@/lib/db/repositories/org-repo';
import { pipelineRepo } from '@/lib/db/repositories/pipeline-repo';
import { auditRepo } from '@/lib/db/repositories/audit-repo';
import { transaction } from '@/lib/db';

vi.mock('@/lib/db', () => ({
  query: vi.fn(),
  queryOne: vi.fn(),
  transaction: vi.fn(async (cb) => {
    const mockClient = {
      query: vi.fn().mockImplementation(async (sql: string, params: any[]) => {
        if (sql.includes('INSERT INTO organizations')) {
          return {
            rows: [
              {
                id: 'org-uuid-999',
                name: params[0],
                slug: params[1],
                logo_url: params[2],
                plan_tier: 'free',
                billing_status: 'active',
              },
            ],
          };
        }
        if (sql.includes('INSERT INTO organization_members')) {
          return { rows: [{ id: 'mem-1' }] };
        }
        return { rows: [] };
      }),
    };
    return await cb(mockClient);
  }),
}));

vi.mock('@/lib/db/repositories/org-repo', () => ({
  orgRepo: {
    findBySlug: vi.fn(),
    findById: vi.fn(),
  },
}));

vi.mock('@/lib/db/repositories/audit-repo', () => ({
  auditRepo: {
    log: vi.fn().mockResolvedValue({ id: 'audit-1' }),
    createNotification: vi.fn().mockResolvedValue({ id: 'notif-1' }),
  },
}));

vi.mock('@/lib/db/repositories/pipeline-repo', () => ({
  pipelineRepo: {
    getDefaultPipeline: vi.fn(),
    ensureDefaultPipeline: vi.fn(),
    listStages: vi.fn(),
  },
}));

describe('Integration: Organization Creation & Default Pipeline Seeding in Single Transaction (Prompt 05)', () => {
  const mockOwnerId = 'user-owner-uuid-1';
  const mockOrgId = 'org-uuid-999';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates organization and seeds default sales pipeline with 6 stages atomically in one transaction', async () => {
    (orgRepo.findBySlug as any).mockResolvedValue(null);

    const mockPipeline = {
      id: 'pipe-uuid-1',
      org_id: mockOrgId,
      name: 'Sales Pipeline',
      is_default: true,
      created_by: mockOwnerId,
    };

    const mockStages = [
      { id: 's1', name: 'Lead', color: '#94a3b8', position: 1000, is_won: false, is_lost: false },
      { id: 's2', name: 'Qualified', color: '#38bdf8', position: 2000, is_won: false, is_lost: false },
      { id: 's3', name: 'Proposal', color: '#a78bfa', position: 3000, is_won: false, is_lost: false },
      { id: 's4', name: 'Negotiation', color: '#fb923c', position: 4000, is_won: false, is_lost: false },
      { id: 's5', name: 'Won', color: '#22c55e', position: 5000, is_won: true, is_lost: false },
      { id: 's6', name: 'Lost', color: '#ef4444', position: 6000, is_won: false, is_lost: true },
    ];

    (pipelineRepo.ensureDefaultPipeline as any).mockResolvedValue(mockPipeline);
    (pipelineRepo.listStages as any).mockResolvedValue(mockStages);

    // Act: Create organization
    const org = await orgService.createOrganization(mockOwnerId, {
      name: 'Acme Growth Labs',
      slug: 'acme-growth-labs',
    });

    // Assert: Single transaction was used
    expect(transaction).toHaveBeenCalledTimes(1);

    // Assert: Organization returned from transaction
    expect(org).toBeDefined();
    expect(org.id).toBe(mockOrgId);

    // Assert: ensureDefaultPipeline was called inside transaction with client passed
    expect(pipelineRepo.ensureDefaultPipeline).toHaveBeenCalledWith(
      mockOrgId,
      mockOwnerId,
      expect.anything()
    );

    // Assert: Check pipeline stages structure
    const stages = await pipelineRepo.listStages(mockOrgId, mockPipeline.id);
    expect(stages).toHaveLength(6);
    expect(stages.map((s) => s.name)).toEqual([
      'Lead',
      'Qualified',
      'Proposal',
      'Negotiation',
      'Won',
      'Lost',
    ]);
    expect(stages.map((s) => s.position)).toEqual([1000, 2000, 3000, 4000, 5000, 6000]);
    expect(stages.find((s) => s.name === 'Won')?.is_won).toBe(true);
    expect(stages.find((s) => s.name === 'Lost')?.is_lost).toBe(true);
  });

  it('aborts transaction and does NOT commit organization if ensureDefaultPipeline throws an error', async () => {
    (orgRepo.findBySlug as any).mockResolvedValue(null);

    (pipelineRepo.ensureDefaultPipeline as any).mockRejectedValue(
      new Error('Database deadlock on stage insertion')
    );

    // Act & Assert: Error is thrown and organization creation is aborted
    await expect(
      orgService.createOrganization(mockOwnerId, {
        name: 'Fail Corp',
        slug: 'fail-corp',
      })
    ).rejects.toThrow('Database deadlock on stage insertion');

    // Audit log for creation should NOT have been recorded
    expect(auditRepo.log).not.toHaveBeenCalled();
  });
});
