import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { getCurrentPlan } from '../lib/billing/current-plan';
import { query } from '../lib/db';
import { isSuperAdmin } from '../lib/auth/super-admin';

describe('Fix 1: Database-driven Lifetime Access & Zero Hardcoded Email Verification', () => {
  const testOrgId = 'a1b2c3d4-1111-2222-3333-444455556666';
  const normalOrgId = 'b2c3d4e5-1111-2222-3333-444455556666';

  beforeEach(async () => {
    // Ensure column exists
    await query(`ALTER TABLE public.organization_plans ADD COLUMN IF NOT EXISTS plan_override TEXT DEFAULT NULL`);

    // Insert organizations to satisfy foreign key
    await query(
      `INSERT INTO public.organizations (id, name, slug)
       VALUES ($1, 'Lifetime Test Org', 'lifetime-test-org')
       ON CONFLICT (id) DO NOTHING`,
      [testOrgId]
    );

    await query(
      `INSERT INTO public.organizations (id, name, slug)
       VALUES ($1, 'Normal Test Org', 'normal-test-org')
       ON CONFLICT (id) DO NOTHING`,
      [normalOrgId]
    );

    // Clean plan records
    await query(`DELETE FROM organization_plans WHERE organization_id IN ($1, $2)`, [testOrgId, normalOrgId]);
  });

  afterAll(async () => {
    await query(`DELETE FROM organization_plans WHERE organization_id IN ($1, $2)`, [testOrgId, normalOrgId]);
    await query(`DELETE FROM organizations WHERE id IN ($1, $2)`, [testOrgId, normalOrgId]);
  });

  it('1. Organization without plan_override gets default plan (free)', async () => {
    await query(
      `INSERT INTO organization_plans (organization_id, plan_id, status, plan_override)
       VALUES ($1, 'free', 'active', NULL)
       ON CONFLICT (organization_id) DO UPDATE SET plan_override = NULL, plan_id = 'free'`,
      [normalOrgId]
    );

    const plan = await getCurrentPlan(normalOrgId);
    expect(plan.planId).toBe('free');
    expect(plan.effectivePlanId).toBe('free');
    expect(plan.planConfig.maxMembers).toBe(3);
  });

  it('2. Organization with plan_override = "lifetime" gets Enterprise limits per BILL-3', async () => {
    await query(
      `INSERT INTO organization_plans (organization_id, plan_id, status, plan_override)
       VALUES ($1, 'free', 'active', 'lifetime')
       ON CONFLICT (organization_id) DO UPDATE SET plan_override = 'lifetime'`,
      [testOrgId]
    );

    const plan = await getCurrentPlan(testOrgId);
    expect(plan.planId).toBe('lifetime');
    expect(plan.effectivePlanId).toBe('lifetime');
    expect(plan.planConfig.maxMembers).toBe(500);
  });

  it('3. isSuperAdmin strictly consults database and returns false for random user without database entry', async () => {
    const randomUserId = '99999999-9999-9999-9999-999999999999';
    const result = await isSuperAdmin(randomUserId);
    expect(result).toBe(false);
  });
});
