import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { orgRepo } from '../lib/db/repositories/org-repo';
import { userRepo } from '../lib/db/repositories/user-repo';
import { invitationRepo } from '../lib/db/repositories/invitation-repo';
import { createInvitation, resendInvitation } from '../lib/services/invitation-service';
import { setEmailProvider } from '../lib/email/sender';
import * as authMiddleware from '../lib/auth/middleware';
import * as invitationsRoute from '../app/api/invitations/route';
import * as resendRoute from '../app/api/invitations/[id]/resend/route';

describe('Prompt 32: Email Failure Handling & Invite Link Retention', () => {
  let testOrgId: string;
  let ownerUserId: string;
  let ownerEmail: string;

  beforeEach(async () => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    ownerEmail = `owner_fail_${id}@example.com`;

    const owner = await userRepo.create({
      email: ownerEmail,
      fullName: 'Owner Failure Test',
      passwordHash: 'dummy_hash',
    });
    ownerUserId = owner.id;

    const org = await orgRepo.create({
      name: 'Fail Test Org ' + id,
      slug: 'fail-org-' + id,
      ownerUserId,
    });
    testOrgId = org.id;
  });

  afterEach(() => {
    setEmailProvider(null);
    vi.restoreAllMocks();
  });

  it('1. Send failure marks invitation send_failed=true without deleting or aborting the row', async () => {
    // Inject failing email provider
    setEmailProvider({
      name: 'failing-provider',
      send: async () => ({
        success: false,
        error: 'SMTP connection timed out to mail.innoventix.io',
      }),
    });

    const targetEmail = `failed_invitee_${Date.now()}@example.com`;
    const result = await createInvitation(
      {
        userId: ownerUserId,
        orgId: testOrgId,
        email: ownerEmail,
      },
      {
        email: targetEmail,
        role: 'member',
      }
    );

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.sendFailed).toBe(true);
    expect(result.invitation).toBeDefined();

    // Verify persisted record in PostgreSQL has send_failed = true
    const saved = await invitationRepo.findById(testOrgId, result.invitation.id);
    expect(saved).not.toBeNull();
    expect(saved?.send_failed).toBe(true);
    expect(saved?.status).toBe('pending');
  });

  it('2. Resend clears send_failed=false when email dispatch succeeds', async () => {
    // Step 1: Create an invitation that failed to send
    setEmailProvider({
      name: 'failing-provider',
      send: async () => ({
        success: false,
        error: 'Mailbox temporarily unavailable',
      }),
    });

    const targetEmail = `retry_invitee_${Date.now()}@example.com`;
    const createRes = await createInvitation(
      {
        userId: ownerUserId,
        orgId: testOrgId,
        email: ownerEmail,
      },
      {
        email: targetEmail,
        role: 'member',
      }
    );

    expect(createRes.success).toBe(true);
    if (!createRes.success) return;

    const initialSaved = await invitationRepo.findById(testOrgId, createRes.invitation.id);
    expect(initialSaved?.send_failed).toBe(true);

    // Step 2: Switch to working email provider and resend
    setEmailProvider({
      name: 'succeeding-provider',
      send: async () => ({
        success: true,
        messageId: '<msg-success-123@innoventix.io>',
      }),
    });

    const resendRes = await resendInvitation(
      {
        userId: ownerUserId,
        orgId: testOrgId,
        email: ownerEmail,
      },
      createRes.invitation.id
    );

    expect(resendRes.success).toBe(true);
    if (!resendRes.success) return;

    // Verify send_failed is cleared to false in DB
    const updated = await invitationRepo.findById(testOrgId, createRes.invitation.id);
    expect(updated?.send_failed).toBe(false);
  });

  it('3. Copy invite link appears ONLY in create response and NEVER in list or resend responses', async () => {
    setEmailProvider({
      name: 'succeeding-provider',
      send: async () => ({
        success: true,
        messageId: '<msg-123@innoventix.io>',
      }),
    });

    vi.spyOn(authMiddleware, 'getAuthFromRequest').mockReturnValue({
      userId: ownerUserId,
      email: ownerEmail,
      role: 'user',
      orgId: testOrgId,
    });

    // 1. POST /api/invitations (Create response)
    const targetEmail = `copylink_${Date.now()}@example.com`;
    const postReq = new NextRequest('http://localhost:3000/api/invitations', {
      method: 'POST',
      body: JSON.stringify({ email: targetEmail, role: 'member' }),
    });
    const postRes = await invitationsRoute.POST(postReq);
    expect(postRes.status).toBe(201);
    const postBody = await postRes.json();

    expect(postBody.success).toBe(true);
    expect(postBody.data.inviteLink).toBeDefined();
    expect(typeof postBody.data.inviteLink).toBe('string');
    expect(postBody.data.inviteLink).toMatch(/\/invite\/[A-Za-z0-9_-]+/);

    const inviteId = postBody.data.invitation.id;

    // 2. GET /api/invitations (List response)
    const getReq = new NextRequest('http://localhost:3000/api/invitations');
    const getRes = await invitationsRoute.GET(getReq);
    expect(getRes.status).toBe(200);
    const getBody = await getRes.json();

    expect(getBody.data.inviteLink).toBeUndefined();
    const foundInList = getBody.data.invitations.find((i: any) => i.id === inviteId);
    expect(foundInList).toBeDefined();
    expect(foundInList.inviteLink).toBeUndefined();
    expect(foundInList.token_hash).toBeUndefined();
    expect(foundInList.token).toBeUndefined();

    // 3. POST /api/invitations/[id]/resend (Resend response)
    const resendReq = new NextRequest(`http://localhost:3000/api/invitations/${inviteId}/resend`, {
      method: 'POST',
    });
    const resendRes = await resendRoute.POST(resendReq, {
      params: Promise.resolve({ id: inviteId }),
    });
    expect(resendRes.status).toBe(200);
    const resendBody = await resendRes.json();

    expect(resendBody.success).toBe(true);
    expect(resendBody.data.inviteLink).toBeUndefined();
    expect(resendBody.data.invitation.inviteLink).toBeUndefined();
    expect(resendBody.data.invitation.token_hash).toBeUndefined();
    expect(resendBody.data.invitation.token).toBeUndefined();
  });
});
