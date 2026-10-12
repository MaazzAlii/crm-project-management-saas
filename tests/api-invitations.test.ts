import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { query } from '../lib/db';
import { orgRepo } from '../lib/db/repositories/org-repo';
import { userRepo } from '../lib/db/repositories/user-repo';
import { invitationRepo } from '../lib/db/repositories/invitation-repo';
import * as authMiddleware from '../lib/auth/middleware';
import * as invitationsRoute from '../app/api/invitations/route';

describe('Prompt 23: API /api/invitations (Create & List)', () => {
  let testOrgId: string;
  let ownerUserId: string;
  let memberUserId: string;
  let ownerEmail: string;
  let memberEmail: string;

  beforeEach(async () => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    ownerEmail = `owner_api_${id}@example.com`;
    memberEmail = `member_api_${id}@example.com`;

    const owner = await userRepo.create({
      email: ownerEmail,
      fullName: 'API Owner User',
      passwordHash: 'dummy_hash',
    });
    ownerUserId = owner.id;

    const member = await userRepo.create({
      email: memberEmail,
      fullName: 'API Member User',
      passwordHash: 'dummy_hash',
    });
    memberUserId = member.id;

    const org = await orgRepo.create({
      name: 'API Test Org ' + id,
      slug: 'api-org-' + id,
      ownerUserId,
    });
    testOrgId = org.id;

    // Add member to the org
    await orgRepo.addMember(testOrgId, memberUserId, 'member');
  });

  it('1. GET & POST return 401 without session context', async () => {
    vi.spyOn(authMiddleware, 'getAuthFromRequest').mockReturnValue(null);

    const getReq = new NextRequest('http://localhost:3000/api/invitations');
    const getRes = await invitationsRoute.GET(getReq);
    expect(getRes.status).toBe(401);

    const postReq = new NextRequest('http://localhost:3000/api/invitations', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', role: 'member' }),
    });
    const postRes = await invitationsRoute.POST(postReq);
    expect(postRes.status).toBe(401);
  });

  it('2. POST rejects unknown fields with 400 validation error', async () => {
    vi.spyOn(authMiddleware, 'getAuthFromRequest').mockReturnValue({
      userId: ownerUserId,
      email: ownerEmail,
      role: 'user',
      orgId: testOrgId,
    });

    const postReq = new NextRequest('http://localhost:3000/api/invitations', {
      method: 'POST',
      body: JSON.stringify({
        email: 'valid@example.com',
        role: 'member',
        unknownProperty: 'malicious',
      }),
    });
    const res = await invitationsRoute.POST(postReq);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it('3. POST returns 403 for member role caller', async () => {
    vi.spyOn(authMiddleware, 'getAuthFromRequest').mockReturnValue({
      userId: memberUserId,
      email: memberEmail,
      role: 'user',
      orgId: testOrgId,
    });

    const postReq = new NextRequest('http://localhost:3000/api/invitations', {
      method: 'POST',
      body: JSON.stringify({ email: 'new_invitee@example.com', role: 'member' }),
    });
    const res = await invitationsRoute.POST(postReq);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it('4. POST returns 201 for owner, and response body NEVER contains token or token_hash', async () => {
    vi.spyOn(authMiddleware, 'getAuthFromRequest').mockReturnValue({
      userId: ownerUserId,
      email: ownerEmail,
      role: 'user',
      orgId: testOrgId,
    });

    const targetEmail = `target_${Date.now()}@example.com`;
    const postReq = new NextRequest('http://localhost:3000/api/invitations', {
      method: 'POST',
      body: JSON.stringify({ email: targetEmail, role: 'viewer' }),
    });
    const res = await invitationsRoute.POST(postReq);
    expect(res.status).toBe(201);

    const body = await res.json();
    expect(body.success).toBe(true);

    // Verify token and token_hash are completely absent in the response payload
    const jsonString = JSON.stringify(body);
    expect(jsonString).not.toContain('token_hash');
    expect(body.data?.token).toBeUndefined();
    expect(body.data?.rawToken).toBeUndefined();
    expect(body.data?.invitation?.token_hash).toBeUndefined();
    expect(body.data?.invitation?.token).toBeUndefined();
  });

  it('5. POST returns 409 if invited user is already a member', async () => {
    vi.spyOn(authMiddleware, 'getAuthFromRequest').mockReturnValue({
      userId: ownerUserId,
      email: ownerEmail,
      role: 'user',
      orgId: testOrgId,
    });

    const postReq = new NextRequest('http://localhost:3000/api/invitations', {
      method: 'POST',
      body: JSON.stringify({ email: memberEmail, role: 'member' }),
    });
    const res = await invitationsRoute.POST(postReq);
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error?.code).toBe('ALREADY_MEMBER');
  });

  it('6. POST returns 402 with structured error code when seat/pending limit is reached', async () => {
    vi.spyOn(authMiddleware, 'getAuthFromRequest').mockReturnValue({
      userId: ownerUserId,
      email: ownerEmail,
      role: 'user',
      orgId: testOrgId,
    });

    // testOrg has 1 owner + 1 member = 2 members. Limit on free is 3.
    // 1st invite: brings total seats to 3 (2 members + 1 pending)
    const inv1Req = new NextRequest('http://localhost:3000/api/invitations', {
      method: 'POST',
      body: JSON.stringify({ email: `pending1_${Date.now()}@example.com`, role: 'member' }),
    });
    const inv1Res = await invitationsRoute.POST(inv1Req);
    expect(inv1Res.status).toBe(201);

    // 2nd invite: attempts 4 seats on Free plan -> must return 402
    const inv2Req = new NextRequest('http://localhost:3000/api/invitations', {
      method: 'POST',
      body: JSON.stringify({ email: `pending2_${Date.now()}@example.com`, role: 'member' }),
    });
    const inv2Res = await invitationsRoute.POST(inv2Req);
    expect(inv2Res.status).toBe(402);
    const body = await inv2Res.json();
    expect(body.success).toBe(false);
    expect(body.error?.code).toBe('LIMIT_REACHED');
  });

  it('7. GET lists invitations for session org with filtering, never returning token_hash', async () => {
    vi.spyOn(authMiddleware, 'getAuthFromRequest').mockReturnValue({
      userId: ownerUserId,
      email: ownerEmail,
      role: 'user',
      orgId: testOrgId,
    });

    // Create an invite
    const targetEmail = `get_test_${Date.now()}@example.com`;
    const postReq = new NextRequest('http://localhost:3000/api/invitations', {
      method: 'POST',
      body: JSON.stringify({ email: targetEmail, role: 'member' }),
    });
    await invitationsRoute.POST(postReq);

    // List invitations
    const getReq = new NextRequest('http://localhost:3000/api/invitations?status=pending');
    const getRes = await invitationsRoute.GET(getReq);
    expect(getRes.status).toBe(200);

    const body = await getRes.json();
    expect(body.success).toBe(true);
    const list = body.data?.invitations || body.data;
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThanOrEqual(1);

    // Ensure token_hash is never exposed in any list item
    for (const item of list) {
      expect(item.token_hash).toBeUndefined();
      expect(item.token).toBeUndefined();
    }
  });
});
