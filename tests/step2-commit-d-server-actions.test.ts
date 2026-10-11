import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import * as orgActions from '@/app/actions/org';
import * as sessionModule from '@/lib/auth/session';
import * as db from '@/lib/db';

const mockCookieStore = {
  set: vi.fn(),
  get: vi.fn(),
};

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => mockCookieStore),
}));

vi.mock('@/lib/auth/session', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/auth/session')>();
  return {
    ...actual,
    getCurrentSessionContext: vi.fn(),
    getCookieSecure: vi.fn().mockReturnValue(false),
    getCookieDomain: vi.fn().mockReturnValue(undefined),
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

describe('Commit D: Server Actions & Portal Settings Tenancy Scoping', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('setActiveOrgAction (app/actions/org.ts)', () => {
    it('throws error when user is not authenticated', async () => {
      vi.mocked(sessionModule.getCurrentSessionContext).mockResolvedValue(null as any);
      await expect(orgActions.setActiveOrgAction('org-123')).rejects.toThrow(/Unauthorized/i);
      expect(mockCookieStore.set).not.toHaveBeenCalled();
    });

    it('throws error when user is not a member of the target organization', async () => {
      vi.mocked(sessionModule.getCurrentSessionContext).mockResolvedValue({
        user: { id: 'usr-attacker' },
        organization: { id: 'org-own' },
        isSuperAdmin: false,
      } as any);

      // No membership found
      vi.mocked(db.queryOne).mockResolvedValue(null);

      await expect(orgActions.setActiveOrgAction('org-target-victim')).rejects.toThrow(
        /not a member/i
      );
      expect(mockCookieStore.set).not.toHaveBeenCalled();
    });

    it('sets cookie successfully when user is a verified member', async () => {
      vi.mocked(sessionModule.getCurrentSessionContext).mockResolvedValue({
        user: { id: 'usr-valid' },
        organization: { id: 'org-own' },
        isSuperAdmin: false,
      } as any);

      vi.mocked(db.queryOne).mockResolvedValue({ user_id: 'usr-valid' } as any);

      await orgActions.setActiveOrgAction('org-valid-target');
      expect(mockCookieStore.set).toHaveBeenCalledWith(
        'active_org_id',
        'org-valid-target',
        expect.objectContaining({ path: '/' })
      );
    });
  });

  describe('Portal Settings SQL Scoping (app/actions/portal-settings.ts)', () => {
    it('ensures all 7 queries in portal-settings.ts scope by organization_id', () => {
      const filePath = path.join(process.cwd(), 'app/actions/portal-settings.ts');
      const content = fs.readFileSync(filePath, 'utf8');

      // Check all queries for clients table include organization_id
      const queryMatches = Array.from(
        content.matchAll(/(?:query|queryOne)(?:<[^>]*>)?\(\s*[`'"]([\s\S]*?)[`'"]/g)
      );

      expect(queryMatches.length).toBe(7);

      for (const match of queryMatches) {
        const sql = match[1];
        if (/FROM\s+clients\b|UPDATE\s+clients\b/i.test(sql)) {
          expect(sql).toMatch(/organization_id/i);
        }
      }
    });
  });
});
