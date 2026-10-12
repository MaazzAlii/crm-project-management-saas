import { describe, it, expect, beforeEach } from 'vitest';
import { query } from '../lib/db';
import { orgRepo } from '../lib/db/repositories/org-repo';
import { userRepo } from '../lib/db/repositories/user-repo';
import { createInvitation, acceptInvitation, revokeInvitation } from '../lib/services/invitation-service';

describe('Prompt 21: Seat Limit Enforcement Everywhere', () => {
  let testOrgId: string;
  let ownerUserId: string;
  let ownerEmail: string;

  beforeEach(async () => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    ownerEmail = `owner_seats_${id}@example.com`;

    const owner = await userRepo.create({
      email: ownerEmail,
      fullName: 'Owner User',
      passwordHash: 'dummy_hash',
    });
    ownerUserId = owner.id;

    const org = await orgRepo.create({
      name: 'Seat Enforcement Org ' + id,
      slug: 'seat-org-' + id,
      ownerUserId,
    });
    testOrgId = org.id;
  });

  it('fill a free workspace to 3 seats, try fourth invite (refused), revoke one, then invite again (allowed)', async () => {
    // Free tier: maxMembers = 3, maxPendingInvites = 2
    // Currently 1 owner = 1 seat used
    const invite1Email = `invitee1_${Date.now()}@example.com`;
    const invite2Email = `invitee2_${Date.now()}@example.com`;
    const invite3Email = `invitee3_${Date.now()}@example.com`;

    // 1st invite: 1 owner + 1 pending = 2 seats used
    const inv1 = await createInvitation(
      { userId: ownerUserId, orgId: testOrgId },
      { email: invite1Email, role: 'member' }
    );
    expect(inv1.success).toBe(true);

    // 2nd invite: 1 owner + 2 pending = 3 seats used (workspace full!)
    const inv2 = await createInvitation(
      { userId: ownerUserId, orgId: testOrgId },
      { email: invite2Email, role: 'member' }
    );
    expect(inv2.success).toBe(true);

    // 3rd invite (attempt 4th seat): refused because 3/3 seats are used and maxPending (2) reached
    const inv3 = await createInvitation(
      { userId: ownerUserId, orgId: testOrgId },
      { email: invite3Email, role: 'member' }
    );
    expect(inv3.success).toBe(false);
    if (!inv3.success) {
      expect(['seat_limit', 'pending_limit', 'LIMIT_REACHED']).toContain(inv3.error);
    }

    // Revoke one invitation
    if (inv2.success) {
      const revoked = await revokeInvitation(
        { userId: ownerUserId, orgId: testOrgId },
        inv2.invitation.id
      );
      expect(revoked.success).toBe(true);
    }

    // Now seats used is 1 owner + 1 pending = 2 seats used. Try inviting again -> allowed!
    const invAgain = await createInvitation(
      { userId: ownerUserId, orgId: testOrgId },
      { email: invite3Email, role: 'member' }
    );
    expect(invAgain.success).toBe(true);
  });

  it('accept is refused when org is full at acceptance time, with clear message to upgrade', async () => {
    // 1 owner = 1 member
    const inviteeEmail = `invitee_full_${Date.now()}@example.com`;
    const invitee = await userRepo.create({
      email: inviteeEmail,
      fullName: 'Pending Invitee',
      passwordHash: 'dummy_hash',
    });

    // Create invitation while org only has 1 member
    const inv = await createInvitation(
      { userId: ownerUserId, orgId: testOrgId },
      { email: inviteeEmail, role: 'member' }
    );
    expect(inv.success).toBe(true);
    if (!inv.success) return;

    // Now fill the org with 2 more active members (making 3 active members: owner + 2 members = 3/3)
    const extraUser1 = await userRepo.create({
      email: `extra1_${Date.now()}@example.com`,
      fullName: 'Extra User 1',
      passwordHash: 'dummy_hash',
    });
    const extraUser2 = await userRepo.create({
      email: `extra2_${Date.now()}@example.com`,
      fullName: 'Extra User 2',
      passwordHash: 'dummy_hash',
    });

    await orgRepo.addMember(testOrgId, extraUser1.id, 'member');
    await orgRepo.addMember(testOrgId, extraUser2.id, 'member');

    // Verify 3 active members exist
    const memberCountRes = await query(
      `SELECT count(*) as count FROM organization_members WHERE organization_id = $1`,
      [testOrgId]
    );
    expect(parseInt(memberCountRes.rows[0].count, 10)).toBe(3);

    // Invitee now attempts to accept invitation
    const acceptRes = await acceptInvitation(inv.rawToken, {
      userId: invitee.id,
      email: invitee.email,
    });

    // Must be refused!
    expect(acceptRes.success).toBe(false);
    if (!acceptRes.success) {
      expect(acceptRes.error).toBe('seat_limit_reached');
      expect(acceptRes.status).toBe(403);
      expect(acceptRes.message).toMatch(/maximum seat limit|upgrade/i);
    }

    // Ensure member was NOT silently added
    const memberCheck = await query(
      `SELECT 1 FROM organization_members WHERE organization_id = $1 AND user_id = $2`,
      [testOrgId, invitee.id]
    );
    expect(memberCheck.rows.length).toBe(0);

    // Ensure invitation is NOT marked accepted
    const inviteCheck = await query(
      `SELECT status FROM invitations WHERE id = $1`,
      [inv.invitation.id]
    );
    expect(inviteCheck.rows[0].status).toBe('pending');
  });
});
