import React from 'react';
// Ensure React is globally available for components compiled in Node test environment
(globalThis as any).React = React;

import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { NextRequest } from 'next/server';
import * as sessionModule from '@/lib/auth/session';
import * as db from '@/lib/db';
import { fetchProjectsAction, fetchProjectDetailAction } from '@/app/(dashboard)/projects/actions';
import { fetchAllTasksAction } from '@/app/(dashboard)/tasks/actions';
import { GET as getClientsRoute } from '@/app/api/crm/clients/route';
import { GET as getProjectByIdRoute } from '@/app/api/projects/[id]/route';
import ProjectDetailPage from '@/app/(dashboard)/projects/[id]/page';
import ProjectsKanbanPage from '@/app/(dashboard)/projects/kanban/page';
import ProjectsPage from '@/app/(dashboard)/projects/page';

vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

vi.mock('@/lib/auth/session', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/auth/session')>();
  return {
    ...actual,
    getCurrentSessionContext: vi.fn(),
  };
});

vi.mock('@/lib/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/db')>();
  return {
    ...actual,
    query: vi.fn(),
    queryOne: vi.fn(),
  };
});

vi.mock('@/lib/auth/middleware', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/auth/middleware')>();
  return {
    ...actual,
    getAuthFromRequest: vi.fn(),
  };
});

import { getAuthFromRequest } from '@/lib/auth/middleware';

// Helper to create a pg-compatible array + object result
function createDbResult<T = any>(items: T[]): any {
  const arr = [...items] as any;
  arr.rows = items;
  arr.rowCount = items.length;
  return arr;
}

describe('Commit E: Cross-Tenant Isolation, Negative Access, and Regression Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Multi-Tenant Data Isolation (Org A vs Org B)', () => {
    it('scopes projects queries exclusively to active organization A', async () => {
      vi.mocked(sessionModule.getCurrentSessionContext).mockResolvedValue({
        user: { id: 'usr-a', email: 'alice@orga.com', role: 'admin' },
        organization: { id: 'org-a-1111', name: 'Org A' },
        isSuperAdmin: false,
      } as any);

      vi.mocked(db.query).mockImplementation(async (sql: string, params: any[] = []) => {
        expect(sql).toContain('WHERE p.organization_id = $1');
        expect(params).toEqual(['org-a-1111']);
        return createDbResult([
          {
            id: 'proj-a',
            organization_id: 'org-a-1111',
            title: 'Project A',
            client_id: 'cli-a',
            client_name: 'Client A',
            status: 'Active',
            amount: '1000',
            currency: 'USD',
            priority: 'high',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]);
      });

      const projects = await fetchProjectsAction();
      expect(projects).toHaveLength(1);
      expect(projects[0].id).toBe('proj-a');
      expect(projects[0].organization_id).toBe('org-a-1111');
    });

    it('scopes clients API endpoint exclusively to active organization A', async () => {
      vi.mocked(getAuthFromRequest).mockReturnValue({
        userId: 'usr-a',
        email: 'alice@orga.com',
        orgId: 'org-a-1111',
        role: 'member',
      } as any);

      vi.mocked(db.query).mockImplementation(async (sql: string, params: any[] = []) => {
        expect(sql).toContain('WHERE organization_id = $1');
        expect(params[0]).toBe('org-a-1111');
        return createDbResult([
          {
            id: 'cli-a',
            organization_id: 'org-a-1111',
            name: 'Acme A',
            status: 'active',
            total_revenue: '5000',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]);
      });

      vi.mocked(db.queryOne).mockResolvedValue({ count: '1' });

      const request = new NextRequest('http://localhost:3005/api/crm/clients');
      const response = await getClientsRoute(request);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.data).toHaveLength(1);
      expect(json.data[0].id).toBe('cli-a');
      expect(json.data[0].organization_id).toBe('org-a-1111');
    });

    it('scopes global tasks queries exclusively to active organization A', async () => {
      vi.mocked(sessionModule.getCurrentSessionContext).mockResolvedValue({
        user: { id: 'usr-a', email: 'alice@orga.com', role: 'admin' },
        organization: { id: 'org-a-1111', name: 'Org A' },
        isSuperAdmin: false,
      } as any);

      vi.mocked(db.query).mockImplementation(async (sql: string, params: any[] = []) => {
        expect(sql).toContain('WHERE t.organization_id = $1');
        expect(params).toEqual(['org-a-1111']);
        return createDbResult([
          {
            id: 'task-a',
            organization_id: 'org-a-1111',
            title: 'Task A',
            status: 'in_progress',
            priority: 'high',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]);
      });

      const tasks = await fetchAllTasksAction();
      expect(tasks).toHaveLength(1);
      expect(tasks[0].id).toBe('task-a');
      expect(tasks[0].organization_id).toBe('org-a-1111');
    });
  });

  describe('Direct Resource Access & 404 Negative Tests', () => {
    it('returns 404 when Org A user requests Org B project directly via API', async () => {
      vi.mocked(getAuthFromRequest).mockReturnValue({
        userId: 'usr-a',
        email: 'alice@orga.com',
        orgId: 'org-a-1111',
        role: 'member',
      } as any);

      // Org B project lookup scoped by Org A returns null
      vi.mocked(db.queryOne).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3005/api/projects/proj-b-secret');
      const response = await getProjectByIdRoute(request, {
        params: Promise.resolve({ id: 'proj-b-secret' }),
      });

      expect(response.status).toBe(404);
      const json = await response.json();
      const errorMessage = json.error?.message || json.error || '';
      expect(errorMessage).toMatch(/not found/i);
    });

    it('returns null when Org A user fetches Org B project details via server action', async () => {
      vi.mocked(sessionModule.getCurrentSessionContext).mockResolvedValue({
        user: { id: 'usr-a', email: 'alice@orga.com', role: 'admin' },
        organization: { id: 'org-a-1111', name: 'Org A' },
        isSuperAdmin: false,
      } as any);

      // WHERE p.id = $1 AND p.organization_id = $2 returns null for cross-tenant ID
      vi.mocked(db.queryOne).mockResolvedValue(null);

      const project = await fetchProjectDetailAction('proj-b-belonging-to-other-org');
      expect(project).toBeNull();
    });

    it('ProjectDetailPage safely retrieves sessionContext and triggers notFound() for cross-tenant ID', async () => {
      vi.mocked(sessionModule.getCurrentSessionContext).mockResolvedValue({
        user: { id: 'usr-a', email: 'alice@orga.com', role: 'admin' },
        organization: { id: 'org-a-1111', name: 'Org A' },
        isSuperAdmin: false,
      } as any);

      vi.mocked(db.queryOne).mockResolvedValue(null);
      vi.mocked(db.query).mockResolvedValue(createDbResult([]));

      await expect(
        ProjectDetailPage({ params: { id: 'proj-b-secret' } })
      ).rejects.toThrow('NEXT_NOT_FOUND');
    });

    it('ProjectsPage and ProjectsKanbanPage correctly retrieve sessionContext and scope queries', async () => {
      vi.mocked(sessionModule.getCurrentSessionContext).mockResolvedValue({
        user: { id: 'usr-a', email: 'alice@orga.com', role: 'admin' },
        organization: { id: 'org-a-1111', name: 'Org A' },
        isSuperAdmin: false,
      } as any);

      const executedQueries: string[] = [];
      const queryParams: any[][] = [];

      vi.mocked(db.query).mockImplementation(async (sql: string, params: any[] = []) => {
        executedQueries.push(sql);
        queryParams.push(params);
        return createDbResult([]);
      });
      vi.mocked(db.queryOne).mockResolvedValue(null);

      await ProjectsKanbanPage();
      await ProjectsPage();

      // Check that queries in pages filtered by sessionContext.organization.id
      for (const params of queryParams) {
        if (params.length > 0) {
          expect(params).toContain('org-a-1111');
        }
      }
    });
  });

  describe('Static Regression Scanner Assertions', () => {
    it('verifies zero unallowlisted query/body org overrides across app/api and app/actions', () => {
      const walk = (dir: string, filter: (f: string) => boolean): string[] => {
        let results: string[] = [];
        if (!fs.existsSync(dir)) return results;
        const list = fs.readdirSync(dir);
        for (const file of list) {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);
          if (stat.isDirectory()) {
            results = results.concat(walk(filePath, filter));
          } else if (filter(filePath)) {
            results.push(filePath);
          }
        }
        return results;
      };

      const apiFiles = walk('app/api', (f) => f.endsWith('route.ts'));
      const actionFiles = walk('app', (f) => f.endsWith('.ts') && (f.endsWith('actions.ts') || f.includes(`${path.sep}actions${path.sep}`)));
      const candidateFiles = [...apiFiles, ...actionFiles];

      const violations: string[] = [];

      for (const file of candidateFiles) {
        const content = fs.readFileSync(file, 'utf8');

        // Check for raw searchParams query org override
        if (/searchParams\.get\(['"](orgId|organizationId|organization_id)['"]\)/.test(content)) {
          violations.push(`QUERY_ORG_OVERRIDE in ${file}`);
        }

        // Check for body/input org override
        if (/(body|input|formData)\.(orgId|organizationId|organization_id)/.test(content)) {
          violations.push(`BODY_ORG_OVERRIDE in ${file}`);
        }
      }

      expect(violations).toEqual([]);
    });

    it('verifies zero dev fallbacks in app and lib code', () => {
      const walk = (dir: string, filter: (f: string) => boolean): string[] => {
        let results: string[] = [];
        if (!fs.existsSync(dir)) return results;
        const list = fs.readdirSync(dir);
        for (const file of list) {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);
          if (stat.isDirectory()) {
            results = results.concat(walk(filePath, filter));
          } else if (filter(filePath)) {
            results.push(filePath);
          }
        }
        return results;
      };

      const files = walk('app', (f) => f.endsWith('.ts') || f.endsWith('.tsx'))
        .concat(walk('lib', (f) => f.endsWith('.ts') || f.endsWith('.tsx')));

      const devFallbacks: string[] = [];

      for (const file of files) {
        const content = fs.readFileSync(file, 'utf8');
        const codeWithoutComments = content.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
        const matches = codeWithoutComments.match(/\b(DEV_[A-Za-z0-9_]*|getDev[A-Za-z0-9_]*|__DEV_[A-Za-z0-9_]*|DEV_SAMPLE_[A-Za-z0-9_]*)\b/g);
        if (matches && matches.length > 0) {
          devFallbacks.push(`${file}: ${matches.join(', ')}`);
        }
      }

      expect(devFallbacks).toEqual([]);
    });
  });
});
