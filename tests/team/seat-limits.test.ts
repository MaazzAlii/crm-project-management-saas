import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { query } from '../../lib/db';
import { orgRepo } from '../../lib/db/repositories/org-repo';
import { userRepo } from '../../lib/db/repositories/user-repo';
import { invitationRepo } from '../../lib/db/repositories/invitation-repo';
import { invalidatePlanCache } from '../../lib/billing/current-plan';
import { setEmailProvider } from '../../lib/email/sender';
import * as authMiddleware from '../../lib/auth/middleware';
import * as invitationsRoute from '../../app/api/invitations/route';
import * as acceptRoute from '../../app/api/invitations/accept/route';

describe('TEAM-2: Seat Limits & Upgrade UX Regression Tests', () => {
  let testOrgId: string;
  let ownerUserId: string;
  let ownerEmail: string;

  beforeEach(async () => {
    // Mock email provider to immediately succeed without SMTP delay
    setEmailProvider({
      send: async () => ({ success: true, messageId: 'mock_test_msg' }),
    });

    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    ownerEmail = `owner_team2_${id}@example.com`;

    const owner = await userRepo.create({
      email: ownerEmail,
      fullName: 'Team2 Owner',
      passwordHash: 'dummy_hash',
    });
    ownerUserId = owner.id;

    const org = await orgRepo.create({
      name: 'Team2 Org ' + id,
      slug: 'team2-org-' + id,
      ownerUserId,
    });
    testOrgId = org.id;

    // Default mock auth as organization owner
    vi.spyOn(authMiddleware, 'getAuthFromRequest').mockReturnValue({
      userId: ownerUserId,
      email: ownerEmail,
      role: 'user',
      orgId: testOrgId,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    setEmailProvider(null);
    invalidatePlanCache(testOrgId);
  });

  it('1. Free plan, 2 members → 3rd invite allowed', async () => {
    // Add 1 member (so total members = 2 including owner)
    const m1 = await userRepo.create({
      email: `m1_${Date.now()}@example.com`,
      fullName: 'Member 1',
      passwordHash: 'dummy_hash',
    });
    await query(
      'INSERT INTO organization_members (organization_id, user_id, role) VALUES ($1, $2, $3)',
      [testOrgId, m1.id, 'member']
    );

    // 3rd invite (total seats used = 2 members + 1 invite = 3 <= 3) -> Allowed
    const targetEmail = `m3_invite_${Date.now()}@example.com`;
    const postReq = new NextRequest('http://localhost:3000/api/invitations', {
      method: 'POST',
      body: JSON.stringify({ email: targetEmail, role: 'member' }),
    });

    const res = await invitationsRoute.POST(postReq);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data?.invitation?.email).toBe(targetEmail);
  });

  it('2. Free plan, 3 members → invite rejected with 402 + SEAT_LIMIT_REACHED', async () => {
    // Add 2 members (so total members = 3 including owner)
    for (let i = 1; i <= 2; i++) {
      const u = await userRepo.create({
        email: `seat_m${i}_${Date.now()}@example.com`,
        fullName: `Seat Member ${i}`,
        passwordHash: 'dummy_hash',
      });
      await query(
        'INSERT INTO organization_members (organization_id, user_id, role) VALUES ($1, $2, $3)',
        [testOrgId, u.id, 'member']
      );
    }

    // 4th seat attempt -> 402 Payment Required
    const postReq = new NextRequest('http://localhost:3000/api/invitations', {
      method: 'POST',
      body: JSON.stringify({ email: `m4_fail_${Date.now()}@example.com`, role: 'member' }),
    });

    const res = await invitationsRoute.POST(postReq);
    expect(res.status).toBe(402);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('SEAT_LIMIT_REACHED');
    expect(body.error.limit).toBe(3);
    expect(body.error.currentCount).toBe(3);
    expect(body.error.planName).toBe('Free');
    expect(body.error.upgradeUrl).toBe('/settings/billing');
  });

  it('3. Free plan, 2 pending → 3rd pending rejected with PENDING_LIMIT_REACHED', async () => {
    // Issue 2 pending invitations
    for (let i = 1; i <= 2; i++) {
      const postReq = new NextRequest('http://localhost:3000/api/invitations', {
        method: 'POST',
        body: JSON.stringify({ email: `pending_${i}_${Date.now()}@example.com`, role: 'member' }),
      });
      const res = await invitationsRoute.POST(postReq);
      expect(res.status).toBe(201);
    }

    // 3rd pending attempt -> 402 PENDING_LIMIT_REACHED
    const postReq3 = new NextRequest('http://localhost:3000/api/invitations', {
      method: 'POST',
      body: JSON.stringify({ email: `pending_3_${Date.now()}@example.com`, role: 'member' }),
    });

    const res3 = await invitationsRoute.POST(postReq3);
    expect(res3.status).toBe(402);
    const body3 = await res3.json();
    expect(body3.success).toBe(false);
    expect(body3.error.code).toBe('PENDING_LIMIT_REACHED');
    expect(body3.error.limit).toBe(2);
    expect(body3.error.currentCount).toBe(2);
    expect(body3.error.planName).toBe('Free');
    expect(body3.error.upgradeUrl).toBe('/settings/billing');
  });

  it('4. Free plan, invite created when 2 members, 3rd member added, accept → rejected 402', async () => {
    // Org has 1 owner + 1 member = 2 members
    const m1 = await userRepo.create({
      email: `c4_m1_${Date.now()}@example.com`,
      fullName: 'C4 Member 1',
      passwordHash: 'dummy_hash',
    });
    await query(
      'INSERT INTO organization_members (organization_id, user_id, role) VALUES ($1, $2, $3)',
      [testOrgId, m1.id, 'member']
    );

    // Create an invite for a future member (valid at creation time: 2 members + 0 pending)
    const inviteeEmail = `invitee_c4_${Date.now()}@example.com`;
    const inviteeUser = await userRepo.create({
      email: inviteeEmail,
      fullName: 'Invitee C4',
      passwordHash: 'dummy_hash',
    });

    const postReq = new NextRequest('http://localhost:3000/api/invitations', {
      method: 'POST',
      body: JSON.stringify({ email: inviteeEmail, role: 'member' }),
    });
    const postRes = await invitationsRoute.POST(postReq);
    expect(postRes.status).toBe(201);
    const postBody = await postRes.json();
    const rawToken = postBody.data?.inviteLink?.split('/invite/')[1];
    expect(rawToken).toBeDefined();

    // Now, before accepting, another member is directly added to org (reaching 3 members limit)
    const directMember = await userRepo.create({
      email: `direct_c4_${Date.now()}@example.com`,
      fullName: 'Direct Member',
      passwordHash: 'dummy_hash',
    });
    await query(
      'INSERT INTO organization_members (organization_id, user_id, role) VALUES ($1, $2, $3)',
      [testOrgId, directMember.id, 'member']
    );

    // Now accept the invitation as the invitee -> must be rejected with 402 SEAT_LIMIT_REACHED
    vi.spyOn(authMiddleware, 'getAuthFromRequest').mockReturnValue({
      userId: inviteeUser.id,
      email: inviteeEmail,
      role: 'user',
    });

    const acceptReq = new NextRequest('http://localhost:3000/api/invitations/accept', {
      method: 'POST',
      body: JSON.stringify({ token: rawToken }),
    });

    const acceptRes = await acceptRoute.POST(acceptReq);
    expect(acceptRes.status).toBe(402);
    const acceptBody = await acceptRes.json();
    expect(acceptBody.success).toBe(false);
    expect(acceptBody.error.code).toBe('SEAT_LIMIT_REACHED');
    expect(acceptBody.error.limit).toBe(3);
    expect(acceptBody.error.currentCount).toBe(3);
    expect(acceptBody.error.upgradeUrl).toBe('/settings/billing');
  });

  it('5. Pro plan, 15 members → limit scales beyond Free tier (allows >3 seats, max 15)', async () => {
    // Upgrade org to Pro tier in database
    await query(
      `INSERT INTO organization_plans (organization_id, plan_id, status, current_period_end)
       VALUES ($1, 'pro', 'active', NOW() + INTERVAL '30 days')
       ON CONFLICT (organization_id) DO UPDATE SET plan_id = 'pro', status = 'active'`,
      [testOrgId]
    );
    invalidatePlanCache(testOrgId);

    // Add 4 members (total 5 members including owner, well beyond Free limit of 3)
    for (let i = 1; i <= 4; i++) {
      const u = await userRepo.create({
        email: `pro_m${i}_${Date.now()}@example.com`,
        fullName: `Pro Member ${i}`,
        passwordHash: 'dummy_hash',
      });
      await query(
        'INSERT INTO organization_members (organization_id, user_id, role) VALUES ($1, $2, $3)',
        [testOrgId, u.id, 'member']
      );
    }

    // Attempt 6th member invite -> Allowed on Pro plan
    const proInviteEmail = `pro_invite_${Date.now()}@example.com`;
    const postReq = new NextRequest('http://localhost:3000/api/invitations', {
      method: 'POST',
      body: JSON.stringify({ email: proInviteEmail, role: 'member' }),
    });

    const res = await invitationsRoute.POST(postReq);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data?.invitation?.email).toBe(proInviteEmail);
  });

  it('6. Error body includes upgradeUrl and planName on quota rejection', async () => {
    // Fill Free seats to limit (3 members)
    for (let i = 1; i <= 2; i++) {
      const u = await userRepo.create({
        email: `c6_m${i}_${Date.now()}@example.com`,
        fullName: `C6 Member ${i}`,
        passwordHash: 'dummy_hash',
      });
      await query(
        'INSERT INTO organization_members (organization_id, user_id, role) VALUES ($1, $2, $3)',
        [testOrgId, u.id, 'member']
      );
    }

    const postReq = new NextRequest('http://localhost:3000/api/invitations', {
      method: 'POST',
      body: JSON.stringify({ email: `overflow_${Date.now()}@example.com`, role: 'member' }),
    });

    const res = await invitationsRoute.POST(postReq);
    expect(res.status).toBe(402);
    const body = await res.json();
    expect(body.error).toHaveProperty('upgradeUrl', '/settings/billing');
    expect(body.error).toHaveProperty('planName', 'Free');
    expect(body.error).toHaveProperty('currentCount', 3);
    expect(body.error).toHaveProperty('limit', 3);
  });

  it('7. Pending count excludes revoked/accepted invites (only status = "pending" counts)', async () => {
    // Create 2 invites
    const email1 = `p_count1_${Date.now()}@example.com`;
    const email2 = `p_count2_${Date.now()}@example.com`;

    const req1 = new NextRequest('http://localhost:3000/api/invitations', {
      method: 'POST',
      body: JSON.stringify({ email: email1, role: 'member' }),
    });
    const res1 = await invitationsRoute.POST(req1);
    const body1 = await res1.json();
    const inviteId1 = body1.data?.invitation?.id;

    const req2 = new NextRequest('http://localhost:3000/api/invitations', {
      method: 'POST',
      body: JSON.stringify({ email: email2, role: 'member' }),
    });
    await invitationsRoute.POST(req2);

    // Initial pending count is 2
    let pendingCount = await invitationRepo.countPending(testOrgId);
    expect(pendingCount).toBe(2);

    // Revoke the first invite
    await invitationRepo.updateStatus(testOrgId, inviteId1, {
      status: 'revoked',
      revokedAt: new Date(),
    });

    // Pending count must now be 1 (revoked invite excluded)
    pendingCount = await invitationRepo.countPending(testOrgId);
    expect(pendingCount).toBe(1);

    // A new invite can now be created because pending count dropped below 2
    const req3 = new NextRequest('http://localhost:3000/api/invitations', {
      method: 'POST',
      body: JSON.stringify({ email: `p_count3_${Date.now()}@example.com`, role: 'member' }),
    });
    const res3 = await invitationsRoute.POST(req3);
    expect(res3.status).toBe(201);
  });

  it('8. Member count excludes revoked members (deleted from organization_members)', async () => {
    // Add 2 members (reaching 3 members)
    const m1 = await userRepo.create({
      email: `m_rem1_${Date.now()}@example.com`,
      fullName: 'Remove Member 1',
      passwordHash: 'dummy_hash',
    });
    const m2 = await userRepo.create({
      email: `m_rem2_${Date.now()}@example.com`,
      fullName: 'Remove Member 2',
      passwordHash: 'dummy_hash',
    });
    await query('INSERT INTO organization_members (organization_id, user_id, role) VALUES ($1, $2, $3)', [testOrgId, m1.id, 'member']);
    await query('INSERT INTO organization_members (organization_id, user_id, role) VALUES ($1, $2, $3)', [testOrgId, m2.id, 'member']);

    expect(await orgRepo.countMembers(testOrgId)).toBe(3);

    // 4th invite fails
    const failReq = new NextRequest('http://localhost:3000/api/invitations', {
      method: 'POST',
      body: JSON.stringify({ email: `m_fail_${Date.now()}@example.com`, role: 'member' }),
    });
    const failRes = await invitationsRoute.POST(failReq);
    expect(failRes.status).toBe(402);

    // Remove 1 member (simulate member revocation / removal)
    await query('DELETE FROM organization_members WHERE organization_id = $1 AND user_id = $2', [testOrgId, m2.id]);
    expect(await orgRepo.countMembers(testOrgId)).toBe(2);

    // After member removal, invite is now allowed
    const okReq = new NextRequest('http://localhost:3000/api/invitations', {
      method: 'POST',
      body: JSON.stringify({ email: `m_ok_${Date.now()}@example.com`, role: 'member' }),
    });
    const okRes = await invitationsRoute.POST(okReq);
    expect(okRes.status).toBe(201);
  });

  it('9. Bulk invite with 2 valid + 1 duplicate/existing member → creates valid and reports failure', async () => {
    // Set plan to Pro so seat limits scale to accommodate bulk invitations
    await query(
      `INSERT INTO organization_plans (organization_id, plan_id, status, current_period_end)
       VALUES ($1, 'pro', 'active', NOW() + INTERVAL '30 days')
       ON CONFLICT (organization_id) DO UPDATE SET plan_id = 'pro', status = 'active'`,
      [testOrgId]
    );
    invalidatePlanCache(testOrgId);

    const emailA = `bulk_a_${Date.now()}@example.com`;
    const emailB = `bulk_b_${Date.now()}@example.com`;
    const emailC = `bulk_c_${Date.now()}@example.com`;

    // Add emailA as already existing member
    const existingUser = await userRepo.create({
      email: emailA,
      fullName: 'Existing User',
      passwordHash: 'dummy_hash',
    });
    await query('INSERT INTO organization_members (organization_id, user_id, role) VALUES ($1, $2, $3)', [testOrgId, existingUser.id, 'member']);

    // Attempt bulk invite: emailA (already member), emailB (valid), emailC (valid)
    const targets = [emailA, emailB, emailC];

    const results: { created: number; failed: { email: string; reason: string }[] } = {
      created: 0,
      failed: [],
    };

    for (const targetEmail of targets) {
      const postReq = new NextRequest('http://localhost:3000/api/invitations', {
        method: 'POST',
        body: JSON.stringify({ email: targetEmail, role: 'member' }),
      });
      const res = await invitationsRoute.POST(postReq);
      const data = await res.json();
      if (res.status === 201 && data.success) {
        results.created++;
      } else {
        results.failed.push({ email: targetEmail, reason: data.error?.code || 'FAILED' });
      }
    }

    // 2 created (emailB, emailC), 1 failed (emailA was already member)
    expect(results.created).toBe(2);
    expect(results.failed).toHaveLength(1);
    expect(results.failed[0].email).toBe(emailA);
    expect(results.failed[0].reason).toBe('ALREADY_MEMBER');
  });
});
