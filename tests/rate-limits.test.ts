import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { query } from '../lib/db';
import { orgRepo } from '../lib/db/repositories/org-repo';
import { userRepo } from '../lib/db/repositories/user-repo';
import { invitationRepo } from '../lib/db/repositories/invitation-repo';
import { generateToken, hashToken } from '../lib/security/invite-token';
import { resetRateLimitStore } from '../lib/security/rate-limit';
import * as authMiddleware from '../lib/auth/middleware';
import * as inviteCreateRoute from '../app/api/invitations/route';
import * as inviteResendRoute from '../app/api/invitations/[id]/resend/route';
import * as inviteAcceptRoute from '../app/api/invitations/accept/route';
import * as inviteDeclineRoute from '../app/api/invitations/decline/route';
import * as verifyEmailRoute from '../app/api/auth/verify-email/send/route';
import * as domainCodeRoute from '../app/api/organizations/domain/send-code/route';
import { setOrganizationPlan } from '../lib/billing/current-plan';

describe('Prompt 28: Rate Limits for Invite and Verification Endpoints', () => {
  let orgId: string;
  let ownerId: string;
  let ownerEmail: string;

  beforeEach(async () => {
    resetRateLimitStore();

    const uid = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    ownerEmail = `owner_${uid}@innoventix.io`;

    const owner = await userRepo.create({
      email: ownerEmail,
      fullName: 'Owner User',
      passwordHash: 'dummy_hash',
    });
    ownerId = owner.id;

    const org = await orgRepo.create({
      name: `Rate Limit Org ${uid}`,
      slug: `rate-limit-org-${uid}`,
      ownerUserId: ownerId,
    });
    orgId = org.id;

    // Set org to Pro tier so quotas do not block domain code tests
    await setOrganizationPlan(orgId, 'pro', 'active');
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    resetRateLimitStore();
    if (orgId) {
      await query('DELETE FROM invitations WHERE organization_id = $1', [orgId]);
      await query('DELETE FROM organization_plans WHERE organization_id = $1', [orgId]);
      await query('DELETE FROM organizations WHERE id = $1', [orgId]);
    }
    if (ownerId) await query('DELETE FROM users WHERE id = $1', [ownerId]);
  });

  it('1. invitation create: enforces rate limit of 20 per hour per user with Retry-After header', async () => {
    vi.spyOn(authMiddleware, 'getAuthFromRequest').mockReturnValue({
      userId: ownerId,
      email: ownerEmail,
      orgId,
      role: 'owner',
    } as any);

    // Call 20 times (all allowed through rate limiter; even if some trigger business logic, rate limiter count increments)
    for (let i = 0; i < 20; i++) {
      const req = new NextRequest('http://localhost:3000/api/invitations', {
        method: 'POST',
        body: JSON.stringify({ email: `user_${i}_${Date.now()}@example.com`, role: 'member' }),
      });
      const res = await inviteCreateRoute.POST(req);
      expect(res.status).not.toBe(429);
    }

    // 21st call should trigger 429
    const blockedReq = new NextRequest('http://localhost:3000/api/invitations', {
      method: 'POST',
      body: JSON.stringify({ email: `user_21_${Date.now()}@example.com`, role: 'member' }),
    });
    const blockedRes = await inviteCreateRoute.POST(blockedReq);
    expect(blockedRes.status).toBe(429);
    expect(blockedRes.headers.get('Retry-After')).toBeTruthy();
  });

  it('2. resend: enforces rate limit of 5 per hour per invitation with Retry-After header', async () => {
    vi.spyOn(authMiddleware, 'getAuthFromRequest').mockReturnValue({
      userId: ownerId,
      email: ownerEmail,
      orgId,
      role: 'owner',
    } as any);

    const rawToken = generateToken();
    const inv = await invitationRepo.insertInvitation(orgId, {
      email: `resend_${Date.now()}@example.com`,
      role: 'member',
      tokenHash: hashToken(rawToken),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    const params = Promise.resolve({ id: inv.id });

    // 5 allowed requests
    for (let i = 0; i < 5; i++) {
      const req = new NextRequest(`http://localhost:3000/api/invitations/${inv.id}/resend`, {
        method: 'POST',
      });
      const res = await inviteResendRoute.POST(req, { params });
      expect(res.status).not.toBe(429);
    }

    // 6th request triggers 429
    const blockedReq = new NextRequest(`http://localhost:3000/api/invitations/${inv.id}/resend`, {
      method: 'POST',
    });
    const blockedRes = await inviteResendRoute.POST(blockedReq, { params });
    expect(blockedRes.status).toBe(429);
    expect(blockedRes.headers.get('Retry-After')).toBeTruthy();
  });

  it('3. accept and decline: enforces rate limit of 30 per hour per IP with Retry-After header', async () => {
    const testIp = '198.51.100.42';

    // 30 allowed attempts
    for (let i = 0; i < 30; i++) {
      const req = new NextRequest('http://localhost:3000/api/invitations/decline', {
        method: 'POST',
        headers: { 'x-forwarded-for': testIp },
        body: JSON.stringify({ token: `invalid_token_${i}` }),
      });
      const res = await inviteDeclineRoute.POST(req);
      expect(res.status).not.toBe(429);
    }

    // 31st attempt triggers 429
    const blockedReq = new NextRequest('http://localhost:3000/api/invitations/accept', {
      method: 'POST',
      headers: { 'x-forwarded-for': testIp },
      body: JSON.stringify({ token: 'invalid_token_31' }),
    });
    const blockedRes = await inviteAcceptRoute.POST(blockedReq);
    expect(blockedRes.status).toBe(429);
    expect(blockedRes.headers.get('Retry-After')).toBeTruthy();
  });

  it('4. verification send: enforces rate limit of 1 per 60 seconds per user with Retry-After header', async () => {
    vi.spyOn(authMiddleware, 'getAuthFromRequest').mockReturnValue({
      userId: ownerId,
      email: ownerEmail,
      orgId,
      role: 'owner',
    } as any);

    // 1st call succeeds
    const req1 = new NextRequest('http://localhost:3000/api/auth/verify-email/send', {
      method: 'POST',
    });
    const res1 = await verifyEmailRoute.POST(req1);
    expect(res1.status).toBe(200);

    // 2nd call immediately triggers 429
    const req2 = new NextRequest('http://localhost:3000/api/auth/verify-email/send', {
      method: 'POST',
    });
    const res2 = await verifyEmailRoute.POST(req2);
    expect(res2.status).toBe(429);
    expect(res2.headers.get('Retry-After')).toBeTruthy();
  });

  it('5. domain code send: enforces rate limit of 3 per hour per organization with Retry-After header', async () => {
    vi.spyOn(authMiddleware, 'getAuthFromRequest').mockReturnValue({
      userId: ownerId,
      email: ownerEmail,
      orgId,
      role: 'owner',
    } as any);

    // 3 allowed calls
    for (let i = 0; i < 3; i++) {
      const req = new NextRequest('http://localhost:3000/api/organizations/domain/send-code', {
        method: 'POST',
        body: JSON.stringify({
          domain: 'innoventix.io',
          targetEmail: 'admin@innoventix.io',
        }),
      });
      const res = await domainCodeRoute.POST(req);
      expect(res.status).not.toBe(429);
    }

    // 4th call triggers 429
    const blockedReq = new NextRequest('http://localhost:3000/api/organizations/domain/send-code', {
      method: 'POST',
      body: JSON.stringify({
        domain: 'innoventix.io',
        targetEmail: 'admin@innoventix.io',
      }),
    });
    const blockedRes = await domainCodeRoute.POST(blockedReq);
    expect(blockedRes.status).toBe(429);
    expect(blockedRes.headers.get('Retry-After')).toBeTruthy();
  });
});
