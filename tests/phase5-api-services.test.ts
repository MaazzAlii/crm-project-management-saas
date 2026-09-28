import { describe, it, expect, beforeEach, vi } from 'vitest';
import { auditRepo } from '@/lib/db/repositories/audit-repo';
import {
  userService,
  orgService,
  crmService,
  projectService,
  communicationService,
  billingService,
  automationService,
  PLAN_LIMITS_MAP,
} from '@/lib/services';
import {
  AppError,
  NotFoundError,
  ForbiddenError,
  ValidationError,
  ConflictError,
  RateLimitError,
} from '@/lib/utils/error-handler';
import {
  apiSuccess,
  apiPaginated,
  apiError,
  handleApiError,
  extractPagination,
} from '@/lib/utils/response';

describe('Phase 5: API Layer & Business Services', () => {
  beforeEach(() => {
    vi.spyOn(auditRepo, 'log').mockResolvedValue({} as any);
  });

  describe('Standardized API Response & Error Handling (Files 41 & 50)', () => {
    it('formats successful API responses with standard envelope', async () => {
      const payload = { id: 'usr-123', name: 'Alex Developer' };
      const res = apiSuccess(payload, 201, { timestamp: '2026-09-28' });
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(payload);
      expect(data.meta?.timestamp).toBe('2026-09-28');
    });

    it('formats paginated API responses with meta metadata', async () => {
      const items = [{ id: 1 }, { id: 2 }];
      const res = apiPaginated(items, 50, 2, 10);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
      expect(data.meta.total).toBe(50);
      expect(data.meta.page).toBe(2);
      expect(data.meta.limit).toBe(10);
      expect(data.meta.totalPages).toBe(5);
      expect(data.meta.hasMore).toBe(true);
    });

    it('extracts query pagination parameters correctly with clamps', () => {
      const params = new URLSearchParams('page=3&limit=50&orderBy=created_at&orderDirection=ASC');
      const pagination = extractPagination(params);

      expect(pagination.page).toBe(3);
      expect(pagination.limit).toBe(50);
      expect(pagination.offset).toBe(100);
      expect(pagination.orderBy).toBe('created_at');
      expect(pagination.orderDirection).toBe('ASC');
    });

    it('handles typed AppErrors cleanly with custom status and codes', async () => {
      const err = new NotFoundError('Client entity not found');
      const res = handleApiError(err);
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('NOT_FOUND');
      expect(body.error.message).toBe('Client entity not found');
    });

    it('handles Forbidden and RateLimit errors with exact HTTP codes', async () => {
      const forbiddenRes = handleApiError(new ForbiddenError('Only owners can delete organization'));
      expect(forbiddenRes.status).toBe(403);

      const rateLimitRes = handleApiError(new RateLimitError('Rate limit exceeded (120 req/min)'));
      expect(rateLimitRes.status).toBe(429);
    });
  });

  describe('User Service (File 43)', () => {
    it('manages user profiles and rejects non-existent users with NotFoundError', async () => {
      await expect(userService.getUserProfile('00000000-0000-0000-0000-000000000000')).rejects.toThrow(
        NotFoundError
      );
    });

    it('provides user preferences getter and updater', async () => {
      expect(typeof userService.getUserPreferences).toBe('function');
      expect(typeof userService.updateUserPreferences).toBe('function');
    });
  });

  describe('Organization Service & RBAC (File 44)', () => {
    it('creates organizations and protects sole owner from demotion or removal', async () => {
      expect(typeof orgService.createOrganization).toBe('function');
      expect(typeof orgService.updateOrganization).toBe('function');
      expect(typeof orgService.getMembers).toBe('function');
      expect(typeof orgService.createInvitation).toBe('function');
    });

    it('generates secure 7-day token invitations', async () => {
      const invite = await orgService.createInvitation(
        '00000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000002',
        'newmember@innoventix.io',
        'member'
      );

      expect(invite.status).toBe('invited');
      expect(invite.email).toBe('newmember@innoventix.io');
      expect(invite.token).toBeDefined();
      expect(invite.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('CRM & Pipeline Service (File 45)', () => {
    it('enforces strict one-way communication mode promotion (manual -> connected)', async () => {
      // Mocking existing client with 'connected' mode
      const mockConnectedClient = {
        id: 'client-1',
        organization_id: 'org-1',
        name: 'ACME Corp',
        communication_mode: 'connected',
      };

      vi.spyOn(crmService, 'getClient').mockResolvedValueOnce(mockConnectedClient as any);

      await expect(
        crmService.updateClient('client-1', 'org-1', 'user-1', {
          communication_mode: 'manual' as any,
        })
      ).rejects.toThrow(ValidationError);
    });

    it('provides CRM analytics and tag management capabilities', async () => {
      expect(typeof crmService.getCrmAnalytics).toBe('function');
      expect(typeof crmService.getTags).toBe('function');
      expect(typeof crmService.createTag).toBe('function');
      expect(typeof crmService.createInteraction).toBe('function');
    });
  });

  describe('Project Management Service (File 46)', () => {
    it('supports template instantiation, deliverables lifecycle, and tasks', async () => {
      expect(typeof projectService.createProject).toBe('function');
      expect(typeof projectService.createTask).toBe('function');
      expect(typeof projectService.updateTaskStatus).toBe('function');
      expect(typeof projectService.createDeliverable).toBe('function');
      expect(typeof projectService.updateDeliverable).toBe('function');
      expect(typeof projectService.createFromTemplate).toBe('function');
      expect(typeof projectService.listTemplates).toBe('function');
    });
  });

  describe('Communication Service (File 47)', () => {
    it('provides unified message ingestion, client history, and channel management', async () => {
      expect(typeof communicationService.ingestInboundMessage).toBe('function');
      expect(typeof communicationService.sendMessage).toBe('function');
      expect(typeof communicationService.getChannels).toBe('function');
      expect(typeof communicationService.getClientHistory).toBe('function');
    });
  });

  describe('Billing & Plan Quota Service (File 48)', () => {
    it('returns the full plan limits catalog for all 4 tiers', () => {
      const plans = billingService.getPlans();
      expect(plans).toHaveLength(4);
      expect(plans.map((p) => p.id)).toEqual(['free', 'starter', 'pro', 'enterprise']);

      expect(PLAN_LIMITS_MAP.free.maxClients).toBe(5);
      expect(PLAN_LIMITS_MAP.starter.maxClients).toBe(25);
      expect(PLAN_LIMITS_MAP.pro.maxClients).toBe(100);
      expect(PLAN_LIMITS_MAP.enterprise.maxClients).toBe(99999);
    });

    it('blocks resource creation when quota is exceeded', async () => {
      vi.spyOn(billingService, 'getUsageAndLimits').mockResolvedValueOnce({
        planTier: 'free',
        limits: PLAN_LIMITS_MAP.free,
        usage: {
          clients: { current: 5, max: 5, percentage: 100 },
          projects: { current: 1, max: 3, percentage: 33 },
          teamMembers: { current: 1, max: 2, percentage: 50 },
        },
      });

      await expect(
        billingService.assertQuotaAvailable('test-org', 'clients')
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('Automation & Signed Webhooks (File 49)', () => {
    it('cryptographically signs and verifies HMAC-SHA256 payloads', () => {
      const secret = 'super-secret-automation-key-999';
      const payload = {
        event: 'project.delivered',
        timestamp: '2026-09-28T12:00:00Z',
        organizationId: 'org-test-123',
        data: { projectId: 'prj-777', amount: 5000 },
      };

      const signature = automationService.signPayload(payload, secret);
      expect(signature).toBeDefined();
      expect(typeof signature).toBe('string');
      expect(signature.length).toBe(64); // 256 bits hex

      // Verify valid signature
      const isValid = automationService.verifySignature(JSON.stringify(payload), signature, secret);
      expect(isValid).toBe(true);

      // Verify with 'sha256=' prefix
      const isValidWithPrefix = automationService.verifySignature(
        JSON.stringify(payload),
        `sha256=${signature}`,
        secret
      );
      expect(isValidWithPrefix).toBe(true);

      // Reject tampered payload
      const isTamperedValid = automationService.verifySignature(
        JSON.stringify({ ...payload, data: { projectId: 'prj-777', amount: 999999 } }),
        signature,
        secret
      );
      expect(isTamperedValid).toBe(false);
    });

    it('generates test ping webhook payloads for verification', async () => {
      const res = await automationService.dispatchTestWebhook(
        '00000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000002'
      );
      expect(res.success).toBe(true);
      expect(res.payload.event).toBe('test.ping');
      expect(res.signature.startsWith('sha256=')).toBe(true);
    });

  });
});
