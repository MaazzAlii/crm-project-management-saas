import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { query } from '../lib/db';
import { invitationRepo } from '../lib/db/repositories/invitation-repo';
import { generateToken, hashToken } from '../lib/security/invite-token';

describe('Prompt 13: Invitation Repository & Multi-Tenancy Enforcement', () => {
  let orgA: string;
  let orgB: string;
  let userA: string;

  beforeAll(async () => {
    // Create Org A and Org B
    const orgARes = await query<{ id: string }>(`
      INSERT INTO organizations (name, slug)
      VALUES ('Repo Org A ${Date.now()}', 'repo-org-a-${Date.now()}')
      RETURNING id;
    `);
    orgA = orgARes.rows[0].id;

    const orgBRes = await query<{ id: string }>(`
      INSERT INTO organizations (name, slug)
      VALUES ('Repo Org B ${Date.now()}', 'repo-org-b-${Date.now()}')
      RETURNING id;
    `);
    orgB = orgBRes.rows[0].id;

    // Create user in Org A
    const userRes = await query<{ id: string }>(`
      INSERT INTO users (email, password_hash, role)
      VALUES ('repo_user_${Date.now()}@example.com', 'hash', 'user')
      RETURNING id;
    `);
    userA = userRes.rows[0].id;
  });

  afterAll(async () => {
    if (orgA) {
      await query('DELETE FROM invitations WHERE organization_id = $1', [orgA]);
      await query('DELETE FROM organizations WHERE id = $1', [orgA]);
    }
    if (orgB) {
      await query('DELETE FROM invitations WHERE organization_id = $1', [orgB]);
      await query('DELETE FROM organizations WHERE id = $1', [orgB]);
    }
    if (userA) {
      await query('DELETE FROM users WHERE id = $1', [userA]);
    }
  });

  it('inserts and finds pending invitation by email', async () => {
    const rawToken = generateToken();
    const hash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invite = await invitationRepo.insertInvitation(orgA, {
      email: '  Alice@EXAMPLE.com  ',
      role: 'member',
      tokenHash: hash,
      invitedBy: userA,
      expiresAt,
    });

    expect(invite).toBeDefined();
    expect(invite.email).toBe('alice@example.com');
    expect(invite.organization_id).toBe(orgA);
    expect(invite.status).toBe('pending');

    // Find pending by email (case-insensitive & trimmed)
    const found = await invitationRepo.findPendingByEmail(orgA, 'ALICE@example.com');
    expect(found).toBeDefined();
    expect(found?.id).toBe(invite.id);

    // Another org cannot find Org A's pending invite
    const notFoundInOrgB = await invitationRepo.findPendingByEmail(orgB, 'alice@example.com');
    expect(notFoundInOrgB).toBeNull();
  });

  it('findByTokenHash locates invitation by hash', async () => {
    const rawToken = generateToken();
    const hash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invite = await invitationRepo.insertInvitation(orgA, {
      email: 'bob@example.com',
      role: 'viewer',
      tokenHash: hash,
      expiresAt,
    });

    const found = await invitationRepo.findByTokenHash(hash);
    expect(found).toBeDefined();
    expect(found?.id).toBe(invite.id);
    expect(found?.email).toBe('bob@example.com');
  });

  it('listForOrg never returns another org rows', async () => {
    const hashA = hashToken(generateToken());
    const hashB = hashToken(generateToken());
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await invitationRepo.insertInvitation(orgA, {
      email: 'member_a@example.com',
      role: 'member',
      tokenHash: hashA,
      expiresAt,
    });

    await invitationRepo.insertInvitation(orgB, {
      email: 'member_b@example.com',
      role: 'admin',
      tokenHash: hashB,
      expiresAt,
    });

    const listA = await invitationRepo.listForOrg(orgA);
    const listB = await invitationRepo.listForOrg(orgB);

    expect(listA.every((inv) => inv.organization_id === orgA)).toBe(true);
    expect(listA.some((inv) => inv.email === 'member_a@example.com')).toBe(true);
    expect(listA.some((inv) => inv.email === 'member_b@example.com')).toBe(false);

    expect(listB.every((inv) => inv.organization_id === orgB)).toBe(true);
    expect(listB.some((inv) => inv.email === 'member_b@example.com')).toBe(true);
    expect(listB.some((inv) => inv.email === 'member_a@example.com')).toBe(false);
  });

  it('updateStatus with another org id returns not found, protecting tenant isolation', async () => {
    const hash = hashToken(generateToken());
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invite = await invitationRepo.insertInvitation(orgA, {
      email: 'charlie@example.com',
      role: 'member',
      tokenHash: hash,
      expiresAt,
    });

    // Attempt to update Org A's invitation using Org B's ID
    const crossTenantUpdate = await invitationRepo.updateStatus(orgB, invite.id, {
      status: 'revoked',
      revokedAt: new Date(),
    });

    expect(crossTenantUpdate).toBeNull();

    // Verify invitation in Org A is still pending
    const stillPending = await invitationRepo.findPendingByEmail(orgA, 'charlie@example.com');
    expect(stillPending?.status).toBe('pending');

    // Update with correct Org A ID succeeds
    const legitUpdate = await invitationRepo.updateStatus(orgA, invite.id, {
      status: 'revoked',
      revokedAt: new Date(),
    });

    expect(legitUpdate).toBeDefined();
    expect(legitUpdate?.status).toBe('revoked');
  });

  it('countPending accurately returns only pending invitations for the organization', async () => {
    const countA = await invitationRepo.countPending(orgA);
    expect(countA).toBeGreaterThanOrEqual(1);

    const countB = await invitationRepo.countPending(orgB);
    expect(countB).toBeGreaterThanOrEqual(1);
  });
});
