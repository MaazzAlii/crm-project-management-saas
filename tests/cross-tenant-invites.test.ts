import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { query } from '../lib/db';
import { orgRepo } from '../lib/db/repositories/org-repo';
import { userRepo } from '../lib/db/repositories/user-repo';
import { createInvitation, revokeInvitation } from '../lib/services/invitation-service';
import * as authMiddleware from '../lib/auth/middleware';
import * as invitationsRoute from '../app/api/invitations/route';
import * as resendRoute from '../app/api/invitations/[id]/resend/route';
import * as revokeRoute from '../app/api/invitations/[id]/revoke/route';
import * as acceptRoute from '../app/api/invitations/accept/route';

describe('Prompt 53: Security — Cross-Organization Invitations Isolation', () => {
  let orgAId: string;
  let orgBId: string;
  let ownerAId: string;
  let ownerBId: string;
  let memberAId: string;
  let inviteeEmail: string;

  beforeEach(async () => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    inviteeEmail = `invitee_${id}@example.com`;

    const ownerA = await userRepo.create({
      email: `ownerA_${id}@example.com`,
      fullName: 'Owner A',
      passwordHash: 'dummy_hash',
    });
    ownerAId = ownerA.id;

    const ownerB = await userRepo.create({
      email: `ownerB_${id}@example.com`,
      fullName: 'Owner B',
      passwordHash: 'dummy_hash',
    });
    ownerBId = ownerB.id;

    const memberA = await userRepo.create({
      email: `memberA_${id}@example.com`,
      fullName: 'Member A',
      passwordHash: 'dummy_hash',
    });
    memberAId = memberA.id;

    const orgA = await orgRepo.create({
      name: 'Org A ' + id,
      slug: 'org-a-' + id,
      ownerUserId: ownerAId,
    });
    orgAId = orgA.id;

    const orgB = await orgRepo.create({
      name: 'Org B ' + id,
      slug: 'org-b-' + id,
      ownerUserId: ownerBId,
    });
    orgBId = orgB.id;

    // Ensure owners and member are in organization_members
    await query(
      `INSERT INTO organization_members (organization_id, user_id, role)
       VALUES ($1, $2, 'owner'), ($3, $4, 'owner'), ($1, $5, 'member')
       ON CONFLICT (organization_id, user_id) DO NOTHING`,
      [orgAId, ownerAId, orgBId, ownerBId, memberAId]
    );
  });

  it('1. Org A owner cannot read Org B invitations via list endpoint', async () => {
    // Create an invitation in Org B
    const createRes = await createInvitation(
      { userId: ownerBId, orgId: orgBId },
      { email: inviteeEmail, role: 'member' }
    );
    expect(createRes.success).toBe(true);

    // Query as Org A owner
    vi.spyOn(authMiddleware, 'getAuthFromRequest').mockReturnValue({
      userId: ownerAId,
      orgId: orgAId,
      role: 'owner',
      email: 'ownerA@example.com',
    });

    const getReq = new NextRequest('http://localhost:3000/api/invitations');
    const getRes = await invitationsRoute.GET(getReq);
    expect(getRes.status).toBe(200);
    const json = await getRes.json();
    const emails = json.data.invitations.map((inv: any) => inv.email);
    expect(emails).not.toContain(inviteeEmail.toLowerCase());
  });

  it('2. Org A owner cannot resend or revoke Org B invitation IDs (404)', async () => {
    const createRes = await createInvitation(
      { userId: ownerBId, orgId: orgBId },
      { email: inviteeEmail, role: 'member' }
    );
    expect(createRes.success).toBe(true);
    const orgBInviteId = createRes.invitation!.id;

    // Simulate Org A owner session
    vi.spyOn(authMiddleware, 'getAuthFromRequest').mockReturnValue({
      userId: ownerAId,
      orgId: orgAId,
      role: 'owner',
      email: 'ownerA@example.com',
    });

    // Try resend
    const resendReq = new NextRequest(`http://localhost:3000/api/invitations/${orgBInviteId}/resend`, {
      method: 'POST',
    });
    const resendRes = await resendRoute.POST(resendReq, { params: { id: orgBInviteId } });
    expect(resendRes.status).toBe(404);

    // Try revoke
    const revokeReq = new NextRequest(`http://localhost:3000/api/invitations/${orgBInviteId}/revoke`, {
      method: 'POST',
    });
    const revokeRes = await revokeRoute.POST(revokeReq, { params: { id: orgBInviteId } });
    expect(revokeRes.status).toBe(404);
  });

  it('3. Org A regular member cannot create invitations (403)', async () => {
    vi.spyOn(authMiddleware, 'getAuthFromRequest').mockReturnValue({
      userId: memberAId,
      orgId: orgAId,
      role: 'member',
      email: 'memberA@example.com',
    });

    const postReq = new NextRequest('http://localhost:3000/api/invitations', {
      method: 'POST',
      body: JSON.stringify({ email: 'newperson@example.com', role: 'member' }),
    });
    const postRes = await invitationsRoute.POST(postReq);
    expect(postRes.status).toBe(403);
    const json = await postRes.json();
    expect(json.error.code).toBe('FORBIDDEN');
  });

  it('4. Revoked invite cannot be accepted', async () => {
    const createRes = await createInvitation(
      { userId: ownerAId, orgId: orgAId },
      { email: inviteeEmail, role: 'member' }
    );
    expect(createRes.success).toBe(true);
    const rawToken = createRes.rawToken!;
    const inviteId = createRes.invitation!.id;

    // Revoke it
    const revokeRes = await revokeInvitation(
      { userId: ownerAId, orgId: orgAId },
      inviteId
    );
    expect(revokeRes.success).toBe(true);

    // Attempt accept
    const userInvitee = await userRepo.create({
      email: inviteeEmail,
      fullName: 'Invited Person',
      passwordHash: 'pwd_hash',
    });

    vi.spyOn(authMiddleware, 'getAuthFromRequest').mockReturnValue({
      userId: userInvitee.id,
      email: inviteeEmail,
    });

    const acceptReq = new NextRequest('http://localhost:3000/api/invitations/accept', {
      method: 'POST',
      body: JSON.stringify({ token: rawToken }),
    });
    const acceptRes = await acceptRoute.POST(acceptReq);
    expect(acceptRes.status).toBe(400);
    const json = await acceptRes.json();
    expect(json.error.code).toBe('REVOKED');
  });

  it('5. Raw tokens never leak in list invitations API response', async () => {
    await createInvitation(
      { userId: ownerAId, orgId: orgAId },
      { email: 'leakcheck@example.com', role: 'member' }
    );

    vi.spyOn(authMiddleware, 'getAuthFromRequest').mockReturnValue({
      userId: ownerAId,
      orgId: orgAId,
      role: 'owner',
      email: 'ownerA@example.com',
    });

    const getReq = new NextRequest('http://localhost:3000/api/invitations');
    const getRes = await invitationsRoute.GET(getReq);
    expect(getRes.status).toBe(200);
    const json = await getRes.json();
    for (const inv of json.data.invitations) {
      expect(inv.rawToken).toBeUndefined();
      expect(inv.token).toBeUndefined();
      expect(inv.token_hash).toBeUndefined();
      expect(inv.tokenHash).toBeUndefined();
    }
  });
});
