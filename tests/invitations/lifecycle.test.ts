import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { query } from '../../lib/db';
import { orgRepo } from '../../lib/db/repositories/org-repo';
import { userRepo } from '../../lib/db/repositories/user-repo';
import { invitationRepo } from '../../lib/db/repositories/invitation-repo';
import { createInvitation, resendInvitation, revokeInvitation } from '../../lib/services/invitation-service';
import { setEmailProvider } from '../../lib/email/sender';
import * as authMiddleware from '../../lib/auth/middleware';
import * as invitationsRoute from '../../app/api/invitations/route';
import * as resendRoute from '../../app/api/invitations/[id]/resend/route';
import * as revokeRoute from '../../app/api/invitations/[id]/revoke/route';
import * as acceptRoute from '../../app/api/invitations/accept/route';
import * as acceptInfoRoute from '../../app/api/invitations/accept-info/route';

describe('TEAM-1: Invite Lifecycle & Delivery Regression Tests', () => {
  let testOrgId: string;
  let ownerUserId: string;
  let inviteeUserId: string;
  let ownerEmail: string;
  let inviteeEmail: string;

  beforeEach(async () => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    ownerEmail = `owner_team1_${id}@example.com`;
    inviteeEmail = `invitee_team1_${id}@innoventix.io`;

    const owner = await userRepo.create({
      email: ownerEmail,
      fullName: 'Team1 Owner',
      passwordHash: 'dummy_hash',
    });
    ownerUserId = owner.id;

    const invitee = await userRepo.create({
      email: inviteeEmail,
      fullName: 'Team1 Invitee',
      passwordHash: 'dummy_hash',
    });
    inviteeUserId = invitee.id;

    const org = await orgRepo.create({
      name: 'Team1 Org ' + id,
      slug: 'team1-org-' + id,
      ownerUserId,
    });
    testOrgId = org.id;

    // Default mock auth as owner
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
  });

  it('1. Create invite → token row exists with expires_at ~7 days out', async () => {
    const targetEmail = `member_exp_${Date.now()}@innoventix.io`;
    const postReq = new NextRequest('http://localhost:3000/api/invitations', {
      method: 'POST',
      body: JSON.stringify({ email: targetEmail, role: 'member' }),
    });

    const res = await invitationsRoute.POST(postReq);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);

    const inviteId = body.data?.invitation?.id;
    expect(inviteId).toBeDefined();

    const dbRow = await invitationRepo.findById(testOrgId, inviteId);
    expect(dbRow).not.toBeNull();
    expect(dbRow?.token_hash).toBeDefined();
    expect(dbRow?.token_hash.length).toBe(64); // SHA-256 hex length

    const expiresAt = new Date(dbRow!.expires_at).getTime();
    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    // Must be ~7 days out (within 60 seconds tolerance)
    expect(Math.abs(expiresAt - (now + sevenDaysMs))).toBeLessThan(60000);
  });

  it('2. Accept with a valid token → 200 + user added to org', async () => {
    const created = await createInvitation(
      { userId: ownerUserId, orgId: testOrgId },
      { email: inviteeEmail, role: 'member' }
    );
    expect(created.success).toBe(true);
    if (!created.success || !created.rawToken) throw new Error('Invite creation failed');

    // Authenticate as invited user
    vi.spyOn(authMiddleware, 'getAuthFromRequest').mockReturnValue({
      userId: inviteeUserId,
      email: inviteeEmail,
      role: 'user',
      orgId: testOrgId,
    });

    const acceptReq = new NextRequest('http://localhost:3000/api/invitations/accept', {
      method: 'POST',
      body: JSON.stringify({ token: created.rawToken }),
    });

    const res = await acceptRoute.POST(acceptReq);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data?.invitation?.status).toBe('accepted');

    // Confirm member row in DB
    const role = await orgRepo.getMemberRole(testOrgId, inviteeUserId);
    expect(role).toBe('member');
  });

  it('3. Accept with an expired token → 410 with "expired" message (not 500)', async () => {
    const created = await createInvitation(
      { userId: ownerUserId, orgId: testOrgId },
      { email: inviteeEmail, role: 'viewer' }
    );
    expect(created.success).toBe(true);
    if (!created.success || !created.rawToken) throw new Error('Invite creation failed');

    // Backdate expires_at to 2 hours in the past
    await query(
      `UPDATE invitations SET expires_at = NOW() - INTERVAL '2 hours' WHERE id = $1`,
      [created.invitation.id]
    );

    // 1. Check accept-info route returns 410
    const infoReq = new NextRequest(`http://localhost:3000/api/invitations/accept-info?token=${created.rawToken}`);
    const infoRes = await acceptInfoRoute.GET(infoReq);
    expect(infoRes.status).toBe(410);
    const infoBody = await infoRes.json();
    expect(infoBody.success).toBe(false);
    expect(infoBody.error?.code).toBe('EXPIRED');
    expect(infoBody.error?.message).toMatch(/expired/i);

    // 2. Check accept route returns 410
    vi.spyOn(authMiddleware, 'getAuthFromRequest').mockReturnValue({
      userId: inviteeUserId,
      email: inviteeEmail,
      role: 'user',
    });

    const acceptReq = new NextRequest('http://localhost:3000/api/invitations/accept', {
      method: 'POST',
      body: JSON.stringify({ token: created.rawToken }),
    });

    const acceptRes = await acceptRoute.POST(acceptReq);
    expect(acceptRes.status).toBe(410);
    const acceptBody = await acceptRes.json();
    expect(acceptBody.success).toBe(false);
    expect(acceptBody.error?.code).toBe('EXPIRED');
    expect(acceptBody.error?.message).toMatch(/expired/i);
  });

  it('4. Accept with a random invalid token → 400', async () => {
    vi.spyOn(authMiddleware, 'getAuthFromRequest').mockReturnValue({
      userId: inviteeUserId,
      email: inviteeEmail,
      role: 'user',
    });

    const acceptReq = new NextRequest('http://localhost:3000/api/invitations/accept', {
      method: 'POST',
      body: JSON.stringify({ token: 'completely_random_bogus_token_12345' }),
    });

    const res = await acceptRoute.POST(acceptReq);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error?.code).toBe('INVALID_OR_EXPIRED');
  });

  it('5. Resend invite → old token no longer works', async () => {
    const created = await createInvitation(
      { userId: ownerUserId, orgId: testOrgId },
      { email: inviteeEmail, role: 'member' }
    );
    expect(created.success).toBe(true);
    if (!created.success || !created.rawToken) throw new Error('Create invitation failed');
    const tokenA = created.rawToken;

    // Resend invite
    const resendReq = new NextRequest(`http://localhost:3000/api/invitations/${created.invitation.id}/resend`, {
      method: 'POST',
    });
    const resendRes = await resendRoute.POST(resendReq, {
      params: Promise.resolve({ id: created.invitation.id }),
    });
    expect(resendRes.status).toBe(200);

    // Attempt accept with Token A
    vi.spyOn(authMiddleware, 'getAuthFromRequest').mockReturnValue({
      userId: inviteeUserId,
      email: inviteeEmail,
      role: 'user',
    });

    const acceptReq = new NextRequest('http://localhost:3000/api/invitations/accept', {
      method: 'POST',
      body: JSON.stringify({ token: tokenA }),
    });

    const acceptRes = await acceptRoute.POST(acceptReq);
    expect(acceptRes.status).toBe(400);
    const acceptBody = await acceptRes.json();
    expect(acceptBody.success).toBe(false);
    expect(acceptBody.error?.code).toBe('INVALID_OR_EXPIRED');
  });

  it('6. Resend invite → new token works', async () => {
    const created = await createInvitation(
      { userId: ownerUserId, orgId: testOrgId },
      { email: inviteeEmail, role: 'member' }
    );
    expect(created.success).toBe(true);
    if (!created.success || !created.rawToken) throw new Error('Create invitation failed');

    // Resend with returnLink=true
    const resendReq = new NextRequest(
      `http://localhost:3000/api/invitations/${created.invitation.id}/resend?returnLink=true`,
      {
        method: 'POST',
      }
    );
    const resendRes = await resendRoute.POST(resendReq, {
      params: Promise.resolve({ id: created.invitation.id }),
    });
    expect(resendRes.status).toBe(200);
    const resendBody = await resendRes.json();
    expect(resendBody.success).toBe(true);
    expect(resendBody.data?.inviteLink).toBeDefined();

    // Extract token B from inviteLink
    const inviteLink = resendBody.data.inviteLink;
    const tokenB = inviteLink.split('/invite/')[1];
    expect(tokenB).toBeDefined();

    // Accept with Token B
    vi.spyOn(authMiddleware, 'getAuthFromRequest').mockReturnValue({
      userId: inviteeUserId,
      email: inviteeEmail,
      role: 'user',
    });

    const acceptReq = new NextRequest('http://localhost:3000/api/invitations/accept', {
      method: 'POST',
      body: JSON.stringify({ token: tokenB }),
    });

    const acceptRes = await acceptRoute.POST(acceptReq);
    expect(acceptRes.status).toBe(200);
    const acceptBody = await acceptRes.json();
    expect(acceptBody.success).toBe(true);
    expect(acceptBody.data?.invitation?.status).toBe('accepted');
  });

  it('7. Revoke invite → subsequent accept with that token → 400', async () => {
    const created = await createInvitation(
      { userId: ownerUserId, orgId: testOrgId },
      { email: inviteeEmail, role: 'member' }
    );
    expect(created.success).toBe(true);
    if (!created.success || !created.rawToken) throw new Error('Create invitation failed');
    const rawToken = created.rawToken;

    // Revoke invitation
    const revokeReq = new NextRequest(`http://localhost:3000/api/invitations/${created.invitation.id}/revoke`, {
      method: 'POST',
    });
    const revokeRes = await revokeRoute.POST(revokeReq, {
      params: Promise.resolve({ id: created.invitation.id }),
    });
    expect(revokeRes.status).toBe(200);

    // Verify revoked in DB
    const dbRow = await invitationRepo.findById(testOrgId, created.invitation.id);
    expect(dbRow?.status).toBe('revoked');

    // Attempt accept
    vi.spyOn(authMiddleware, 'getAuthFromRequest').mockReturnValue({
      userId: inviteeUserId,
      email: inviteeEmail,
      role: 'user',
    });

    const acceptReq = new NextRequest('http://localhost:3000/api/invitations/accept', {
      method: 'POST',
      body: JSON.stringify({ token: rawToken }),
    });

    const acceptRes = await acceptRoute.POST(acceptReq);
    expect(acceptRes.status).toBe(400);
    const acceptBody = await acceptRes.json();
    expect(acceptBody.success).toBe(false);
    expect(acceptBody.error?.code).toBe('REVOKED');
  });

  it('8. Revoke invite API returns JSON even on error (never HTML)', async () => {
    // 1. Non-existent ID error
    const bogusReq = new NextRequest('http://localhost:3000/api/invitations/00000000-0000-0000-0000-000000000000/revoke', {
      method: 'POST',
    });
    const bogusRes = await revokeRoute.POST(bogusReq, {
      params: Promise.resolve({ id: '00000000-0000-0000-0000-000000000000' }),
    });

    expect(bogusRes.headers.get('content-type')).toContain('application/json');
    expect(bogusRes.status).toBe(404);
    const bogusBody = await bogusRes.json();
    expect(bogusBody.success).toBe(false);
    expect(bogusBody.error).toBeDefined();

    // 2. Unauthenticated error
    vi.spyOn(authMiddleware, 'getAuthFromRequest').mockReturnValue(null);
    const unauthReq = new NextRequest('http://localhost:3000/api/invitations/some-id/revoke', {
      method: 'POST',
    });
    const unauthRes = await revokeRoute.POST(unauthReq, {
      params: Promise.resolve({ id: 'some-id' }),
    });

    expect(unauthRes.headers.get('content-type')).toContain('application/json');
    expect(unauthRes.status).toBe(401);
    const unauthBody = await unauthRes.json();
    expect(unauthBody.success).toBe(false);
  });

  it('9. Copy link (Option B) → regenerate endpoint issues new token and invalidates old', async () => {
    const created = await createInvitation(
      { userId: ownerUserId, orgId: testOrgId },
      { email: inviteeEmail, role: 'member' }
    );
    expect(created.success).toBe(true);
    if (!created.success || !created.rawToken) throw new Error('Create invitation failed');
    const oldToken = created.rawToken;

    // Call resend with returnLink=true to simulate "Regenerate & Copy"
    const regenReq = new NextRequest(
      `http://localhost:3000/api/invitations/${created.invitation.id}/resend?returnLink=true`,
      {
        method: 'POST',
        body: JSON.stringify({ returnLink: true }),
      }
    );
    const regenRes = await resendRoute.POST(regenReq, {
      params: Promise.resolve({ id: created.invitation.id }),
    });

    expect(regenRes.status).toBe(200);
    const regenBody = await regenRes.json();
    expect(regenBody.success).toBe(true);
    expect(regenBody.data?.inviteLink).toBeDefined();
    expect(regenBody.data.inviteLink).toMatch(/\/invite\/[A-Za-z0-9_-]+/);

    const newToken = regenBody.data.inviteLink.split('/invite/')[1];
    expect(newToken).not.toBe(oldToken);

    // Old token must fail
    vi.spyOn(authMiddleware, 'getAuthFromRequest').mockReturnValue({
      userId: inviteeUserId,
      email: inviteeEmail,
      role: 'user',
    });

    const oldReq = new NextRequest('http://localhost:3000/api/invitations/accept', {
      method: 'POST',
      body: JSON.stringify({ token: oldToken }),
    });
    const oldRes = await acceptRoute.POST(oldReq);
    expect(oldRes.status).toBe(400);

    // New token must succeed
    const newReq = new NextRequest('http://localhost:3000/api/invitations/accept', {
      method: 'POST',
      body: JSON.stringify({ token: newToken }),
    });
    const newRes = await acceptRoute.POST(newReq);
    expect(newRes.status).toBe(200);
  });

  it('10. Create invite with sendEmail throwing → API still returns 200/201 (anti-enumeration / no crash)', async () => {
    // Configure failing provider
    setEmailProvider({
      name: 'failing-test-provider',
      send: async () => {
        throw new Error('Simulated SMTP connection timeout to mailcow');
      },
    });

    const targetEmail = `safe_anti_enum_${Date.now()}@example.com`;
    const postReq = new NextRequest('http://localhost:3000/api/invitations', {
      method: 'POST',
      body: JSON.stringify({ email: targetEmail, role: 'viewer' }),
    });

    const res = await invitationsRoute.POST(postReq);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data?.sendFailed).toBe(true);
    expect(body.data?.warning).toMatch(/notification email could not be delivered/i);
    expect(body.data?.invitation).toBeDefined();
    expect(body.data?.invitation?.send_failed).toBe(true);
  });
});
