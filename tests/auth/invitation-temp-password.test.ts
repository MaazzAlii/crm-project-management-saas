import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { orgRepo } from '@/lib/db/repositories/org-repo';
import { userRepo } from '@/lib/db/repositories/user-repo';
import { invitationRepo } from '@/lib/db/repositories/invitation-repo';
import { createInvitation, acceptInvitation } from '@/lib/services/invitation-service';
import { POST as loginHandler } from '@/app/api/auth/login/route';
import { changePassword } from '@/lib/auth/change-password';
import { verifyPassword } from '@/lib/auth/password';
import { resetLoginRateLimit, resetRateLimitStore } from '@/lib/security/rate-limit';

describe('Auth Hardening Item 5: Direct Password Creation During Invite & First-Login Gate', () => {
  let testOrgId: string;
  let ownerUserId: string;
  let ownerEmail: string;

  beforeEach(async () => {
    resetRateLimitStore();
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    ownerEmail = `owner_item5_${id}@example.com`;

    // 1. Create owner user
    const owner = await userRepo.create({
      email: ownerEmail,
      fullName: 'Item5 Owner',
      passwordHash: 'dummy_hash',
    });
    ownerUserId = owner.id;

    // 2. Create organization
    const org = await orgRepo.create({
      name: 'Item5 Workspace ' + id,
      slug: 'item5-workspace-' + id,
      ownerUserId,
    });
    testOrgId = org.id;

    resetLoginRateLimit(ownerEmail);
  });

  it('1. Invite without password stores NULL temp_password_hash and require_password_change = false', async () => {
    const inviteeEmail = `invite_nopass_${Date.now()}@example.com`;

    const res = await createInvitation(
      { userId: ownerUserId, orgId: testOrgId, email: ownerEmail },
      { email: inviteeEmail, role: 'member' }
    );

    expect(res.success).toBe(true);
    if (!res.success) return;

    const storedInvite = await invitationRepo.findById(testOrgId, res.invitation.id);
    expect(storedInvite).toBeDefined();
    expect(storedInvite?.temp_password_hash).toBeNull();
    expect(storedInvite?.require_password_change).toBe(false);
  });

  it('2. Invite with weak password is rejected with status 400 and validation error message', async () => {
    const inviteeEmail = `invite_weak_${Date.now()}@example.com`;

    const res = await createInvitation(
      { userId: ownerUserId, orgId: testOrgId, email: ownerEmail },
      { email: inviteeEmail, role: 'member', password: 'weak' }
    );

    expect(res.success).toBe(false);
    if (res.success) return;

    expect(res.status).toBe(400);
    expect(res.error).toBe('invalid_password');
    expect(res.message).toContain('Password must be at least 8 characters long');
  });

  it('3. Invite with valid password stores bcrypt hash and require_password_change = true', async () => {
    const inviteeEmail = `invite_strong_${Date.now()}@example.com`;
    const tempPass = 'TempSecretPassword123!';

    const res = await createInvitation(
      { userId: ownerUserId, orgId: testOrgId, email: ownerEmail },
      { email: inviteeEmail, role: 'member', password: tempPass }
    );

    expect(res.success).toBe(true);
    if (!res.success) return;

    const storedInvite = await invitationRepo.findById(testOrgId, res.invitation.id);
    expect(storedInvite).toBeDefined();
    expect(storedInvite?.temp_password_hash).toBeDefined();
    expect(storedInvite?.temp_password_hash?.startsWith('$2')).toBe(true);
    expect(storedInvite?.require_password_change).toBe(true);

    // Verify bcrypt hash matches the password
    const isMatch = await verifyPassword(tempPass, storedInvite!.temp_password_hash!);
    expect(isMatch).toBe(true);
  });

  it('4. User logs in directly with temp password: wrong password directs to invite link', async () => {
    const inviteeEmail = `invite_direct_wrong_${Date.now()}@example.com`;
    const tempPass = 'ValidTempPassword123!';

    await createInvitation(
      { userId: ownerUserId, orgId: testOrgId, email: ownerEmail },
      { email: inviteeEmail, role: 'member', password: tempPass }
    );

    // Try logging in with wrong password
    const req = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'x-forwarded-for': '198.51.100.20' },
      body: JSON.stringify({ email: inviteeEmail, password: 'WrongPassword999!' }),
    });

    const loginRes = await loginHandler(req);
    expect(loginRes.status).toBe(401);

    const body = await loginRes.json();
    expect(body.error).toContain('Please use the invitation link sent to your email to set your password');
  });

  it('5. User logs in directly with temp password: auto-provisions, gates to change-password', async () => {
    const inviteeEmail = `invite_direct_ok_${Date.now()}@example.com`;
    const tempPass = 'ValidTempPassword123!';

    await createInvitation(
      { userId: ownerUserId, orgId: testOrgId, email: ownerEmail },
      { email: inviteeEmail, role: 'member', password: tempPass }
    );

    // Try logging in with the correct temp password
    const req = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'x-forwarded-for': '198.51.100.21' },
      body: JSON.stringify({ email: inviteeEmail, password: tempPass }),
    });

    const loginRes = await loginHandler(req);
    expect(loginRes.status).toBe(200);

    const body = await loginRes.json();
    expect(body.requirePasswordChange).toBe(true);
    expect(body.redirectTo).toBe('/auth/change-password?required=1');
    expect(body.user.email).toBe(inviteeEmail);

    // Confirm user was auto-provisioned in database
    const createdUser = await userRepo.findByEmail(inviteeEmail);
    expect(createdUser).toBeDefined();
    expect(createdUser?.require_password_change).toBe(true);

    // Confirm user was added to organization members
    const memberCheck = await query(
      `SELECT * FROM organization_members WHERE organization_id = $1 AND user_id = $2`,
      [testOrgId, createdUser!.id]
    );
    expect(memberCheck.rows.length).toBe(1);

    // Confirm invitation marked accepted
    const inviteCheck = await query(
      `SELECT status FROM invitations WHERE organization_id = $1 AND email = $2`,
      [testOrgId, inviteeEmail]
    );
    expect(inviteCheck.rows[0]?.status).toBe('accepted');
  });

  it('6. Changing password clears require_password_change flag and future logins succeed without gate', async () => {
    const userEmail = `user_gated_${Date.now()}@example.com`;
    const tempPass = 'InitialTempPass123!';
    const newPass = 'PermanentPass456!';

    await createInvitation(
      { userId: ownerUserId, orgId: testOrgId, email: ownerEmail },
      { email: userEmail, role: 'member', password: tempPass }
    );

    // First login
    const req1 = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'x-forwarded-for': '198.51.100.22' },
      body: JSON.stringify({ email: userEmail, password: tempPass }),
    });
    const loginRes1 = await loginHandler(req1);
    const body1 = await loginRes1.json();
    expect(body1.requirePasswordChange).toBe(true);

    const userId = body1.user.id;

    // Call changePassword
    const changeRes = await changePassword(userId, tempPass, newPass);
    expect(changeRes.success).toBe(true);

    // Verify flag cleared in database
    const userAfter = await userRepo.findById(userId);
    expect(userAfter?.require_password_change).toBe(false);

    // Second login with new permanent password
    const req2 = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'x-forwarded-for': '198.51.100.23' },
      body: JSON.stringify({ email: userEmail, password: newPass }),
    });
    const loginRes2 = await loginHandler(req2);
    expect(loginRes2.status).toBe(200);

    const body2 = await loginRes2.json();
    expect(body2.requirePasswordChange).toBeUndefined();
    expect(body2.redirectTo).toBeUndefined();
  });

  it('7. Accepting an invite with temp password via acceptInvitation also enforces require_password_change on user', async () => {
    const inviteeEmail = `invite_accept_flow_${Date.now()}@example.com`;
    const tempPass = 'TemporaryPassword789!';

    // Setup an existing user
    const existing = await userRepo.create({
      email: inviteeEmail,
      fullName: 'Accept Flow User',
      passwordHash: 'dummy_hash',
    });

    const created = await createInvitation(
      { userId: ownerUserId, orgId: testOrgId, email: ownerEmail },
      { email: inviteeEmail, role: 'member', password: tempPass }
    );

    expect(created.success).toBe(true);
    if (!created.success) return;

    // Accept invitation with raw token and session
    const acceptRes = await acceptInvitation(created.rawToken!, {
      userId: existing.id,
      email: inviteeEmail,
    });

    expect(acceptRes.success).toBe(true);

    // Verify users record was updated with require_password_change = true
    const userAfter = await userRepo.findById(existing.id);
    expect(userAfter?.require_password_change).toBe(true);
  });
});
