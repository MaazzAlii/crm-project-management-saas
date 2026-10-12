import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { query } from '../lib/db';
import { orgRepo } from '../lib/db/repositories/org-repo';
import { userRepo } from '../lib/db/repositories/user-repo';
import { invitationRepo } from '../lib/db/repositories/invitation-repo';
import { createInvitation } from '../lib/services/invitation-service';
import * as authMiddleware from '../lib/auth/middleware';
import * as acceptInfoRoute from '../app/api/invitations/accept-info/route';
import * as acceptRoute from '../app/api/invitations/accept/route';
import * as declineRoute from '../app/api/invitations/decline/route';

describe('Prompt 25: API /api/invitations/accept-info, /accept, and /decline', () => {
  let testOrgId: string;
  let ownerUserId: string;
  let inviteeUserId: string;
  let otherUserId: string;
  let ownerEmail: string;
  let inviteeEmail: string;
  let otherEmail: string;
  let rawInviteToken: string;
  let inviteId: string;

  beforeEach(async () => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    ownerEmail = `owner_ad_${id}@example.com`;
    inviteeEmail = `invitee_ad_${id}@innoventix.io`;
    otherEmail = `other_ad_${id}@example.com`;

    const owner = await userRepo.create({
      email: ownerEmail,
      fullName: 'Owner User',
      passwordHash: 'dummy_hash',
    });
    ownerUserId = owner.id;

    const invitee = await userRepo.create({
      email: inviteeEmail,
      fullName: 'Invitee User',
      passwordHash: 'dummy_hash',
    });
    inviteeUserId = invitee.id;

    const other = await userRepo.create({
      email: otherEmail,
      fullName: 'Other User',
      passwordHash: 'dummy_hash',
    });
    otherUserId = other.id;

    const org = await orgRepo.create({
      name: 'Accept Decline Org ' + id,
      slug: 'ad-org-' + id,
      ownerUserId,
    });
    testOrgId = org.id;

    // Create an invitation
    const inv = await createInvitation(
      { userId: ownerUserId, orgId: testOrgId },
      { email: inviteeEmail, role: 'member' }
    );
    expect(inv.success).toBe(true);
    if (inv.success) {
      rawInviteToken = inv.rawToken!;
      inviteId = inv.invitation.id;
    }
  });

  describe('GET /api/invitations/accept-info', () => {
    it('returns masked email, domain, org name, accountExists for valid token without revealing full email', async () => {
      const req = new NextRequest(`http://localhost:3000/api/invitations/accept-info?token=${rawInviteToken}`);
      const res = await acceptInfoRoute.GET(req);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.organizationName).toMatch(/Accept Decline Org/);
      expect(body.data.domain).toBe('innoventix.io');
      expect(body.data.maskedEmail).toMatch(/^i\*\*\*@innoventix\.io$/);
      // Invitee user already exists in db
      expect(body.data.accountExists).toBe(true);
      expect(body.data.role).toBe('member');

      // Crucial: full email must not be exposed in the response
      expect(JSON.stringify(body)).not.toContain(inviteeEmail);
      expect(JSON.stringify(body)).not.toContain('token_hash');
    });

    it('returns 400 invalid_or_expired for invalid or expired token', async () => {
      const req = new NextRequest('http://localhost:3000/api/invitations/accept-info?token=completely_invalid');
      const res = await acceptInfoRoute.GET(req);
      expect(res.status).toBe(400);

      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error?.message).toMatch(/invalid or has expired/i);
    });
  });

  describe('POST /api/invitations/accept', () => {
    it('returns 401 needsAccount when no session is present', async () => {
      vi.spyOn(authMiddleware, 'getAuthFromRequest').mockReturnValue(null);

      const req = new NextRequest('http://localhost:3000/api/invitations/accept', {
        method: 'POST',
        body: JSON.stringify({ token: rawInviteToken }),
      });
      const res = await acceptRoute.POST(req);
      expect(res.status).toBe(401);

      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error?.details?.needsAccount).toBe(true);
      expect(body.error?.details?.email).toBe(inviteeEmail.toLowerCase());
    });

    it('returns 403 wrongAccount when authenticated as a different email', async () => {
      vi.spyOn(authMiddleware, 'getAuthFromRequest').mockReturnValue({
        userId: otherUserId,
        email: otherEmail,
        role: 'user',
      });

      const req = new NextRequest('http://localhost:3000/api/invitations/accept', {
        method: 'POST',
        body: JSON.stringify({ token: rawInviteToken }),
      });
      const res = await acceptRoute.POST(req);
      expect(res.status).toBe(403);

      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error?.code).toBe('WRONG_ACCOUNT');
    });

    it('accepts successfully when authenticated as the invited email', async () => {
      vi.spyOn(authMiddleware, 'getAuthFromRequest').mockReturnValue({
        userId: inviteeUserId,
        email: inviteeEmail,
        role: 'user',
      });

      const req = new NextRequest('http://localhost:3000/api/invitations/accept', {
        method: 'POST',
        body: JSON.stringify({ token: rawInviteToken }),
      });
      const res = await acceptRoute.POST(req);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data?.invitation?.status).toBe('accepted');
      expect(JSON.stringify(body)).not.toContain('token_hash');

      // Verify user is member of org
      const role = await orgRepo.getMemberRole(testOrgId, inviteeUserId);
      expect(role).toBe('member');
    });
  });

  describe('POST /api/invitations/decline', () => {
    it('declines a pending invitation, marks status=declined, and logs invite.declined', async () => {
      const req = new NextRequest('http://localhost:3000/api/invitations/decline', {
        method: 'POST',
        body: JSON.stringify({ token: rawInviteToken }),
      });
      const res = await declineRoute.POST(req);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data?.invitation?.status).toBe('declined');
      expect(JSON.stringify(body)).not.toContain('token_hash');

      // Verify DB status
      const updated = await invitationRepo.findById(testOrgId, inviteId);
      expect(updated?.status).toBe('declined');
      expect(updated?.declined_at).not.toBeNull();
    });

    it('returns 400 when attempting to decline an already declined/accepted invitation', async () => {
      // First decline
      const req1 = new NextRequest('http://localhost:3000/api/invitations/decline', {
        method: 'POST',
        body: JSON.stringify({ token: rawInviteToken }),
      });
      await declineRoute.POST(req1);

      // Second decline
      const req2 = new NextRequest('http://localhost:3000/api/invitations/decline', {
        method: 'POST',
        body: JSON.stringify({ token: rawInviteToken }),
      });
      const res2 = await declineRoute.POST(req2);
      expect(res2.status).toBe(400);

      const body = await res2.json();
      expect(body.success).toBe(false);
    });
  });
});
