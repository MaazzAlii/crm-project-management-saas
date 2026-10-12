import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { query } from '../lib/db';
import { orgRepo } from '../lib/db/repositories/org-repo';
import { userRepo } from '../lib/db/repositories/user-repo';
import { invitationRepo } from '../lib/db/repositories/invitation-repo';
import { setOrganizationPlan } from '../lib/billing/current-plan';
import { generateToken, hashToken } from '../lib/security/invite-token';
import * as authMiddleware from '../lib/auth/middleware';
import * as usageRoute from '../app/api/billing/usage/route';

describe('Prompt 27: API Plan and Usage (/api/billing/usage)', () => {
  let orgAId: string;
  let orgBId: string;
  let userAId: string;
  let userBId: string;
  let userAEmail: string;
  let userBEmail: string;

  beforeEach(async () => {
    const uid = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    userAEmail = `user_a_${uid}@innoventix.io`;
    userBEmail = `user_b_${uid}@othercompany.com`;

    const userA = await userRepo.create({
      email: userAEmail,
      fullName: 'User A',
      passwordHash: 'dummy_hash',
    });
    userAId = userA.id;

    const userB = await userRepo.create({
      email: userBEmail,
      fullName: 'User B',
      passwordHash: 'dummy_hash',
    });
    userBId = userB.id;

    const orgA = await orgRepo.create({
      name: `Usage Test Org A ${uid}`,
      slug: `org-a-${uid}`,
      ownerUserId: userAId,
    });
    orgAId = orgA.id;

    const orgB = await orgRepo.create({
      name: `Usage Test Org B ${uid}`,
      slug: `org-b-${uid}`,
      ownerUserId: userBId,
    });
    orgBId = orgB.id;
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    if (orgAId) {
      await query('DELETE FROM invitations WHERE organization_id = $1', [orgAId]);
      await query('DELETE FROM organization_plans WHERE organization_id = $1', [orgAId]);
      await query('DELETE FROM organizations WHERE id = $1', [orgAId]);
    }
    if (orgBId) {
      await query('DELETE FROM invitations WHERE organization_id = $1', [orgBId]);
      await query('DELETE FROM organization_plans WHERE organization_id = $1', [orgBId]);
      await query('DELETE FROM organizations WHERE id = $1', [orgBId]);
    }
    if (userAId) await query('DELETE FROM users WHERE id = $1', [userAId]);
    if (userBId) await query('DELETE FROM users WHERE id = $1', [userBId]);
  });

  it('1. returns 401 when session context is missing or unauthenticated', async () => {
    vi.spyOn(authMiddleware, 'getAuthFromRequest').mockReturnValue(null);

    const req = new NextRequest('http://localhost:3000/api/billing/usage');
    const res = await usageRoute.GET(req);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.success).toBe(false);
  });

  it('2. returns 404 when query orgId does not match session orgId (tenant isolation)', async () => {
    vi.spyOn(authMiddleware, 'getAuthFromRequest').mockReturnValue({
      userId: userAId,
      email: userAEmail,
      orgId: orgAId,
      role: 'owner',
    } as any);

    const req = new NextRequest(`http://localhost:3000/api/billing/usage?orgId=${orgBId}`);
    const res = await usageRoute.GET(req);
    expect(res.status).toBe(404);
  });

  it('3. returns accurate plan, seat limits, pending limits, and verification status for Free tier', async () => {
    vi.spyOn(authMiddleware, 'getAuthFromRequest').mockReturnValue({
      userId: userAId,
      email: userAEmail,
      orgId: orgAId,
      role: 'owner',
    } as any);

    const req = new NextRequest('http://localhost:3000/api/billing/usage');
    const res = await usageRoute.GET(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    const data = json.data;

    // Plan details
    expect(data.plan.id).toBe('free');
    expect(data.plan.name).toBe('Free');

    // Seat quotas (Free plan allows 3 members, 2 pending invites)
    expect(data.maxMembers).toBe(3);
    expect(data.membersUsed).toBe(1); // owner
    expect(data.pendingInvites).toBe(0);
    expect(data.maxPendingInvites).toBe(2);

    // Limit reached booleans
    expect(data.limitReached.seats).toBe(false);
    expect(data.limitReached.pendingInvites).toBe(false);
    expect(data.seatLimitReached).toBe(false);
    expect(data.pendingLimitReached).toBe(false);

    // Email and domain verifications
    expect(data.emailVerified).toBe(false);
    expect(data.domainVerified).toBe(false);
    expect(data.verifiedDomain).toBeNull();
  });

  it('4. reflects email verification status when user email is verified', async () => {
    // Mark user A email as verified
    await userRepo.verifyEmail(userAId);

    vi.spyOn(authMiddleware, 'getAuthFromRequest').mockReturnValue({
      userId: userAId,
      email: userAEmail,
      orgId: orgAId,
      role: 'owner',
    } as any);

    const req = new NextRequest('http://localhost:3000/api/billing/usage');
    const res = await usageRoute.GET(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.data.emailVerified).toBe(true);
  });

  it('5. reflects domain verification status when organization domain is verified', async () => {
    // Set verified domain on org A
    await orgRepo.setVerifiedDomain(orgAId, userAId, 'innoventix.io');

    vi.spyOn(authMiddleware, 'getAuthFromRequest').mockReturnValue({
      userId: userAId,
      email: userAEmail,
      orgId: orgAId,
      role: 'owner',
    } as any);

    const req = new NextRequest('http://localhost:3000/api/billing/usage');
    const res = await usageRoute.GET(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.data.domainVerified).toBe(true);
    expect(json.data.verifiedDomain).toBe('innoventix.io');
  });

  it('6. correctly sets limitReached booleans when seat or pending limits are reached', async () => {
    // Add 2 pending invites to Org A (maxPendingInvites for Free is 2, and 1 member + 2 pending = 3 seats = maxMembers)
    for (let i = 1; i <= 2; i++) {
      await invitationRepo.insertInvitation(orgAId, {
        email: `pending_${i}_${Date.now()}@example.com`,
        role: 'member',
        tokenHash: hashToken(generateToken()),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
    }

    vi.spyOn(authMiddleware, 'getAuthFromRequest').mockReturnValue({
      userId: userAId,
      email: userAEmail,
      orgId: orgAId,
      role: 'owner',
    } as any);

    const req = new NextRequest('http://localhost:3000/api/billing/usage');
    const res = await usageRoute.GET(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    const data = json.data;

    expect(data.pendingInvites).toBe(2);
    expect(data.limitReached.pendingInvites).toBe(true);
    expect(data.pendingLimitReached).toBe(true);

    // 1 member + 2 pending invites = 3 seats used = maxMembers (3)
    expect(data.limitReached.seats).toBe(true);
    expect(data.seatLimitReached).toBe(true);
  });

  it('7. reflects upgraded Pro tier plan quotas and limits', async () => {
    // Upgrade Org A to Pro
    await setOrganizationPlan(orgAId, 'pro', 'active');

    vi.spyOn(authMiddleware, 'getAuthFromRequest').mockReturnValue({
      userId: userAId,
      email: userAEmail,
      orgId: orgAId,
      role: 'owner',
    } as any);

    const req = new NextRequest('http://localhost:3000/api/billing/usage');
    const res = await usageRoute.GET(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    const data = json.data;

    expect(data.plan.id).toBe('pro');
    expect(data.plan.name).toBe('Pro');
    expect(data.maxMembers).toBe(15);
    expect(data.maxPendingInvites).toBe(20);
    expect(data.limitReached.seats).toBe(false);
    expect(data.limitReached.pendingInvites).toBe(false);
  });

  it('8. multi-tenant isolation: Org A never receives Org B data', async () => {
    await orgRepo.setVerifiedDomain(orgBId, userBId, 'othercompany.com');

    vi.spyOn(authMiddleware, 'getAuthFromRequest').mockReturnValue({
      userId: userAId,
      email: userAEmail,
      orgId: orgAId,
      role: 'owner',
    } as any);

    const req = new NextRequest('http://localhost:3000/api/billing/usage');
    const res = await usageRoute.GET(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    // Org A domain remains unverified
    expect(json.data.domainVerified).toBe(false);
    expect(json.data.verifiedDomain).toBeNull();
  });
});
