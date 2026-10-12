import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { query } from '../lib/db';
import { orgRepo } from '../lib/db/repositories/org-repo';
import { userRepo } from '../lib/db/repositories/user-repo';
import { invitationRepo } from '../lib/db/repositories/invitation-repo';
import { createInvitation } from '../lib/services/invitation-service';
import * as authMiddleware from '../lib/auth/middleware';
import * as resendRoute from '../app/api/invitations/[id]/resend/route';
import * as revokeRoute from '../app/api/invitations/[id]/revoke/route';

describe('Prompt 24: API /api/invitations/[id]/resend and /revoke', () => {
  let orgAId: string;
  let orgBId: string;
  let ownerAId: string;
  let memberAId: string;
  let ownerBId: string;
  let inviteAId: string;

  beforeEach(async () => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    // Users
    const ownerA = await userRepo.create({
      email: `owner_a_${id}@example.com`,
      fullName: 'Owner Org A',
      passwordHash: 'dummy_hash',
    });
    ownerAId = ownerA.id;

    const memberA = await userRepo.create({
      email: `member_a_${id}@example.com`,
      fullName: 'Member Org A',
      passwordHash: 'dummy_hash',
    });
    memberAId = memberA.id;

    const ownerB = await userRepo.create({
      email: `owner_b_${id}@example.com`,
      fullName: 'Owner Org B',
      passwordHash: 'dummy_hash',
    });
    ownerBId = ownerB.id;

    // Organizations
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

    // Add memberA to Org A
    await orgRepo.addMember(orgAId, memberAId, 'member');

    // Create an invitation in Org A
    const inv = await createInvitation(
      { userId: ownerAId, orgId: orgAId },
      { email: `invitee_${id}@example.com`, role: 'member' }
    );
    expect(inv.success).toBe(true);
    if (inv.success) {
      inviteAId = inv.invitation.id;
    }
  });

  it('1. Owner resend returns 200, updated invitation, and NO token or token_hash', async () => {
    vi.spyOn(authMiddleware, 'getAuthFromRequest').mockReturnValue({
      userId: ownerAId,
      email: 'owner_a@example.com',
      role: 'user',
      orgId: orgAId,
    });

    const req = new NextRequest(`http://localhost:3000/api/invitations/${inviteAId}/resend`, {
      method: 'POST',
    });
    const res = await resendRoute.POST(req, { params: Promise.resolve({ id: inviteAId }) });
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data?.invitation?.id).toBe(inviteAId);

    // Verify token and token_hash are never present
    const jsonStr = JSON.stringify(body);
    expect(jsonStr).not.toContain('token_hash');
    expect(body.data?.token).toBeUndefined();
    expect(body.data?.rawToken).toBeUndefined();
    expect(body.data?.invitation?.token_hash).toBeUndefined();
  });

  it('2. Member caller returns 403 Forbidden for resend and revoke', async () => {
    vi.spyOn(authMiddleware, 'getAuthFromRequest').mockReturnValue({
      userId: memberAId,
      email: 'member_a@example.com',
      role: 'user',
      orgId: orgAId,
    });

    // Resend as member
    const resendReq = new NextRequest(`http://localhost:3000/api/invitations/${inviteAId}/resend`, {
      method: 'POST',
    });
    const resendRes = await resendRoute.POST(resendReq, { params: Promise.resolve({ id: inviteAId }) });
    expect(resendRes.status).toBe(403);

    // Revoke as member
    const revokeReq = new NextRequest(`http://localhost:3000/api/invitations/${inviteAId}/revoke`, {
      method: 'POST',
    });
    const revokeRes = await revokeRoute.POST(revokeReq, { params: Promise.resolve({ id: inviteAId }) });
    expect(revokeRes.status).toBe(403);
  });

  it('3. Other organization caller returns 404 for resend and revoke', async () => {
    // Org B owner tries to resend or revoke Org A's invitation
    vi.spyOn(authMiddleware, 'getAuthFromRequest').mockReturnValue({
      userId: ownerBId,
      email: 'owner_b@example.com',
      role: 'user',
      orgId: orgBId,
    });

    const resendReq = new NextRequest(`http://localhost:3000/api/invitations/${inviteAId}/resend`, {
      method: 'POST',
    });
    const resendRes = await resendRoute.POST(resendReq, { params: Promise.resolve({ id: inviteAId }) });
    expect(resendRes.status).toBe(404);

    const revokeReq = new NextRequest(`http://localhost:3000/api/invitations/${inviteAId}/revoke`, {
      method: 'POST',
    });
    const revokeRes = await revokeRoute.POST(revokeReq, { params: Promise.resolve({ id: inviteAId }) });
    expect(revokeRes.status).toBe(404);
  });

  it('4. Revoke returns 200, then resend returns 409 Conflict', async () => {
    vi.spyOn(authMiddleware, 'getAuthFromRequest').mockReturnValue({
      userId: ownerAId,
      email: 'owner_a@example.com',
      role: 'user',
      orgId: orgAId,
    });

    // 1. Revoke invitation
    const revokeReq = new NextRequest(`http://localhost:3000/api/invitations/${inviteAId}/revoke`, {
      method: 'POST',
    });
    const revokeRes = await revokeRoute.POST(revokeReq, { params: Promise.resolve({ id: inviteAId }) });
    expect(revokeRes.status).toBe(200);

    const revokeBody = await revokeRes.json();
    expect(revokeBody.success).toBe(true);
    expect(revokeBody.data?.invitation?.status).toBe('revoked');
    expect(JSON.stringify(revokeBody)).not.toContain('token_hash');

    // 2. Resend revoked invitation -> must return 409
    const resendReq = new NextRequest(`http://localhost:3000/api/invitations/${inviteAId}/resend`, {
      method: 'POST',
    });
    const resendRes = await resendRoute.POST(resendReq, { params: Promise.resolve({ id: inviteAId }) });
    expect(resendRes.status).toBe(409);
    const resendBody = await resendRes.json();
    expect(resendBody.success).toBe(false);
  });
});
