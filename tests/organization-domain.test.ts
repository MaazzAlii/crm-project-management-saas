import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { query } from '../lib/db';
import { orgRepo } from '../lib/db/repositories/org-repo';
import { userRepo } from '../lib/db/repositories/user-repo';

describe('Prompt 09: Organization Business-Domain Fields & Owner Permissions', () => {
  let testOrgId: string;
  let ownerUserId: string;
  let memberUserId: string;

  beforeAll(async () => {
    // Create test owner and member users via userRepo
    const owner = await userRepo.create({
      email: `domain_owner_${Date.now()}@example.com`,
      passwordHash: 'hash123',
      fullName: 'Owner User',
    });
    ownerUserId = owner.id;

    const member = await userRepo.create({
      email: `domain_member_${Date.now()}@example.com`,
      passwordHash: 'hash123',
      fullName: 'Member User',
    });
    memberUserId = member.id;

    // Create test organization
    const orgRes = await query<{ id: string }>(`
      INSERT INTO organizations (name, slug)
      VALUES ('Domain Test Org ${Date.now()}', 'domain-org-${Date.now()}')
      RETURNING id;
    `);
    testOrgId = orgRes.rows[0].id;

    // Add owner and member memberships
    await query(`
      INSERT INTO organization_members (organization_id, user_id, role)
      VALUES 
        ($1, $2, 'owner'),
        ($1, $3, 'member');
    `, [testOrgId, ownerUserId, memberUserId]);
  });

  afterAll(async () => {
    if (testOrgId) {
      await query('DELETE FROM organizations WHERE id = $1', [testOrgId]);
    }
    if (ownerUserId) {
      await query('DELETE FROM users WHERE id = $1', [ownerUserId]);
    }
    if (memberUserId) {
      await query('DELETE FROM users WHERE id = $1', [memberUserId]);
    }
  });

  it('verifies verified_domain and domain_verified_at columns exist on organizations table', async () => {
    const res = await query<{ column_name: string }>(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'organizations' 
        AND column_name IN ('verified_domain', 'domain_verified_at');
    `);

    expect(res.rows.length).toBe(2);
  });

  it('disallows non-owners from setting verified_domain', async () => {
    await expect(
      orgRepo.setVerifiedDomain(testOrgId, memberUserId, 'acme.com')
    ).rejects.toThrow(/Only organization owners/);
  });

  it('allows owner to set and read verified_domain', async () => {
    const updated = await orgRepo.setVerifiedDomain(testOrgId, ownerUserId, 'innoventix.io');
    expect(updated.verified_domain).toBe('innoventix.io');
    expect(updated.domain_verified_at).toBeDefined();

    const domainInfo = await orgRepo.getVerifiedDomain(testOrgId);
    expect(domainInfo?.verifiedDomain).toBe('innoventix.io');
    expect(domainInfo?.domainVerifiedAt).toBeDefined();
  });
});
