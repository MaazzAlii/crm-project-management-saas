vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { query } from '../../lib/db';
import { userRepo } from '../../lib/db/repositories/user-repo';
import { orgRepo } from '../../lib/db/repositories/org-repo';
import {
  grantPlanOverride,
  revokePlanOverride,
  getPlanOverrideDetails,
} from '../../lib/services/plan-override';
import { getCurrentPlan, invalidatePlanCache } from '../../lib/billing/current-plan';
import {
  grantPlanOverrideAction,
  revokePlanOverrideAction,
} from '../../app/super-admin/plan-override-actions';
import * as superAdminAuth from '../../lib/auth/super-admin';
import * as sessionModule from '../../lib/auth/session';

describe('BILL-3B: Super-Admin Plan Override Service & Actions', () => {
  let testOrgId: string;
  let superAdminUserId: string;
  let regularUserId: string;

  beforeEach(async () => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    // Create super admin user
    const superAdmin = await userRepo.create({
      email: `bill3b_admin_${id}@example.com`,
      fullName: 'Super Admin Operator',
      passwordHash: 'dummy_hash',
    });
    superAdminUserId = superAdmin.id;
    await query(`INSERT INTO super_admins (user_id) VALUES ($1)`, [superAdminUserId]);

    // Create regular user
    const regularUser = await userRepo.create({
      email: `bill3b_user_${id}@example.com`,
      fullName: 'Regular User',
      passwordHash: 'dummy_hash',
    });
    regularUserId = regularUser.id;

    // Create test organization
    const org = await orgRepo.create({
      name: `BILL-3B Test Org ${id}`,
      slug: `bill3b-org-${id}`,
      ownerUserId: regularUserId,
    });
    testOrgId = org.id;

    // Set initial Free plan
    await query(
      `INSERT INTO organization_plans (organization_id, plan_id, status, plan_override)
       VALUES ($1, 'free', 'active', NULL)
       ON CONFLICT (organization_id) DO UPDATE SET plan_override = NULL, plan_id = 'free'`,
      [testOrgId]
    );
    invalidatePlanCache(testOrgId);
  });

  afterEach(async () => {
    invalidatePlanCache(testOrgId);
    await query('DELETE FROM audit_logs WHERE organization_id = $1', [testOrgId]);
    await query('DELETE FROM organization_plans WHERE organization_id = $1', [testOrgId]);
    await query('DELETE FROM organizations WHERE id = $1', [testOrgId]);
    await query('DELETE FROM super_admins WHERE user_id = $1', [superAdminUserId]);
    await query('DELETE FROM users WHERE id IN ($1, $2)', [superAdminUserId, regularUserId]);
    vi.restoreAllMocks();
  });

  // ---------------------------------------------------------------------------
  // 1. Duration & Expiration Computation Tests
  // ---------------------------------------------------------------------------
  describe('grantPlanOverride service', () => {
    it('1. duration="lifetime" sets plan_override="lifetime" and expires_at=NULL', async () => {
      const res = await grantPlanOverride({
        organizationId: testOrgId,
        duration: 'lifetime',
        note: 'Founding investor access',
        grantedByUserId: superAdminUserId,
      });

      expect(res.success).toBe(true);
      expect(res.override?.plan_override).toBe('lifetime');
      expect(res.override?.plan_override_expires_at).toBeNull();
      expect(res.override?.plan_override_note).toBe('Founding investor access');
      expect(res.override?.plan_override_granted_by).toBe(superAdminUserId);

      // Verify in database
      const dbRow = await getPlanOverrideDetails(testOrgId);
      expect(dbRow?.plan_override).toBe('lifetime');
      expect(dbRow?.plan_override_expires_at).toBeNull();
      expect(dbRow?.plan_override_note).toBe('Founding investor access');
    });

    it('2. duration="1_month" sets expires_at ~30 days in the future', async () => {
      const res = await grantPlanOverride({
        organizationId: testOrgId,
        duration: '1_month',
        grantedByUserId: superAdminUserId,
      });

      expect(res.success).toBe(true);
      expect(res.override?.plan_override).toBe('1_month');
      expect(res.override?.plan_override_expires_at).not.toBeNull();

      const expiresMs = new Date(res.override!.plan_override_expires_at!).getTime();
      const expectedApproxMs = Date.now() + 30 * 24 * 60 * 60 * 1000;
      // Within 2 days of 30 days due to month calculation variations
      expect(Math.abs(expiresMs - expectedApproxMs)).toBeLessThan(2 * 24 * 60 * 60 * 1000);
    });

    it('3. duration="3_month" sets expires_at ~90 days in the future', async () => {
      const res = await grantPlanOverride({
        organizationId: testOrgId,
        duration: '3_month',
        grantedByUserId: superAdminUserId,
      });

      expect(res.success).toBe(true);
      expect(res.override?.plan_override).toBe('3_month');
      const expiresMs = new Date(res.override!.plan_override_expires_at!).getTime();
      const expectedApproxMs = Date.now() + 90 * 24 * 60 * 60 * 1000;
      expect(Math.abs(expiresMs - expectedApproxMs)).toBeLessThan(3 * 24 * 60 * 60 * 1000);
    });

    it('4. duration="6_month" sets expires_at ~180 days in the future', async () => {
      const res = await grantPlanOverride({
        organizationId: testOrgId,
        duration: '6_month',
        grantedByUserId: superAdminUserId,
      });

      expect(res.success).toBe(true);
      expect(res.override?.plan_override).toBe('6_month');
      const expiresMs = new Date(res.override!.plan_override_expires_at!).getTime();
      const expectedApproxMs = Date.now() + 180 * 24 * 60 * 60 * 1000;
      expect(Math.abs(expiresMs - expectedApproxMs)).toBeLessThan(4 * 24 * 60 * 60 * 1000);
    });

    it('5. duration="12_month" sets expires_at ~365 days in the future', async () => {
      const res = await grantPlanOverride({
        organizationId: testOrgId,
        duration: '12_month',
        grantedByUserId: superAdminUserId,
      });

      expect(res.success).toBe(true);
      expect(res.override?.plan_override).toBe('12_month');
      const expiresMs = new Date(res.override!.plan_override_expires_at!).getTime();
      const expectedApproxMs = Date.now() + 365 * 24 * 60 * 60 * 1000;
      expect(Math.abs(expiresMs - expectedApproxMs)).toBeLessThan(5 * 24 * 60 * 60 * 1000);
    });

    it('6. duration="custom" with future date sets exact expires_at timestamp', async () => {
      const targetDate = new Date(Date.now() + 45 * 24 * 60 * 60 * 1000);
      const res = await grantPlanOverride({
        organizationId: testOrgId,
        duration: 'custom',
        customExpiresAt: targetDate,
        grantedByUserId: superAdminUserId,
      });

      expect(res.success).toBe(true);
      expect(res.override?.plan_override).toBe('custom');
      const dbRow = await getPlanOverrideDetails(testOrgId);
      expect(new Date(dbRow!.plan_override_expires_at!).toISOString()).toBe(targetDate.toISOString());
    });

    it('7. duration="custom" without customExpiresAt returns clear error', async () => {
      const res = await grantPlanOverride({
        organizationId: testOrgId,
        duration: 'custom',
        customExpiresAt: null,
        grantedByUserId: superAdminUserId,
      });

      expect(res.success).toBe(false);
      expect(res.error).toMatch(/custom expiration date is required/i);
    });

    it('8. granting a new override replaces the previous override (single active override)', async () => {
      // First grant 1_month
      await grantPlanOverride({
        organizationId: testOrgId,
        duration: '1_month',
        note: 'First override',
        grantedByUserId: superAdminUserId,
      });

      // Now grant lifetime
      const res2 = await grantPlanOverride({
        organizationId: testOrgId,
        duration: 'lifetime',
        note: 'Upgraded to permanent',
        grantedByUserId: superAdminUserId,
      });

      expect(res2.success).toBe(true);
      const row = await getPlanOverrideDetails(testOrgId);
      expect(row?.plan_override).toBe('lifetime');
      expect(row?.plan_override_expires_at).toBeNull();
      expect(row?.plan_override_note).toBe('Upgraded to permanent');
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Revoke Functionality
  // ---------------------------------------------------------------------------
  describe('revokePlanOverride service', () => {
    it('9. clears all override columns on organization_plans', async () => {
      await grantPlanOverride({
        organizationId: testOrgId,
        duration: '3_month',
        note: 'Temporary sponsor',
        grantedByUserId: superAdminUserId,
      });

      const revokeRes = await revokePlanOverride(testOrgId, superAdminUserId);
      expect(revokeRes.success).toBe(true);

      const dbRow = await getPlanOverrideDetails(testOrgId);
      expect(dbRow?.plan_override).toBeNull();
      expect(dbRow?.plan_override_expires_at).toBeNull();
      expect(dbRow?.plan_override_granted_by).toBeNull();
      expect(dbRow?.plan_override_granted_at).toBeNull();
      expect(dbRow?.plan_override_note).toBeNull();
    });

    it('10. revoke on org with no override succeeds idempotently', async () => {
      const res = await revokePlanOverride(testOrgId, superAdminUserId);
      expect(res.success).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Audit Logging & Immediate Quota Synchronization
  // ---------------------------------------------------------------------------
  describe('Audit Logging & Immediate Cache Sync', () => {
    it('11. writes PLAN_OVERRIDE_GRANTED and PLAN_OVERRIDE_REVOKED audit log entries', async () => {
      await grantPlanOverride({
        organizationId: testOrgId,
        duration: '6_month',
        note: 'Audit test grant',
        grantedByUserId: superAdminUserId,
      });

      await revokePlanOverride(testOrgId, superAdminUserId);

      const auditEntries = await query<{ action: string; details: any }>(
        `SELECT action, details FROM audit_logs
         WHERE organization_id = $1 AND action LIKE 'PLAN_OVERRIDE%'
         ORDER BY created_at ASC`,
        [testOrgId]
      );

      expect(auditEntries.rows.length).toBe(2);
      expect(auditEntries.rows[0].action).toBe('PLAN_OVERRIDE_GRANTED');
      expect(auditEntries.rows[0].details.duration).toBe('6_month');
      expect(auditEntries.rows[0].details.note).toBe('Audit test grant');

      expect(auditEntries.rows[1].action).toBe('PLAN_OVERRIDE_REVOKED');
      expect(auditEntries.rows[1].details.previousOverride).toBe('6_month');
    });

    it('12. getCurrentPlan() reflects the new override immediately after grant and falls back after revoke', async () => {
      // Prior to grant: Free (3 seats)
      const initial = await getCurrentPlan(testOrgId);
      expect(initial.effectivePlanId).toBe('free');
      expect(initial.planConfig.maxMembers).toBe(3);

      // Grant lifetime override
      await grantPlanOverride({
        organizationId: testOrgId,
        duration: 'lifetime',
        grantedByUserId: superAdminUserId,
      });

      // Immediately reflects Enterprise quotas without delay
      const updated = await getCurrentPlan(testOrgId);
      expect(updated.effectivePlanId).toBe('lifetime');
      expect(updated.planConfig.maxMembers).toBe(500);
      expect(updated.planConfig.ssoEnabled).toBe(true);

      // Revoke override
      await revokePlanOverride(testOrgId, superAdminUserId);

      // Immediately falls back to Free
      const reverted = await getCurrentPlan(testOrgId);
      expect(reverted.effectivePlanId).toBe('free');
      expect(reverted.planConfig.maxMembers).toBe(3);
      expect(reverted.planConfig.ssoEnabled).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Server Action Auth Gate (requireSuperAdmin)
  // ---------------------------------------------------------------------------
  describe('Server Action Auth Gate', () => {
    it('13. non-super-admin caller is rejected with error', async () => {
      // Mock session as regular user (non-super-admin)
      vi.spyOn(sessionModule, 'getCurrentSessionContext').mockResolvedValue({
        user: { id: regularUserId, email: 'user@example.com' },
        organization: { id: testOrgId, role: 'member' },
        isSuperAdmin: false,
      } as any);

      vi.spyOn(superAdminAuth, 'requireSuperAdmin').mockRejectedValue(
        new Error('Access Denied: Super Admin privileges required for platform management.')
      );

      const grantRes = await grantPlanOverrideAction({
        organizationId: testOrgId,
        duration: 'lifetime',
      });

      expect(grantRes.success).toBe(false);
      expect(grantRes.error).toMatch(/Access Denied/i);

      const revokeRes = await revokePlanOverrideAction(testOrgId);
      expect(revokeRes.success).toBe(false);
      expect(revokeRes.error).toMatch(/Access Denied/i);
    });

    it('14. super-admin caller successfully executes server actions', async () => {
      vi.spyOn(sessionModule, 'getCurrentSessionContext').mockResolvedValue({
        user: { id: superAdminUserId, email: 'admin@innoventix.io' },
        isSuperAdmin: true,
      } as any);

      vi.spyOn(superAdminAuth, 'requireSuperAdmin').mockResolvedValue(true as any);

      const grantRes = await grantPlanOverrideAction({
        organizationId: testOrgId,
        duration: '3_month',
        note: 'Server action test',
      });

      expect(grantRes.success).toBe(true);
      expect(grantRes.override?.plan_override).toBe('3_month');

      const revokeRes = await revokePlanOverrideAction(testOrgId);
      expect(revokeRes.success).toBe(true);
    });
  });
});
