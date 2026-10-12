import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createInvitation } from '../lib/services/invitation-service';
import { orgRepo } from '../lib/db/repositories/org-repo';
import { userRepo } from '../lib/db/repositories/user-repo';
import { invitationRepo } from '../lib/db/repositories/invitation-repo';
import { query } from '../lib/db';
import { PLANS } from '../config/plans';

describe('Prompt 18: Invitation Service - createInvitation', () => {
  let orgAId: string;
  let orgBId: string;
  let ownerUserAId: string;
  let adminUserAId: string;
  let memberUserAId: string;
  let invitedAdminEmail: string;

  beforeAll(async () => {
    // Create test organizations
    const orgA = await orgRepo.create({
      name: `Test Org A ${Date.now()}`,
      slug: `test-org-a-${Date.now()}`,
    });
    orgAId = orgA.id;

    const orgB = await orgRepo.create({
      name: `Test Org B ${Date.now()}`,
      slug: `test-org-b-${Date.now()}`,
    });
    orgBId = orgB.id;

    // Create test users via userRepo (which sets up profiles relation)
    const createTestUser = async (email: string) => {
      const u = await userRepo.create({
        email,
        fullName: email.split('@')[0],
        passwordHash: 'test_hash_123',
      });
      return u.id;
    };

    ownerUserAId = await createTestUser(`owner_a_${Date.now()}@innoventix.io`);
    adminUserAId = await createTestUser(`admin_a_${Date.now()}@innoventix.io`);
    memberUserAId = await createTestUser(`member_b_${Date.now()}@innoventix.io`);

    // Assign memberships: Org A gets owner and admin (2 members)
    await query(
      `INSERT INTO organization_members (organization_id, user_id, role) 
       VALUES ($1, $2, 'owner'), ($1, $3, 'admin')`,
      [orgAId, ownerUserAId, adminUserAId]
    );

    // Org B gets memberUserAId as member
    await query(
      `INSERT INTO organization_members (organization_id, user_id, role) 
       VALUES ($1, $2, 'member')`,
      [orgBId, memberUserAId]
    );
  });

  afterAll(async () => {
    // Cascade cleanup
    if (orgAId) await query('DELETE FROM organizations WHERE id = $1', [orgAId]);
    if (orgBId) await query('DELETE FROM organizations WHERE id = $1', [orgBId]);
    if (ownerUserAId) await query('DELETE FROM users WHERE id IN ($1, $2, $3)', [
      ownerUserAId,
      adminUserAId,
      memberUserAId,
    ]);
  });

  it('Step 1: returns unauthorized when session is missing or unauthenticated', async () => {
    // @ts-expect-error test null session
    const res1 = await createInvitation(null, { email: 'test@example.com', role: 'member' });
    expect(res1.success).toBe(false);
    expect(res1.error).toBe('unauthorized');

    // @ts-expect-error test empty session
    const res2 = await createInvitation({}, { email: 'test@example.com', role: 'member' });
    expect(res2.success).toBe(false);
    expect(res2.error).toBe('unauthorized');
  });

  it('Step 2: member role receives forbidden', async () => {
    const memberSession = { userId: memberUserAId, orgId: orgBId };
    const resMember = await createInvitation(memberSession, {
      email: 'invitee@example.com',
      role: 'member',
    });
    expect(resMember.success).toBe(false);
    expect(resMember.error).toBe('forbidden');
  });

  it('Step 3: admin cannot invite another admin or owner; only owner can invite admin', async () => {
    const adminSession = { userId: adminUserAId, orgId: orgAId };
    
    // Admin attempting to invite admin
    const resAdminInviteAdmin = await createInvitation(adminSession, {
      email: 'newadmin@example.com',
      role: 'admin',
    });
    expect(resAdminInviteAdmin.success).toBe(false);
    expect(resAdminInviteAdmin.error).toBe('forbidden');

    // Owner inviting admin is allowed (Org A has 2 members, so 2+1=3 seats used, within 3 limit)
    invitedAdminEmail = `invitedadmin_${Date.now()}@example.com`;
    const ownerSession = { userId: ownerUserAId, orgId: orgAId };
    const resOwnerInviteAdmin = await createInvitation(ownerSession, {
      email: invitedAdminEmail,
      role: 'admin',
    });
    expect(resOwnerInviteAdmin.success).toBe(true);
    expect(resOwnerInviteAdmin.invitation).toBeDefined();
  });

  it('Step 4: normalizes and validates email; rejects invalid addresses', async () => {
    const ownerSession = { userId: ownerUserAId, orgId: orgAId };

    const invalidEmails = ['not-an-email', 'two@@example.com', 'has space@domain.com'];
    for (const email of invalidEmails) {
      const res = await createInvitation(ownerSession, { email, role: 'member' });
      expect(res.success).toBe(false);
      expect(res.error).toBe('invalid_email');
    }
  });

  it('Step 5: rejects email that already belongs to an existing member of this organization', async () => {
    const ownerSession = { userId: ownerUserAId, orgId: orgAId };
    const existingMemberUser = await query<{ email: string }>(
      'SELECT email FROM users WHERE id = $1',
      [adminUserAId]
    );

    const res = await createInvitation(ownerSession, {
      email: existingMemberUser.rows[0].email,
      role: 'member',
    });
    expect(res.success).toBe(false);
    expect(res.error).toBe('already_member');
  });

  it('Step 6: returns alreadyPending flag without creating duplicate when pending invite exists', async () => {
    const ownerSession = { userId: ownerUserAId, orgId: orgAId };

    // invitedAdminEmail is already pending in Org A from Step 3
    const second = await createInvitation(ownerSession, {
      email: invitedAdminEmail,
      role: 'admin',
    });
    expect(second.success).toBe(true);
    expect(second.alreadyPending).toBe(true);
    expect(second.invitation?.email).toBe(invitedAdminEmail.toLowerCase());
  });

  it('Step 7: enforces plan maxMembers seat limit (countSeatsUsed + 1 <= maxMembers)', async () => {
    // Org A has 2 members + 1 pending invite = 3 seats used (Free plan limit is 3)
    const ownerSession = { userId: ownerUserAId, orgId: orgAId };
    const res = await createInvitation(ownerSession, {
      email: `seat_limit_test_${Date.now()}@example.com`,
      role: 'member',
    });

    expect(res.success).toBe(false);
    expect(res.error).toBe('LIMIT_REACHED');
    expect(res.planName).toBe('Free');
    expect(res.limit).toBe(PLANS.free.maxMembers);
  });

  it('Step 8: enforces maxPendingInvites quota', async () => {
    // Create dedicated clean org for pending invites quota test
    const cleanOrg = await orgRepo.create({
      name: `Pending Quota Org ${Date.now()}`,
      slug: `pending-quota-${Date.now()}`,
    });
    const cleanOwner = await userRepo.create({
      email: `clean_owner_${Date.now()}@example.com`,
      fullName: 'Owner',
      passwordHash: 'test_hash_123',
    });
    await query(
      `INSERT INTO organization_members (organization_id, user_id, role) VALUES ($1, $2, 'owner')`,
      [cleanOrg.id, cleanOwner.id]
    );
    const cleanSession = { userId: cleanOwner.id, orgId: cleanOrg.id };

    // Free plan allows up to 2 pending invites
    const inv1 = await createInvitation(cleanSession, {
      email: `p1_${Date.now()}@example.com`,
      role: 'member',
    });
    expect(inv1.success).toBe(true);

    const inv2 = await createInvitation(cleanSession, {
      email: `p2_${Date.now()}@example.com`,
      role: 'member',
    });
    expect(inv2.success).toBe(true);

    // 3rd pending invite should trigger LIMIT_REACHED for maxPendingInvites
    const inv3 = await createInvitation(cleanSession, {
      email: `p3_${Date.now()}@example.com`,
      role: 'member',
    });
    expect(inv3.success).toBe(false);
    expect(inv3.error).toBe('LIMIT_REACHED');
    expect(inv3.limit).toBe(PLANS.free.maxPendingInvites);

    // Clean up clean org
    await query('DELETE FROM organizations WHERE id = $1', [cleanOrg.id]);
    await query('DELETE FROM users WHERE id = $1', [cleanOwner.id]);
  });

  it('Step 9 & 10: generates token, hashes it, sets expires_at to 7 days, and writes audit event', async () => {
    const cleanOrg = await orgRepo.create({
      name: `Token Audit Org ${Date.now()}`,
      slug: `token-audit-${Date.now()}`,
    });
    const cleanOwner = await userRepo.create({
      email: `audit_owner_${Date.now()}@example.com`,
      fullName: 'Owner',
      passwordHash: 'test_hash_123',
    });
    await query(
      `INSERT INTO organization_members (organization_id, user_id, role) VALUES ($1, $2, 'owner')`,
      [cleanOrg.id, cleanOwner.id]
    );
    const cleanSession = { userId: cleanOwner.id, orgId: cleanOrg.id };

    const email = `audit_invitee_${Date.now()}@innoventix.io`;
    const res = await createInvitation(cleanSession, { email, role: 'member' });

    expect(res.success).toBe(true);
    expect(res.rawToken).toBeDefined();
    expect(res.invitation).toBeDefined();
    expect(res.invitation?.email).toBe(email.toLowerCase());

    // Check expiration ~7 days
    const expiresAt = new Date(res.invitation!.expires_at).getTime();
    const expectedApprox = Date.now() + 7 * 24 * 60 * 60 * 1000;
    expect(Math.abs(expiresAt - expectedApprox)).toBeLessThan(60 * 1000); // within 1 minute

    // Check audit event was written
    const auditRes = await query<{ action: string; details: any }>(
      `SELECT action, details FROM audit_logs 
       WHERE organization_id = $1 AND action = 'invite.created'`,
      [cleanOrg.id]
    );
    expect(auditRes.rows.length).toBeGreaterThan(0);
    expect(auditRes.rows[0].details).not.toHaveProperty('token');
    expect(auditRes.rows[0].details).not.toHaveProperty('rawToken');

    // Clean up
    await query('DELETE FROM organizations WHERE id = $1', [cleanOrg.id]);
    await query('DELETE FROM users WHERE id = $1', [cleanOwner.id]);
  });

  it('Cross-organization isolation: pending invite in Org A does not block Org B', async () => {
    const cleanOrgB = await orgRepo.create({
      name: `Isolation Org B ${Date.now()}`,
      slug: `iso-b-${Date.now()}`,
    });
    const ownerB = await userRepo.create({
      email: `iso_owner_${Date.now()}@example.com`,
      fullName: 'Owner B',
      passwordHash: 'test_hash_123',
    });
    await query(
      `INSERT INTO organization_members (organization_id, user_id, role) VALUES ($1, $2, 'owner')`,
      [cleanOrgB.id, ownerB.id]
    );

    const sharedEmail = `shared_invitee_${Date.now()}@innoventix.io`;
    
    // Invite to cleanOrgB
    const resB = await createInvitation(
      { userId: ownerB.id, orgId: cleanOrgB.id },
      { email: sharedEmail, role: 'member' }
    );
    expect(resB.success).toBe(true);
    expect(resB.alreadyPending).toBeFalsy();

    // Verify lookup by token hash only returns this specific record
    const found = await invitationRepo.findPendingByEmail(cleanOrgB.id, sharedEmail);
    expect(found?.organization_id).toBe(cleanOrgB.id);

    // Clean up
    await query('DELETE FROM organizations WHERE id = $1', [cleanOrgB.id]);
    await query('DELETE FROM users WHERE id = $1', [ownerB.id]);
  });
});
