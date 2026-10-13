import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { orgRepo } from '../lib/db/repositories/org-repo';
import { userRepo } from '../lib/db/repositories/user-repo';
import { clientRepo } from '../lib/db/repositories/client-repo';
import { projectRepo } from '../lib/db/repositories/project-repo';
import { query } from '../lib/db';
import { createInvitation, revokeInvitation } from '../lib/services/invitation-service';
import * as authMiddleware from '../lib/auth/middleware';
import * as invitationsRoute from '../app/api/invitations/route';
import * as revokeRoute from '../app/api/invitations/[id]/revoke/route';

describe('Prompt 51: Free Plan Limits (Seats & Pending Quota)', () => {
  let orgId: string;
  let ownerId: string;

  beforeEach(async () => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    const owner = await userRepo.create({
      email: `owner_${id}@example.com`,
      fullName: 'Owner',
      passwordHash: 'dummy_hash',
    });
    ownerId = owner.id;

    const org = await orgRepo.create({
      name: 'Free Limits Org ' + id,
      slug: 'free-limits-' + id,
      ownerUserId: ownerId,
    });
    orgId = org.id;

    await query(
      `INSERT INTO organization_members (organization_id, user_id, role)
       VALUES ($1, $2, 'owner')
       ON CONFLICT (organization_id, user_id) DO NOTHING`,
      [orgId, ownerId]
    );

    vi.spyOn(authMiddleware, 'getAuthFromRequest').mockReturnValue({
      userId: ownerId,
      orgId,
      role: 'org_admin',
      email: `owner_${id}@example.com`,
    });
  });

  it('1. Invite until the limit (3 seats including owner); the next invite returns 402 LIMIT_REACHED', async () => {
    // Member 1 (seat 2)
    const inv1 = await createInvitation(
      { userId: ownerId, orgId },
      { email: 'member1@example.com', role: 'member' }
    );
    expect(inv1.success).toBe(true);

    // Member 2 (seat 3 - max seats for Free tier is 3)
    const inv2 = await createInvitation(
      { userId: ownerId, orgId },
      { email: 'member2@example.com', role: 'member' }
    );
    expect(inv2.success).toBe(true);

    // Attempting 4th seat via API
    const postReq = new NextRequest('http://localhost:3000/api/invitations', {
      method: 'POST',
      body: JSON.stringify({ email: 'member3@example.com', role: 'member' }),
    });
    const postRes = await invitationsRoute.POST(postReq);
    expect(postRes.status).toBe(402);
    const json = await postRes.json();
    expect(json.error.code).toBe('LIMIT_REACHED');
  });

  it('2. Creating clients, projects, and tasks after reaching the seat limit succeeds', async () => {
    // Fill seats to limit
    await createInvitation({ userId: ownerId, orgId }, { email: 'm1@example.com', role: 'member' });
    await createInvitation({ userId: ownerId, orgId }, { email: 'm2@example.com', role: 'member' });

    // Verify client creation works
    const client = await clientRepo.create(orgId, {
      name: 'Limit Client',
      email: 'client@limit.com',
    });
    expect(client).toBeDefined();
    expect(client.id).toBeDefined();

    // Verify project creation works
    const project = await projectRepo.create(orgId, {
      clientId: client.id,
      title: 'Limit Project',
      amount: 1500,
    });
    expect(project).toBeDefined();
    expect(project.id).toBeDefined();

    // Verify task creation works
    const taskRes = await query<{ id: string }>(
      `INSERT INTO tasks (organization_id, project_id, title, status)
       VALUES ($1, $2, 'Limit Task', 'todo')
       RETURNING id`,
      [orgId, project.id]
    );
    expect(taskRes.rows.length).toBe(1);
  });

  it('3. Pending invitation limit (2) blocks third pending invite, but revoking one allows invite again', async () => {
    // Org starts with 1 member (owner).
    // Send 1st pending invite
    const inv1 = await createInvitation({ userId: ownerId, orgId }, { email: 'pend1@example.com', role: 'member' });
    expect(inv1.success).toBe(true);

    // Send 2nd pending invite (maxPendingInvites for Free tier is 2)
    const inv2 = await createInvitation({ userId: ownerId, orgId }, { email: 'pend2@example.com', role: 'member' });
    expect(inv2.success).toBe(true);

    // 3rd pending invite is blocked
    const postReq = new NextRequest('http://localhost:3000/api/invitations', {
      method: 'POST',
      body: JSON.stringify({ email: 'pend3@example.com', role: 'member' }),
    });
    const postRes = await invitationsRoute.POST(postReq);
    expect(postRes.status).toBe(402);

    if (!inv1.success) throw new Error('Expected inv1 to succeed');

    // Revoke one pending invitation
    const revokeReq = new NextRequest(`http://localhost:3000/api/invitations/${inv1.invitation.id}/revoke`, {
      method: 'POST',
    });
    const revokeRes = await revokeRoute.POST(revokeReq, { params: Promise.resolve({ id: inv1.invitation.id }) });
    expect(revokeRes.status).toBe(200);

    // Now invite succeeds again!
    const retryPostReq = new NextRequest('http://localhost:3000/api/invitations', {
      method: 'POST',
      body: JSON.stringify({ email: 'pend3@example.com', role: 'member' }),
    });
    const retryPostRes = await invitationsRoute.POST(retryPostReq);
    expect(retryPostRes.status).toBe(201);
  });
});
