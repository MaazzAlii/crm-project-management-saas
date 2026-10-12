import { describe, it, expect, beforeEach } from 'vitest';
import { query, transaction } from '../lib/db';
import { orgRepo } from '../lib/db/repositories/org-repo';
import { userRepo } from '../lib/db/repositories/user-repo';
import { invitationRepo } from '../lib/db/repositories/invitation-repo';
import { createInvitation, acceptInvitation } from '../lib/services/invitation-service';

describe('Prompt 20: Invitation Service - acceptInvitation', () => {
  let testOrgId: string;
  let ownerUserId: string;
  let inviteeUserId: string;
  let otherUserId: string;
  let ownerEmail: string;
  let inviteeEmail: string;
  let otherUserEmail: string;

  beforeEach(async () => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    ownerEmail = `owner_accept_${id}@example.com`;
    inviteeEmail = `invitee_accept_${id}@example.com`;
    otherUserEmail = `other_user_${id}@example.com`;

    // Setup owner user
    const owner = await userRepo.create({
      email: ownerEmail,
      fullName: 'Owner User',
      passwordHash: 'dummy_hash',
    });
    ownerUserId = owner.id;

    // Setup invitee user
    const invitee = await userRepo.create({
      email: inviteeEmail,
      fullName: 'Invitee User',
      passwordHash: 'dummy_hash',
    });
    inviteeUserId = invitee.id;

    // Setup other user for wrong-account tests
    const other = await userRepo.create({
      email: otherUserEmail,
      fullName: 'Other User',
      passwordHash: 'dummy_hash',
    });
    otherUserId = other.id;

    // Setup organization
    const org = await orgRepo.create({
      name: 'Accept Test Org ' + Date.now(),
      slug: 'accept-test-org-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
      ownerUserId,
    });
    testOrgId = org.id;
  });

  it('1. invalid token returns invalid_or_expired (same as expired so attackers cannot tell)', async () => {
    const res = await acceptInvitation('completely_bogus_token_12345', {
      userId: inviteeUserId,
      email: inviteeEmail,
    });

    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error).toBe('invalid_or_expired');
      expect(res.status).toBe(400);
      expect(res.message).toMatch(/invalid or has expired/i);
    }
  });

  it('2. expired invitation returns invalid_or_expired', async () => {
    const created = await createInvitation(
      { userId: ownerUserId, orgId: testOrgId },
      { email: inviteeEmail, role: 'member' }
    );
    expect(created.success).toBe(true);
    if (!created.success) return;

    // Manually expire the invitation in db
    await query(
      `UPDATE invitations SET expires_at = NOW() - INTERVAL '1 day' WHERE id = $1`,
      [created.invitation.id]
    );

    const res = await acceptInvitation(created.rawToken, {
      userId: inviteeUserId,
      email: inviteeEmail,
    });

    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error).toBe('invalid_or_expired');
      expect(res.status).toBe(400);
      expect(res.message).toMatch(/invalid or has expired/i);
    }
  });

  it('3. revoked invitation returns revoked status', async () => {
    const created = await createInvitation(
      { userId: ownerUserId, orgId: testOrgId },
      { email: inviteeEmail, role: 'member' }
    );
    expect(created.success).toBe(true);
    if (!created.success) return;

    await invitationRepo.updateStatus(testOrgId, created.invitation.id, {
      status: 'revoked',
      revokedAt: new Date(),
    });

    const res = await acceptInvitation(created.rawToken, {
      userId: inviteeUserId,
      email: inviteeEmail,
    });

    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error).toBe('revoked');
      expect(res.status).toBe(400);
      expect(res.message).toMatch(/revoked/i);
    }
  });

  it('4. no session returns needsAccount with invitation email so UI can lock email input', async () => {
    const created = await createInvitation(
      { userId: ownerUserId, orgId: testOrgId },
      { email: inviteeEmail, role: 'member' }
    );
    expect(created.success).toBe(true);
    if (!created.success) return;

    const res = await acceptInvitation(created.rawToken, null);

    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error).toBe('needs_account');
      expect((res as any).needsAccount).toBe(true);
      expect((res as any).email).toBe(inviteeEmail.toLowerCase());
    }
  });

  it('5. wrong account logged in returns wrongAccount error', async () => {
    const created = await createInvitation(
      { userId: ownerUserId, orgId: testOrgId },
      { email: inviteeEmail, role: 'member' }
    );
    expect(created.success).toBe(true);
    if (!created.success) return;

    // Logged in as other user instead of invited user
    const res = await acceptInvitation(created.rawToken, {
      userId: otherUserId,
      email: otherUserEmail,
    });

    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error).toBe('wrong_account');
      expect(res.status).toBe(403);
      expect((res as any).expectedEmail).toBe(inviteeEmail.toLowerCase());
      expect((res as any).currentEmail).toBe(otherUserEmail.toLowerCase());
      expect(res.message).toMatch(/wrong account/i);
    }
  });

  it('6. successful accept: adds member, marks invitation accepted, logs audit event', async () => {
    const created = await createInvitation(
      { userId: ownerUserId, orgId: testOrgId },
      { email: inviteeEmail, role: 'viewer' }
    );
    expect(created.success).toBe(true);
    if (!created.success) return;

    const res = await acceptInvitation(created.rawToken, {
      userId: inviteeUserId,
      email: inviteeEmail.toUpperCase(), // Case-insensitive check
    });

    expect(res.success).toBe(true);
    if (!res.success) return;

    expect(res.invitation.status).toBe('accepted');
    expect(res.invitation.accepted_by).toBe(inviteeUserId);
    expect(res.invitation.accepted_at).not.toBeNull();

    // Verify membership row in organization_members
    const role = await orgRepo.getMemberRole(testOrgId, inviteeUserId);
    expect(role).toBe('viewer');

    // Verify audit log
    const auditRes = await query(
      `SELECT * FROM audit_logs 
       WHERE organization_id = $1 AND action = 'invite.accepted' AND actor_id = $2`,
      [testOrgId, inviteeUserId]
    );
    expect(auditRes.rows.length).toBeGreaterThanOrEqual(1);
  });

  it('7. one-time use: second accept fails with already_accepted error', async () => {
    const created = await createInvitation(
      { userId: ownerUserId, orgId: testOrgId },
      { email: inviteeEmail, role: 'member' }
    );
    expect(created.success).toBe(true);
    if (!created.success) return;

    // First accept succeeds
    const firstAccept = await acceptInvitation(created.rawToken, {
      userId: inviteeUserId,
      email: inviteeEmail,
    });
    expect(firstAccept.success).toBe(true);

    // Second accept attempt fails
    const secondAccept = await acceptInvitation(created.rawToken, {
      userId: inviteeUserId,
      email: inviteeEmail,
    });
    expect(secondAccept.success).toBe(false);
    if (!secondAccept.success) {
      expect(secondAccept.error).toBe('already_accepted');
      expect(secondAccept.status).toBe(400);
      expect(secondAccept.message).toMatch(/already been accepted/i);
    }
  });

  it('8. user already a member: marks invite accepted and returns success without duplicate row', async () => {
    // Add invitee as member prior to accepting
    await orgRepo.addMember(testOrgId, inviteeUserId, 'member');

    const created = await createInvitation(
      { userId: ownerUserId, orgId: testOrgId },
      { email: inviteeEmail, role: 'member' }
    );
    expect(created.success).toBe(true);
    if (!created.success) return;

    const res = await acceptInvitation(created.rawToken, {
      userId: inviteeUserId,
      email: inviteeEmail,
    });

    expect(res.success).toBe(true);
    if (!res.success) return;

    expect(res.invitation.status).toBe('accepted');

    // Check membership count: exactly 1 for this user in this org
    const memberCheck = await query(
      `SELECT count(*) as count FROM organization_members 
       WHERE organization_id = $1 AND user_id = $2`,
      [testOrgId, inviteeUserId]
    );
    expect(parseInt(memberCheck.rows[0].count, 10)).toBe(1);
  });

  it('9. concurrent double-accept: creates exactly one membership with no duplicate error', async () => {
    const created = await createInvitation(
      { userId: ownerUserId, orgId: testOrgId },
      { email: inviteeEmail, role: 'member' }
    );
    expect(created.success).toBe(true);
    if (!created.success) return;

    // Fire 2 accept calls simultaneously
    const [res1, res2] = await Promise.all([
      acceptInvitation(created.rawToken, {
        userId: inviteeUserId,
        email: inviteeEmail,
      }),
      acceptInvitation(created.rawToken, {
        userId: inviteeUserId,
        email: inviteeEmail,
      }),
    ]);

    // Exactly one should succeed, or if both succeed due to idempotency, exactly 1 membership row exists
    const successCount = [res1.success, res2.success].filter(Boolean).length;
    expect(successCount).toBeGreaterThanOrEqual(1);

    // Verify database has exactly 1 membership
    const memberCheck = await query(
      `SELECT count(*) as count FROM organization_members 
       WHERE organization_id = $1 AND user_id = $2`,
      [testOrgId, inviteeUserId]
    );
    expect(parseInt(memberCheck.rows[0].count, 10)).toBe(1);

    // Verify invitation is marked accepted
    const inviteCheck = await query(
      `SELECT status FROM invitations WHERE id = $1`,
      [created.invitation.id]
    );
    expect(inviteCheck.rows[0].status).toBe('accepted');
  });
});
