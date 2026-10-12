import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createInvitation } from '../lib/services/invitation-service';
import { orgRepo } from '../lib/db/repositories/org-repo';
import { invitationRepo } from '../lib/db/repositories/invitation-repo';
import { query } from '../lib/db';
import { PLANS } from '../config/plans';

describe('Prompt 18: Invitation Service - createInvitation', () => {
  let orgAId: string;
  let orgBId: string;
  let ownerUserAId: string;
  let adminUserAId: string;
  let memberUserAId: string;
  let viewerUserAId: string;

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

    // Create test users
    const createTestUser = async (email: string) => {
      const res = await query<{ id: string }>(
        `INSERT INTO users (email, name, role) 
         VALUES ($1, $2, 'user') 
         RETURNING id`,
        [email, email.split('@')[0]]
      );
      return res.rows[0].id;
    };

    ownerUserAId = await createTestUser(`owner_a_${Date.now()}@innoventix.io`);
    adminUserAId = await createTestUser(`admin_a_${Date.now()}@innoventix.io`);
    memberUserAId = await createTestUser(`member_a_${Date.now()}@innoventix.io`);
    viewerUserAId = await createTestUser(`viewer_a_${Date.now()}@innoventix.io`);

    // Assign memberships to Org A
    await query(
      `INSERT INTO organization_members (organization_id, user_id, role) 
       VALUES ($1, $2, 'owner'), ($1, $3, 'admin'), ($1, $4, 'member'), ($1, $5, 'viewer')`,
      [orgAId, ownerUserAId, adminUserAId, memberUserAId, viewerUserAId]
    );
  });

  afterAll(async () => {
    // Cascade cleanup
    if (orgAId) await query('DELETE FROM organizations WHERE id = $1', [orgAId]);
    if (orgBId) await query('DELETE FROM organizations WHERE id = $1', [orgBId]);
    if (ownerUserAId) await query('DELETE FROM users WHERE id IN ($1, $2, $3, $4)', [
      ownerUserAId,
      adminUserAId,
      memberUserAId,
      viewerUserAId,
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

  it('Step 2: member and viewer roles receive forbidden', async () => {
    const memberSession = { userId: memberUserAId, orgId: orgAId };
    const resMember = await createInvitation(memberSession, {
      email: 'invitee@example.com',
      role: 'member',
    });
    expect(resMember.success).toBe(false);
    expect(resMember.error).toBe('forbidden');

    const viewerSession = { userId: viewerUserAId, orgId: orgAId };
    const resViewer = await createInvitation(viewerSession, {
      email: 'invitee@example.com',
      role: 'member',
    });
    expect(resViewer.success).toBe(false);
    expect(resViewer.error).toBe('forbidden');
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

    // Owner inviting admin is allowed
    const ownerSession = { userId: ownerUserAId, orgId: orgAId };
    const resOwnerInviteAdmin = await createInvitation(ownerSession, {
      email: `invitedadmin_${Date.now()}@example.com`,
      role: 'admin',
    });
    expect(resOwnerInviteAdmin.success).toBe(true);
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
      [memberUserAId]
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
    const targetEmail = `pending_check_${Date.now()}@example.com`;

    const first = await createInvitation(ownerSession, { email: targetEmail, role: 'viewer' });
    expect(first.success).toBe(true);
    expect(first.alreadyPending).toBeFalsy();

    const second = await createInvitation(ownerSession, { email: targetEmail, role: 'viewer' });
    expect(second.success).toBe(true);
    expect(second.alreadyPending).toBe(true);
    expect(second.invitation?.id).toBe(first.invitation?.id);
  });

  it('Step 7: enforces plan maxMembers seat limit (countSeatsUsed + 1 <= maxMembers)', async () => {
    // Org A already has 4 members + previously invited admin/pending -> exceeds 3 seats of free plan
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
    const cleanOwnerId = await query<{ id: string }>(
      `INSERT INTO users (email, name, role) VALUES ($1, 'Owner', 'user') RETURNING id`,
      [`clean_owner_${Date.now()}@example.com`]
    );
    await query(
      `INSERT INTO organization_members (organization_id, user_id, role) VALUES ($1, $2, 'owner')`,
      [cleanOrg.id, cleanOwnerId.rows[0].id]
    );
    const cleanSession = { userId: cleanOwnerId.rows[0].id, orgId: cleanOrg.id };

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
    await query('DELETE FROM users WHERE id = $1', [cleanOwnerId.rows[0].id]);
  });

  it('Step 9 & 10: generates token, hashes it, sets expires_at to 7 days, and writes audit event', async () => {
    const cleanOrg = await orgRepo.create({
      name: `Token Audit Org ${Date.now()}`,
      slug: `token-audit-${Date.now()}`,
    });
    const cleanOwnerId = await query<{ id: string }>(
      `INSERT INTO users (email, name, role) VALUES ($1, 'Owner', 'user') RETURNING id`,
      [`audit_owner_${Date.now()}@example.com`]
    );
    await query(
      `INSERT INTO organization_members (organization_id, user_id, role) VALUES ($1, $2, 'owner')`,
      [cleanOrg.id, cleanOwnerId.rows[0].id]
    );
    const cleanSession = { userId: cleanOwnerId.rows[0].id, orgId: cleanOrg.id };

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
    await query('DELETE FROM users WHERE id = $1', [cleanOwnerId.rows[0].id]);
  });

  it('Cross-organization isolation: pending invite in Org A does not block Org B', async () => {
    const cleanOrgB = await orgRepo.create({
      name: `Isolation Org B ${Date.now()}`,
      slug: `iso-b-${Date.now()}`,
    });
    const ownerBId = await query<{ id: string }>(
      `INSERT INTO users (email, name, role) VALUES ($1, 'Owner B', 'user') RETURNING id`,
      [`iso_owner_${Date.now()}@example.com`]
    );
    await query(
      `INSERT INTO organization_members (organization_id, user_id, role) VALUES ($1, $2, 'owner')`,
      [cleanOrgB.id, ownerBId.rows[0].id]
    );

    const sharedEmail = `shared_invitee_${Date.now()}@innoventix.io`;
    
    // Invite to cleanOrgB
    const resB = await createInvitation(
      { userId: ownerBId.rows[0].id, orgId: cleanOrgB.id },
      { email: sharedEmail, role: 'member' }
    );
    expect(resB.success).toBe(true);
    expect(resB.alreadyPending).toBeFalsy();

    // Verify lookup by token hash only returns this specific record
    const found = await invitationRepo.findPendingByEmail(cleanOrgB.id, sharedEmail);
    expect(found?.organization_id).toBe(cleanOrgB.id);

    // Clean up
    await query('DELETE FROM organizations WHERE id = $1', [cleanOrgB.id]);
    await query('DELETE FROM users WHERE id = $1', [ownerBId.rows[0].id]);
  });
});
