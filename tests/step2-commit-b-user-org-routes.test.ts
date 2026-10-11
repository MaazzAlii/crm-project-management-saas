import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import * as userRoute from '@/app/api/users/route';
import * as userDetailRoute from '@/app/api/users/[id]/route';
import * as orgDetailRoute from '@/app/api/organizations/[id]/route';
import * as orgMembersRoute from '@/app/api/organizations/[id]/members/route';
import * as authMiddleware from '@/lib/auth/middleware';
import * as db from '@/lib/db';

vi.mock('@/lib/auth/middleware', () => ({
  getAuthFromRequest: vi.fn(),
  withRole: vi.fn(),
}));

vi.mock('@/lib/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/db')>();
  return {
    ...actual,
    query: vi.fn(),
    queryOne: vi.fn(),
  };
});

describe('Commit B: User & Organization Routes Tenancy Boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/users', () => {
    it('returns 401 when unauthenticated', async () => {
      vi.mocked(authMiddleware.getAuthFromRequest).mockReturnValue(null);
      const req = new NextRequest('http://localhost:3000/api/users');
      const res = await userRoute.GET(req);
      expect(res.status).toBe(401);
    });

    it('scopes user query to the caller active organization', async () => {
      vi.mocked(authMiddleware.getAuthFromRequest).mockReturnValue({
        userId: 'user-a',
        email: 'user-a@org-a.com',
        role: 'org_admin',
        orgId: 'org-a',
      } as any);

      vi.mocked(db.query).mockResolvedValue({
        rows: [{ id: 'user-a', email: 'user-a@org-a.com', full_name: 'User A' }],
      } as any);
      vi.mocked(db.queryOne).mockResolvedValue({ count: '1' } as any);

      const req = new NextRequest('http://localhost:3000/api/users');
      const res = await userRoute.GET(req);
      expect(res.status).toBe(200);

      // Verify db.query was called with organization scoping
      expect(db.query).toHaveBeenCalledWith(
        expect.stringMatching(/organization_members\s+om\s+ON\s+om\.user_id\s*=\s*u\.id\s+WHERE\s+om\.organization_id\s*=\s*\$1/i),
        expect.arrayContaining(['org-a'])
      );
    });
  });

  describe('GET /api/users/[id]', () => {
    it('returns 404 when requested user does not belong to caller organization', async () => {
      vi.mocked(authMiddleware.getAuthFromRequest).mockReturnValue({
        userId: 'user-a',
        email: 'user-a@org-a.com',
        role: 'org_admin',
        orgId: 'org-a',
      } as any);

      // User belongs to org-b, not org-a
      vi.mocked(db.queryOne).mockResolvedValue(null);

      const req = new NextRequest('http://localhost:3000/api/users/user-b');
      const res = await userDetailRoute.GET(req, { params: Promise.resolve({ id: 'user-b' }) });
      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/organizations/[id]', () => {
    it('returns 404 when caller does not belong to the requested organization', async () => {
      vi.mocked(authMiddleware.getAuthFromRequest).mockReturnValue({
        userId: 'user-a',
        email: 'user-a@org-a.com',
        role: 'member',
        orgId: 'org-a',
      } as any);

      // Caller is not a member of org-b
      vi.mocked(db.queryOne).mockResolvedValue(null);

      const req = new NextRequest('http://localhost:3000/api/organizations/org-b');
      const res = await orgDetailRoute.GET(req, { params: Promise.resolve({ id: 'org-b' }) });
      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/organizations/[id]/members', () => {
    it('returns 404 when caller is not a member of the requested organization', async () => {
      vi.mocked(authMiddleware.getAuthFromRequest).mockReturnValue({
        userId: 'user-a',
        email: 'user-a@org-a.com',
        role: 'member',
        orgId: 'org-a',
      } as any);

      // Caller is not a member of org-b
      vi.mocked(db.queryOne).mockResolvedValue(null);

      const req = new NextRequest('http://localhost:3000/api/organizations/org-b/members');
      const res = await orgMembersRoute.GET(req, { params: Promise.resolve({ id: 'org-b' }) });
      expect(res.status).toBe(404);
    });
  });
});
