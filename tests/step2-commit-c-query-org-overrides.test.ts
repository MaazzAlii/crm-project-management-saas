import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import * as crmClientsRoute from '@/app/api/crm/clients/route';
import * as projectsRoute from '@/app/api/projects/route';
import * as billingUsageRoute from '@/app/api/billing/usage/route';
import * as commsInboxRoute from '@/app/api/communications/inbox/route';
import * as authMiddleware from '@/lib/auth/middleware';
import * as crmServiceModule from '@/lib/services/crm-service';
import * as projectServiceModule from '@/lib/services/project-service';

vi.mock('@/lib/auth/middleware', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/auth/middleware')>();
  return {
    ...actual,
    getAuthFromRequest: vi.fn(),
    withRole: vi.fn(),
  };
});

vi.mock('@/lib/services/crm-service', () => ({
  crmService: {
    listClients: vi.fn().mockResolvedValue({ clients: [], total: 0 }),
    createClient: vi.fn().mockResolvedValue({ id: 'c1' }),
  },
}));

vi.mock('@/lib/services/project-service', () => ({
  projectService: {
    listProjects: vi.fn().mockResolvedValue({ projects: [], total: 0 }),
  },
}));

vi.mock('@/lib/services/billing-service', () => ({
  billingService: {
    assertQuotaAvailable: vi.fn().mockResolvedValue(true),
    getUsage: vi.fn().mockResolvedValue({ usage: {} }),
  },
}));

vi.mock('@/lib/services/comms-service', () => ({
  commsService: {
    listInbox: vi.fn().mockResolvedValue({ messages: [], total: 0 }),
  },
}));

describe('Commit C: Query String & Body orgId Override Elimination', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/crm/clients', () => {
    it('returns 404 when query orgId does not match session orgId', async () => {
      vi.mocked(authMiddleware.getAuthFromRequest).mockReturnValue({
        userId: 'user-1',
        orgId: 'org-real',
        role: 'org_admin',
      } as any);

      const req = new NextRequest('http://localhost:3000/api/crm/clients?orgId=org-malicious');
      const res = await crmClientsRoute.GET(req);
      expect(res.status).toBe(404);
      expect(crmServiceModule.crmService.listClients).not.toHaveBeenCalled();
    });

    it('uses session orgId when no query param is sent', async () => {
      vi.mocked(authMiddleware.getAuthFromRequest).mockReturnValue({
        userId: 'user-1',
        orgId: 'org-real',
        role: 'org_admin',
      } as any);

      const req = new NextRequest('http://localhost:3000/api/crm/clients');
      const res = await crmClientsRoute.GET(req);
      expect(res.status).toBe(200);
      expect(crmServiceModule.crmService.listClients).toHaveBeenCalledWith('org-real', expect.anything());
    });
  });

  describe('POST /api/crm/clients', () => {
    it('returns 404 when body organizationId does not match session orgId', async () => {
      vi.mocked(authMiddleware.getAuthFromRequest).mockReturnValue({
        userId: 'user-1',
        orgId: 'org-real',
        role: 'org_admin',
      } as any);

      const req = new NextRequest('http://localhost:3000/api/crm/clients', {
        method: 'POST',
        body: JSON.stringify({ name: 'Target Client', organizationId: 'org-malicious' }),
      });
      const res = await crmClientsRoute.POST(req);
      expect(res.status).toBe(404);
      expect(crmServiceModule.crmService.createClient).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/projects', () => {
    it('returns 404 when query orgId does not match session orgId', async () => {
      vi.mocked(authMiddleware.getAuthFromRequest).mockReturnValue({
        userId: 'user-1',
        orgId: 'org-real',
        role: 'org_admin',
      } as any);

      const req = new NextRequest('http://localhost:3000/api/projects?orgId=org-malicious');
      const res = await projectsRoute.GET(req);
      expect(res.status).toBe(404);
      expect(projectServiceModule.projectService.listProjects).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/billing/usage', () => {
    it('returns 404 when query orgId does not match session orgId', async () => {
      vi.mocked(authMiddleware.getAuthFromRequest).mockReturnValue({
        userId: 'user-1',
        orgId: 'org-real',
        role: 'org_admin',
      } as any);

      const req = new NextRequest('http://localhost:3000/api/billing/usage?orgId=org-malicious');
      const res = await billingUsageRoute.GET(req);
      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/communications/inbox', () => {
    it('returns 404 when query orgId does not match session orgId', async () => {
      vi.mocked(authMiddleware.getAuthFromRequest).mockReturnValue({
        userId: 'user-1',
        orgId: 'org-real',
        role: 'org_admin',
      } as any);

      const req = new NextRequest('http://localhost:3000/api/communications/inbox?orgId=org-malicious');
      const res = await commsInboxRoute.GET(req);
      expect(res.status).toBe(404);
    });
  });
});
