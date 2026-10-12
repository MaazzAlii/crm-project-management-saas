import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  createInvitation,
  resendInvitation,
  revokeInvitation,
} from '../lib/services/invitation-service';
import { orgRepo } from '../lib/db/repositories/org-repo';
import { userRepo } from '../lib/db/repositories/user-repo';
import { invitationRepo } from '../lib/db/repositories/invitation-repo';
import { hashToken } from '../lib/security/invite-token';
import { canAccept } from '../lib/invitations/status';
import { query } from '../lib/db';

describe('Prompt 19: Invitation Service - resendInvitation and revokeInvitation', () => {
  let orgAId: string;
  let orgBId: string;
  let ownerUserAId: string;
  let adminUserAId: string;
  let memberUserAId: string;
  let ownerUserBId: string;

  beforeAll(async () => {
    // Create test organizations
    const orgA = await orgRepo.create({
      name: `Resend Revoke Org A ${Date.now()}`,
      slug: `resend-org-a-${Date.now()}`,
    });
    orgAId = orgA.id;

    const orgB = await orgRepo.create({
      name: `Resend Revoke Org B ${Date.now()}`,
      slug: `resend-org-b-${Date.now()}`,
    });
    orgBId = orgB.id;

    // Create users via userRepo
    const ownerA = await userRepo.create({
      email: `owner_a_${Date.now()}@innoventix.io`,
      fullName: 'Owner A',
      passwordHash: 'hash123',
    });
    ownerUserAId = ownerA.id;

    const adminA = await userRepo.create({
      email: `admin_a_${Date.now()}@innoventix.io`,
      fullName: 'Admin A',
      passwordHash: 'hash123',
    });
    adminUserAId = adminA.id;

    const memberA = await userRepo.create({
      email: `member_a_${Date.now()}@innoventix.io`,
      fullName: 'Member A',
      passwordHash: 'hash123',
    });
    memberUserAId = memberA.id;

    const ownerB = await userRepo.create({
      email: `owner_b_${Date.now()}@innoventix.io`,
      fullName: 'Owner B',
      passwordHash: 'hash123',
    });
    ownerUserBId = ownerB.id;

    // Assign memberships
    await query(
      `INSERT INTO organization_members (organization_id, user_id, role) 
       VALUES ($1, $2, 'owner'), ($1, $3, 'admin'), ($1, $4, 'member')`,
      [orgAId, ownerUserAId, adminUserAId, memberUserAId]
    );

    // Set Org A to Pro plan for sufficient seat headroom across lifecycle tests
    await query(
      `UPDATE organization_plans SET plan_id = 'pro' WHERE organization_id = $1`,
      [orgAId]
    );

    await query(
      `INSERT INTO organization_members (organization_id, user_id, role) 
       VALUES ($1, $2, 'owner')`,
      [orgBId, ownerUserBId]
    );
  });

  afterAll(async () => {
    if (orgAId) await query('DELETE FROM organizations WHERE id = $1', [orgAId]);
    if (orgBId) await query('DELETE FROM organizations WHERE id = $1', [orgBId]);
    if (ownerUserAId) await query('DELETE FROM users WHERE id IN ($1, $2, $3, $4)', [
      ownerUserAId,
      adminUserAId,
      memberUserAId,
      ownerUserBId,
    ]);
  });

  it('resend: invalidates old token so old link immediately fails, resets expiry, and writes invite.resent audit log', async () => {
    const ownerSession = { userId: ownerUserAId, orgId: orgAId };
    const email = `resend_target_${Date.now()}@example.com`;

    // 1. Create invitation
    const created = await createInvitation(ownerSession, { email, role: 'member' });
    expect(created.success).toBe(true);
    const oldRawToken = created.rawToken!;
    const oldTokenHash = hashToken(oldRawToken);
    const inviteId = created.invitation!.id;

    // Verify lookup by old hash finds record
    const foundOld = await invitationRepo.findByTokenHash(oldTokenHash);
    expect(foundOld?.id).toBe(inviteId);

    // 2. Resend invitation
    const resent = await resendInvitation(ownerSession, inviteId);
    expect(resent.success).toBe(true);
    expect(resent.rawToken).toBeDefined();
    expect(resent.rawToken).not.toBe(oldRawToken);
    const newRawToken = resent.rawToken!;
    const newTokenHash = hashToken(newRawToken);

    // 3. Old link immediately fails
    const lookupOldAfterResend = await invitationRepo.findByTokenHash(oldTokenHash);
    expect(lookupOldAfterResend).toBeNull();

    // 4. New link works
    const lookupNew = await invitationRepo.findByTokenHash(newTokenHash);
    expect(lookupNew?.id).toBe(inviteId);
    expect(lookupNew?.status).toBe('pending');

    // 5. Audit event logged
    const auditRes = await query<{ action: string }>(
      `SELECT action FROM audit_logs 
       WHERE organization_id = $1 AND action = 'invite.resent'`,
      [orgAId]
    );
    expect(auditRes.rows.length).toBeGreaterThan(0);
  });

  it('revoke: sets status=revoked and revoked_at; link immediately stops working, writes invite.revoked audit log', async () => {
    const ownerSession = { userId: ownerUserAId, orgId: orgAId };
    const email = `revoke_target_${Date.now()}@example.com`;

    // 1. Create invitation
    const created = await createInvitation(ownerSession, { email, role: 'viewer' });
    expect(created.success).toBe(true);
    const rawToken = created.rawToken!;
    const tokenHash = hashToken(rawToken);
    const inviteId = created.invitation!.id;

    // 2. Revoke invitation
    const revoked = await revokeInvitation(ownerSession, inviteId);
    expect(revoked.success).toBe(true);
    expect(revoked.invitation?.status).toBe('revoked');
    expect(revoked.invitation?.revoked_at).not.toBeNull();

    // 3. Lookup confirms status is revoked and canAccept returns false
    const lookup = await invitationRepo.findByTokenHash(tokenHash);
    expect(lookup?.status).toBe('revoked');
    expect(canAccept(lookup!)).toBe(false);

    // 4. Audit event logged
    const auditRes = await query<{ action: string }>(
      `SELECT action FROM audit_logs 
       WHERE organization_id = $1 AND action = 'invite.revoked'`,
      [orgAId]
    );
    expect(auditRes.rows.length).toBeGreaterThan(0);
  });

  it('permissions: a member role cannot revoke an invitation (returns forbidden)', async () => {
    const ownerSession = { userId: ownerUserAId, orgId: orgAId };
    const created = await createInvitation(ownerSession, {
      email: `member_revoke_${Date.now()}@example.com`,
      role: 'viewer',
    });
    expect(created.success).toBe(true);
    const inviteId = created.invitation!.id;

    const memberSession = { userId: memberUserAId, orgId: orgAId };
    const res = await revokeInvitation(memberSession, inviteId);
    expect(res.success).toBe(false);
    expect(res.error).toBe('forbidden');
  });

  it('permissions: a member role cannot resend an invitation (returns forbidden)', async () => {
    const ownerSession = { userId: ownerUserAId, orgId: orgAId };
    const created = await createInvitation(ownerSession, {
      email: `member_resend_${Date.now()}@example.com`,
      role: 'viewer',
    });
    expect(created.success).toBe(true);
    const inviteId = created.invitation!.id;

    const memberSession = { userId: memberUserAId, orgId: orgAId };
    const res = await resendInvitation(memberSession, inviteId);
    expect(res.success).toBe(false);
    expect(res.error).toBe('forbidden');
  });

  it('tenant isolation: attempting to resend or revoke another organization invitation returns not found', async () => {
    // Create invite in Org A
    const ownerSessionA = { userId: ownerUserAId, orgId: orgAId };
    const createdA = await createInvitation(ownerSessionA, {
      email: `isolation_target_${Date.now()}@example.com`,
      role: 'member',
    });
    expect(createdA.success).toBe(true);
    const inviteAId = createdA.invitation!.id;

    // Owner of Org B attempts to resend Org A's invite
    const ownerSessionB = { userId: ownerUserBId, orgId: orgBId };
    const resendCross = await resendInvitation(ownerSessionB, inviteAId);
    expect(resendCross.success).toBe(false);
    expect(resendCross.error).toBe('not_found');

    // Owner of Org B attempts to revoke Org A's invite
    const revokeCross = await revokeInvitation(ownerSessionB, inviteAId);
    expect(revokeCross.success).toBe(false);
    expect(revokeCross.error).toBe('not_found');
  });
});
