import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { orgRepo } from '@/lib/db/repositories/org-repo';
import { userRepo } from '@/lib/db/repositories/user-repo';
import { generateAccessToken } from '@/lib/auth/jwt';
import { setEmailProvider } from '@/lib/email/sender';
import {
  canInviteWithRole,
  canChangeRole,
  canRemoveMember,
  OrgRole,
} from '@/lib/auth/permissions';
import { orgService } from '@/lib/services/org-service';
import { createInvitation } from '@/lib/services/invitation-service';
import { PATCH, DELETE } from '@/app/api/organizations/[id]/members/route';
import { POST as invitationsPost } from '@/app/api/invitations/route';

describe('TEAM-3: Role & Removal Enforcement (Security-Critical)', () => {
  let orgId: string;
  let ownerUser: any;
  let adminUser: any;
  let admin2User: any;
  let memberUser: any;
  let viewerUser: any;
  let billingManagerUser: any;

  beforeEach(async () => {
    setEmailProvider({
      name: 'mock',
      send: async () => ({ success: true, messageId: 'mock_test_msg' }),
    });

    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    ownerUser = await userRepo.create({
      email: `owner_${id}@example.com`,
      fullName: 'Org Owner',
      passwordHash: 'dummy_hash',
    });

    const org = await orgRepo.create({
      name: `Team3 Test Org ${id}`,
      slug: `team3-test-${id}`,
      ownerUserId: ownerUser.id,
    });
    orgId = org.id;

    adminUser = await userRepo.create({
      email: `admin_${id}@example.com`,
      fullName: 'Org Admin',
      passwordHash: 'dummy_hash',
    });
    await orgRepo.addMember(orgId, adminUser.id, 'admin');

    admin2User = await userRepo.create({
      email: `admin2_${id}@example.com`,
      fullName: 'Org Admin 2',
      passwordHash: 'dummy_hash',
    });
    await orgRepo.addMember(orgId, admin2User.id, 'admin');

    memberUser = await userRepo.create({
      email: `member_${id}@example.com`,
      fullName: 'Org Member',
      passwordHash: 'dummy_hash',
    });
    await orgRepo.addMember(orgId, memberUser.id, 'member');

    viewerUser = await userRepo.create({
      email: `viewer_${id}@example.com`,
      fullName: 'Org Viewer',
      passwordHash: 'dummy_hash',
    });
    await orgRepo.addMember(orgId, viewerUser.id, 'viewer');

    billingManagerUser = await userRepo.create({
      email: `billing_${id}@example.com`,
      fullName: 'Billing Manager',
      passwordHash: 'dummy_hash',
    });
    await orgRepo.addMember(orgId, billingManagerUser.id, 'billing_manager');
  });

  // ---------------------------------------------------------------------------
  // 1. INVITATIONS PERMISSION CHECKS (Cases 1 - 9)
  // ---------------------------------------------------------------------------
  it('1. Owner invites owner → DENY (there should be one owner)', async () => {
    const res = canInviteWithRole(
      { userId: ownerUser.id, role: 'owner', orgId },
      'owner'
    );
    expect(res.allowed).toBe(false);
    expect(res.code).toBe('INSUFFICIENT_ROLE');

    // Verify through createInvitation service
    const serviceRes = await createInvitation(
      { userId: ownerUser.id, orgId, email: ownerUser.email },
      { email: 'newowner@example.com', role: 'owner' as any }
    );
    expect(serviceRes.success).toBe(false);
    expect((serviceRes as any).code).toBe('INSUFFICIENT_ROLE');
  });

  it('2. Owner invites admin → ALLOW', async () => {
    const res = canInviteWithRole(
      { userId: ownerUser.id, role: 'owner', orgId },
      'admin'
    );
    expect(res.allowed).toBe(true);

    // Create fresh org with only 1 member so Free seat limit (3) is not exceeded
    const freshOwner = await userRepo.create({
      email: `fresh_owner_${Date.now()}@example.com`,
      fullName: 'Fresh Owner',
      passwordHash: 'dummy',
    });
    const freshOrg = await orgRepo.create({
      name: `Fresh Org ${Date.now()}`,
      slug: `fresh-org-${Date.now()}`,
      ownerUserId: freshOwner.id,
    });

    const serviceRes = await createInvitation(
      { userId: freshOwner.id, orgId: freshOrg.id, email: freshOwner.email },
      { email: `newadmin_${Date.now()}@example.com`, role: 'admin' }
    );
    expect(serviceRes.success).toBe(true);
  });

  it('3. Owner invites member/viewer/billing_manager → ALLOW', async () => {
    const roles: OrgRole[] = ['member', 'viewer', 'billing_manager'];
    for (const role of roles) {
      const res = canInviteWithRole(
        { userId: ownerUser.id, role: 'owner', orgId },
        role
      );
      expect(res.allowed).toBe(true);
    }
  });

  it('4. Admin invites admin → DENY', async () => {
    const res = canInviteWithRole(
      { userId: adminUser.id, role: 'admin', orgId },
      'admin'
    );
    expect(res.allowed).toBe(false);
    expect(res.code).toBe('INSUFFICIENT_ROLE');
    expect(res.requiredRole).toBe('owner');

    // Test API route rejection
    const adminToken = generateAccessToken({
      userId: adminUser.id,
      email: adminUser.email,
      role: 'org_admin',
      orgId,
    });
    const req = new NextRequest('http://localhost:3000/api/invitations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: 'targetadmin@example.com', role: 'admin' }),
    });
    const apiRes = await invitationsPost(req);
    expect(apiRes.status).toBe(403);
    const json = await apiRes.json();
    expect(json.error.code).toBe('INSUFFICIENT_ROLE');
    expect(json.error.requiredRole).toBe('owner');
  });

  it('5. Admin invites owner → DENY', async () => {
    const res = canInviteWithRole(
      { userId: adminUser.id, role: 'admin', orgId },
      'owner'
    );
    expect(res.allowed).toBe(false);
    expect(res.code).toBe('INSUFFICIENT_ROLE');
  });

  it('6. Admin invites member/viewer/billing_manager → ALLOW', async () => {
    const roles: OrgRole[] = ['member', 'viewer', 'billing_manager'];
    for (const role of roles) {
      const res = canInviteWithRole(
        { userId: adminUser.id, role: 'admin', orgId },
        role
      );
      expect(res.allowed).toBe(true);
    }
  });

  it('7. Member invites anyone → DENY', async () => {
    const roles: OrgRole[] = ['owner', 'admin', 'member', 'viewer', 'billing_manager'];
    for (const role of roles) {
      const res = canInviteWithRole(
        { userId: memberUser.id, role: 'member', orgId },
        role
      );
      expect(res.allowed).toBe(false);
      expect(res.code).toBe('INSUFFICIENT_ROLE');
    }
  });

  it('8. Viewer invites anyone → DENY', async () => {
    const res = canInviteWithRole(
      { userId: viewerUser.id, role: 'viewer', orgId },
      'member'
    );
    expect(res.allowed).toBe(false);
    expect(res.code).toBe('INSUFFICIENT_ROLE');
  });

  it('9. Billing manager invites anyone → DENY', async () => {
    const res = canInviteWithRole(
      { userId: billingManagerUser.id, role: 'billing_manager', orgId },
      'member'
    );
    expect(res.allowed).toBe(false);
    expect(res.code).toBe('INSUFFICIENT_ROLE');
  });

  // ---------------------------------------------------------------------------
  // 2. ROLE CHANGE PERMISSION CHECKS (Cases 10 - 17)
  // ---------------------------------------------------------------------------
  it('10. Owner changes admin → member → ALLOW', async () => {
    const updated = await orgService.updateMemberRole(
      orgId,
      ownerUser.id,
      adminUser.id,
      'member'
    );
    expect(updated.role).toBe('member');
  });

  it('11. Owner demotes another owner → ALLOW (leaves one owner)', async () => {
    // Add second owner
    const owner2 = await userRepo.create({
      email: `owner2_${Date.now()}@example.com`,
      fullName: 'Co Owner',
      passwordHash: 'dummy',
    });
    await orgRepo.addMember(orgId, owner2.id, 'owner');

    const updated = await orgService.updateMemberRole(
      orgId,
      ownerUser.id,
      owner2.id,
      'admin'
    );
    expect(updated.role).toBe('admin');
  });

  it('12. Owner demotes last owner → DENY (LAST_OWNER_PROTECTED)', async () => {
    await expect(
      orgService.updateMemberRole(orgId, ownerUser.id, ownerUser.id, 'admin')
    ).rejects.toThrow(/sole organization owner/i);
  });

  it('13. Admin changes member → viewer → ALLOW', async () => {
    const updated = await orgService.updateMemberRole(
      orgId,
      adminUser.id,
      memberUser.id,
      'viewer'
    );
    expect(updated.role).toBe('viewer');
  });

  it('14. Admin changes member → admin → DENY', async () => {
    await expect(
      orgService.updateMemberRole(orgId, adminUser.id, memberUser.id, 'admin')
    ).rejects.toThrow(/Only the organization owner can change roles to admin/i);
  });

  it('15. Admin changes admin → member → DENY', async () => {
    await expect(
      orgService.updateMemberRole(orgId, adminUser.id, admin2User.id, 'member')
    ).rejects.toThrow(/Admins cannot change roles of owners or other admins/i);
  });

  it('16. Admin changes owner → member → DENY', async () => {
    // Add co-owner so target is not the sole owner
    const coOwner = await userRepo.create({
      email: `coowner16_${Date.now()}@example.com`,
      fullName: 'Co Owner 16',
      passwordHash: 'dummy',
    });
    await orgRepo.addMember(orgId, coOwner.id, 'owner');

    await expect(
      orgService.updateMemberRole(orgId, adminUser.id, ownerUser.id, 'member')
    ).rejects.toThrow(/Admins cannot change roles of owners or other admins/i);
  });

  it('17. Member changes anyone → DENY', async () => {
    await expect(
      orgService.updateMemberRole(orgId, memberUser.id, viewerUser.id, 'member')
    ).rejects.toThrow(/Only organization owners and admins/i);
  });

  // ---------------------------------------------------------------------------
  // 3. MEMBER REMOVAL PERMISSION CHECKS (Cases 18 - 22)
  // ---------------------------------------------------------------------------
  it('18. Owner removes admin → ALLOW', async () => {
    const removed = await orgService.removeMember(orgId, ownerUser.id, adminUser.id);
    expect(removed).toBe(true);
  });

  it('19. Admin removes admin → DENY', async () => {
    await expect(
      orgService.removeMember(orgId, adminUser.id, admin2User.id)
    ).rejects.toThrow(/Forbidden: Admins cannot remove other admins/i);
  });

  it('20. Admin removes owner → DENY', async () => {
    // Add co-owner so target is not the sole owner
    const coOwner = await userRepo.create({
      email: `coowner20_${Date.now()}@example.com`,
      fullName: 'Co Owner 20',
      passwordHash: 'dummy',
    });
    await orgRepo.addMember(orgId, coOwner.id, 'owner');

    await expect(
      orgService.removeMember(orgId, adminUser.id, ownerUser.id)
    ).rejects.toThrow(/Forbidden: Admins cannot remove the organization owner/i);
  });

  it('21. Last owner removes themselves → DENY (LAST_OWNER_PROTECTED)', async () => {
    await expect(
      orgService.removeMember(orgId, ownerUser.id, ownerUser.id)
    ).rejects.toThrow(/Cannot remove the sole organization owner/i);
  });

  it('22. Owner removes themselves with another owner present → ALLOW', async () => {
    const owner2 = await userRepo.create({
      email: `owner2_leave_${Date.now()}@example.com`,
      fullName: 'Co Owner 2',
      passwordHash: 'dummy',
    });
    await orgRepo.addMember(orgId, owner2.id, 'owner');

    const removed = await orgService.removeMember(orgId, ownerUser.id, ownerUser.id);
    expect(removed).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // 4. CONCURRENCY & ISOLATION CHECKS (Cases 23 - 24)
  // ---------------------------------------------------------------------------
  it('23. Concurrent demotion of last two owners → only one succeeds (FOR UPDATE lock)', async () => {
    // Create dedicated org with EXACTLY 2 owners
    const ownerA = await userRepo.create({
      email: `ownerA_${Date.now()}@example.com`,
      fullName: 'Owner A',
      passwordHash: 'dummy',
    });
    const concurrentOrg = await orgRepo.create({
      name: `Concurrent Org ${Date.now()}`,
      slug: `concurrent-org-${Date.now()}`,
      ownerUserId: ownerA.id,
    });

    const ownerB = await userRepo.create({
      email: `ownerB_${Date.now()}@example.com`,
      fullName: 'Owner B',
      passwordHash: 'dummy',
    });
    await orgRepo.addMember(concurrentOrg.id, ownerB.id, 'owner');

    // Concurrently try to demote both owners to member
    const results = await Promise.allSettled([
      orgService.updateMemberRole(concurrentOrg.id, ownerA.id, ownerB.id, 'member'),
      orgService.updateMemberRole(concurrentOrg.id, ownerB.id, ownerA.id, 'member'),
    ]);

    const successes = results.filter((r) => r.status === 'fulfilled');
    const rejections = results.filter((r) => r.status === 'rejected');

    // Exactly one must succeed and one must be rejected by the row-level FOR UPDATE lock
    expect(successes.length).toBe(1);
    expect(rejections.length).toBe(1);

    // Verify at least one owner remains in database
    const remainingOwners = await query(
      "SELECT id FROM organization_members WHERE organization_id = $1 AND role = 'owner'",
      [concurrentOrg.id]
    );
    expect(remainingOwners.rows.length).toBeGreaterThanOrEqual(1);
  });

  it('24. Cross-tenant: user in org A cannot change roles in org B → DENY', async () => {
    const otherOwner = await userRepo.create({
      email: `otherowner_${Date.now()}@example.com`,
      fullName: 'Other Owner',
      passwordHash: 'dummy',
    });
    const otherOrg = await orgRepo.create({
      name: 'Other Org B',
      slug: `other-org-b-${Date.now()}`,
      ownerUserId: otherOwner.id,
    });
    const victim = await userRepo.create({
      email: `victim_${Date.now()}@example.com`,
      fullName: 'Victim Member',
      passwordHash: 'dummy',
    });
    await orgRepo.addMember(otherOrg.id, victim.id, 'member');

    // Admin from org A tries to patch victim in otherOrg
    const adminToken = generateAccessToken({
      userId: adminUser.id,
      email: adminUser.email,
      role: 'org_admin',
      orgId,
    });

    const patchReq = new NextRequest(
      `http://localhost:3000/api/organizations/${otherOrg.id}/members`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: victim.id, role: 'admin' }),
      }
    );
    const patchRes = await PATCH(patchReq, { params: Promise.resolve({ id: otherOrg.id }) });
    expect(patchRes.status).toBe(403);
    const patchJson = await patchRes.json();
    expect(patchJson.error.code).toBe('TENANT_MISMATCH');

    // Admin from org A tries to delete victim in otherOrg
    const delReq = new NextRequest(
      `http://localhost:3000/api/organizations/${otherOrg.id}/members?userId=${victim.id}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      }
    );
    const delRes = await DELETE(delReq, { params: Promise.resolve({ id: otherOrg.id }) });
    expect(delRes.status).toBe(403);
    const delJson = await delRes.json();
    expect(delJson.error.code).toBe('TENANT_MISMATCH');
  });
});
