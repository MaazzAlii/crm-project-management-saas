import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { query } from '../lib/db';
import { orgRepo } from '../lib/db/repositories/org-repo';
import { invitationRepo } from '../lib/db/repositories/invitation-repo';
import { userRepo } from '../lib/db/repositories/user-repo';
import { generateToken, hashToken } from '../lib/security/invite-token';

describe('Prompt 15: Seat Count Repository', () => {
  let testOrgId: string;
  let ownerUser: any;
  let memberUser: any;

  beforeAll(async () => {
    // Create users via userRepo
    ownerUser = await userRepo.create({
      email: `seat_owner_${Date.now()}@example.com`,
      passwordHash: 'hash',
      fullName: 'Seat Owner',
    });

    memberUser = await userRepo.create({
      email: `seat_member_${Date.now()}@example.com`,
      passwordHash: 'hash',
      fullName: 'Seat Member',
    });

    // Create organization
    const org = await orgRepo.create({
      name: `Seat Count Org ${Date.now()}`,
      slug: `seat-org-${Date.now()}`,
      ownerUserId: ownerUser.id,
    });
    testOrgId = org.id;
  });

  afterAll(async () => {
    if (testOrgId) {
      await query('DELETE FROM invitations WHERE organization_id = $1', [testOrgId]);
      await query('DELETE FROM organizations WHERE id = $1', [testOrgId]);
    }
    if (ownerUser) {
      await query('DELETE FROM users WHERE id = $1', [ownerUser.id]);
    }
    if (memberUser) {
      await query('DELETE FROM users WHERE id = $1', [memberUser.id]);
    }
  });

  it('counts members and total seats used including pending invites', async () => {
    // Currently only owner is a member
    const initialMembers = await orgRepo.countMembers(testOrgId);
    expect(initialMembers).toBe(1);

    const initialSeats = await orgRepo.countSeatsUsed(testOrgId);
    expect(initialSeats).toBe(1);

    // Add a pending invite
    const invite = await invitationRepo.insertInvitation(testOrgId, {
      email: 'pending_seat@example.com',
      role: 'member',
      tokenHash: hashToken(generateToken()),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    // Seats used should now be 2 (1 member + 1 pending invite)
    const seatsWithInvite = await orgRepo.countSeatsUsed(testOrgId);
    expect(seatsWithInvite).toBe(2);
  });

  it('removing a member frees a seat', async () => {
    // Add memberUser to organization
    await orgRepo.addMember(testOrgId, memberUser.id, 'member');
    const seatsBeforeRemove = await orgRepo.countSeatsUsed(testOrgId);

    // Remove memberUser
    const removed = await orgRepo.removeMember(testOrgId, memberUser.id);
    expect(removed).toBe(true);

    const seatsAfterRemove = await orgRepo.countSeatsUsed(testOrgId);
    expect(seatsAfterRemove).toBe(seatsBeforeRemove - 1);
  });

  it('accepting an invite moves it from pending to member without counting twice', async () => {
    const inviteEmail = `accepted_${Date.now()}@example.com`;
    const newInvitee = await userRepo.create({
      email: inviteEmail,
      passwordHash: 'hash',
      fullName: 'Invitee',
    });

    const invite = await invitationRepo.insertInvitation(testOrgId, {
      email: inviteEmail,
      role: 'member',
      tokenHash: hashToken(generateToken()),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    const seatsBeforeAccept = await orgRepo.countSeatsUsed(testOrgId);

    // Accept invite: update status from pending to accepted and add to organization_members
    await invitationRepo.updateStatus(testOrgId, invite.id, {
      status: 'accepted',
      acceptedAt: new Date(),
      acceptedBy: newInvitee.id,
    });
    await orgRepo.addMember(testOrgId, newInvitee.id, 'member');

    // Total seats used must NOT increase twice: pending went down by 1, member went up by 1
    const seatsAfterAccept = await orgRepo.countSeatsUsed(testOrgId);
    expect(seatsAfterAccept).toBe(seatsBeforeAccept);

    // Cleanup invitee
    await query('DELETE FROM users WHERE id = $1', [newInvitee.id]);
  });
});
