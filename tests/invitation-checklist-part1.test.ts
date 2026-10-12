import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { query } from '../lib/db';
import { userRepo } from '../lib/db/repositories/user-repo';
import { orgRepo } from '../lib/db/repositories/org-repo';
import { invitationRepo } from '../lib/db/repositories/invitation-repo';
import {
  createInvitation,
  acceptInvitation,
  revokeInvitation,
  getInvitationAcceptInfo,
} from '../lib/services/invitation-service';
import { setEmailProvider } from '../lib/email/sender';
import { handleSignUpWithInviteAction } from '../app/actions/signup';

// Mock cookies for Server Actions in test context
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    set: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
  })),
}));

describe('Prompt 03: Invitation Test Checklist - Part 1: Local Flow Verification', () => {
  let ownerUser: any;
  let testOrg: any;
  let testOrgId: string;
  let capturedConsoleLogs: string[] = [];
  const originalConsoleLog = console.log;

  beforeEach(async () => {
    capturedConsoleLogs = [];
    console.log = (...args: any[]) => {
      capturedConsoleLogs.push(args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '));
      originalConsoleLog(...args);
    };

    // Clean up any residual test invitee accounts
    await query("DELETE FROM users WHERE email LIKE 'maazalisshahid+invite%'");

    // Step 2: Fresh signup owner of a test organization (not admin)
    const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const ownerEmail = `owner_checklist_${uniqueSuffix}@example.com`;

    ownerUser = await userRepo.create({
      email: ownerEmail,
      fullName: 'Checklist Owner',
      passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmnopqr',
    });

    testOrg = await orgRepo.create({
      name: `Acme Growth ${uniqueSuffix}`,
      slug: `acme-growth-${uniqueSuffix}`,
      ownerUserId: ownerUser.id,
    });
    testOrgId = testOrg.id;
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    setEmailProvider(null);
    vi.restoreAllMocks();
  });

  it('Verifies the complete 11-step local invitation lifecycle (Steps 1 through 11)', async () => {
    const session = {
      userId: ownerUser.id,
      email: ownerUser.email,
      orgId: testOrgId,
    };

    // Step 3: Enter maazalisshahid+invite1@gmail.com, role member
    const inviteeEmail1 = 'maazalisshahid+invite1@gmail.com';
    const createResult = await createInvitation(session, {
      email: inviteeEmail1,
      role: 'member',
    });

    expect(createResult.success).toBe(true);
    if (!createResult.success) throw new Error('Create invitation failed');

    const rawToken1 = createResult.rawToken;
    const inviteId1 = createResult.invitation.id;
    expect(rawToken1).toBeDefined();
    expect(createResult.invitation.status).toBe('pending');

    // Step 4: The invite appears in Pending with status Pending
    const pendingInvites = await invitationRepo.listForOrg(testOrgId, 'pending');
    expect(pendingInvites.some((inv) => inv.id === inviteId1 && inv.status === 'pending')).toBe(true);

    // Step 5 & 6: Copy link from log and open in private window (getInvitationAcceptInfo)
    const acceptInfo = await getInvitationAcceptInfo(rawToken1);
    expect(acceptInfo.success).toBe(true);
    if (!acceptInfo.success) throw new Error('Accept info lookup failed');
    expect(acceptInfo.organizationName).toBe(testOrg.name);
    expect(acceptInfo.role).toBe('member');
    expect(acceptInfo.accountExists).toBe(false);
    expect(acceptInfo.maskedEmail).toContain('@gmail.com');

    // Step 7 & 8: Sign up with exact email; field is locked to invite email, accept joins org
    const signupInviteResult = await handleSignUpWithInviteAction({
      fullName: 'Maaz Ali Invited',
      password: 'StrongPassword123!',
      inviteToken: rawToken1,
    });

    expect(signupInviteResult.error).toBeUndefined();
    expect(signupInviteResult.redirectUrl).toBe('/dashboard');

    // Step 9: Reload Team: new member appears once, and pending row is gone
    const updatedPending = await invitationRepo.listForOrg(testOrgId, 'pending');
    expect(updatedPending.some((inv) => inv.id === inviteId1)).toBe(false);

    const members = await orgRepo.getMembers(testOrgId);
    const joinedMember = members.find((m: any) => m.email === inviteeEmail1.toLowerCase().trim());
    expect(joinedMember).toBeDefined();
    expect(joinedMember?.role).toBe('member');
    // Ensure appears exactly once
    const matchingMembers = members.filter((m: any) => m.email === inviteeEmail1.toLowerCase().trim());
    expect(matchingMembers.length).toBe(1);

    // Step 10: Try the same link again: expect a clear "already used" or "invalid" message, not a crash
    const reusedAcceptInfo = await getInvitationAcceptInfo(rawToken1);
    expect(reusedAcceptInfo.success).toBe(false);
    expect(reusedAcceptInfo.error).toBe('invalid_or_expired');
    expect(reusedAcceptInfo.status).toBe(400);

    const reuseSignupResult = await handleSignUpWithInviteAction({
      fullName: 'Imposter Attempt',
      password: 'StrongPassword123!',
      inviteToken: rawToken1,
    });
    expect(reuseSignupResult.error).toBe('This invitation is invalid or has expired.');

    // Step 11: Create a second invite, then revoke it. Its link must stop working.
    const inviteeEmail2 = 'maazalisshahid+invite2@gmail.com';
    const createResult2 = await createInvitation(session, {
      email: inviteeEmail2,
      role: 'member',
    });
    expect(createResult2.success).toBe(true);
    if (!createResult2.success) throw new Error('Create invitation 2 failed');

    const rawToken2 = createResult2.rawToken;
    const inviteId2 = createResult2.invitation.id;

    // Verify token 2 initially valid
    const preRevokeInfo = await getInvitationAcceptInfo(rawToken2);
    expect(preRevokeInfo.success).toBe(true);

    // Revoke the invite
    const revokeResult = await revokeInvitation(session, inviteId2);
    expect(revokeResult.success).toBe(true);

    // Token must stop working immediately
    const postRevokeInfo = await getInvitationAcceptInfo(rawToken2);
    expect(postRevokeInfo.success).toBe(false);
    expect(postRevokeInfo.error).toBe('invalid_or_expired');

    const revokedAcceptAttempt = await acceptInvitation(rawToken2, {
      userId: ownerUser.id,
      email: inviteeEmail2,
    });
    expect(revokedAcceptAttempt.success).toBe(false);
    expect(revokedAcceptAttempt.error).toBe('revoked');
  });
});
