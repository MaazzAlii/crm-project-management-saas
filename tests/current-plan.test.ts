import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { query } from '../lib/db';
import {
  getCurrentPlan,
  invalidatePlanCache,
  setOrganizationPlan,
} from '../lib/billing/current-plan';

describe('Prompt 11: Current Plan Lookup Service', () => {
  let testOrgId: string;

  beforeAll(async () => {
    const res = await query<{ id: string }>(`
      INSERT INTO organizations (name, slug)
      VALUES ('Current Plan Org ${Date.now()}', 'curr-plan-${Date.now()}')
      RETURNING id;
    `);
    testOrgId = res.rows[0].id;
  });

  afterAll(async () => {
    if (testOrgId) {
      await query('DELETE FROM organizations WHERE id = $1', [testOrgId]);
    }
    invalidatePlanCache();
  });

  it('treats missing row as free plan with active status and no banner', async () => {
    const fakeOrgId = '00000000-0000-0000-0000-000000000000';
    invalidatePlanCache(fakeOrgId);
    const result = await getCurrentPlan(fakeOrgId);

    expect(result.planId).toBe('free');
    expect(result.effectivePlanId).toBe('free');
    expect(result.status).toBe('active');
    expect(result.showBanner).toBe(false);
    expect(result.planConfig.maxMembers).toBe(3);
  });

  it('pro plan returns pro limits and no banner', async () => {
    await setOrganizationPlan(testOrgId, 'pro', 'active');
    const result = await getCurrentPlan(testOrgId);

    expect(result.planId).toBe('pro');
    expect(result.effectivePlanId).toBe('pro');
    expect(result.status).toBe('active');
    expect(result.showBanner).toBe(false);
    expect(result.planConfig.maxMembers).toBe(15);
  });

  it('past_due status treats as free for limits and shows banner without deleting data', async () => {
    await setOrganizationPlan(testOrgId, 'pro', 'past_due');
    const result = await getCurrentPlan(testOrgId);

    expect(result.planId).toBe('pro');
    expect(result.effectivePlanId).toBe('free');
    expect(result.status).toBe('past_due');
    expect(result.showBanner).toBe(true);
    expect(result.bannerType).toBe('past_due');
    expect(result.planConfig.maxMembers).toBe(3); // free limit
  });

  it('canceled status treats as free for limits and shows banner without deleting data', async () => {
    await setOrganizationPlan(testOrgId, 'pro', 'canceled');
    const result = await getCurrentPlan(testOrgId);

    expect(result.planId).toBe('pro');
    expect(result.effectivePlanId).toBe('free');
    expect(result.status).toBe('canceled');
    expect(result.showBanner).toBe(true);
    expect(result.bannerType).toBe('canceled');
    expect(result.planConfig.maxMembers).toBe(3); // free limit
  });

  it('enterprise plan returns enterprise limits and no banner', async () => {
    await setOrganizationPlan(testOrgId, 'enterprise', 'active');
    const result = await getCurrentPlan(testOrgId);

    expect(result.planId).toBe('enterprise');
    expect(result.effectivePlanId).toBe('enterprise');
    expect(result.status).toBe('active');
    expect(result.showBanner).toBe(false);
    expect(result.planConfig.maxMembers).toBe(500);
  });

  it('caches results for 30 seconds and invalidates on plan update', async () => {
    await setOrganizationPlan(testOrgId, 'free', 'active');
    const firstCall = await getCurrentPlan(testOrgId);
    expect(firstCall.planId).toBe('free');

    // Manually mutate DB row directly without invalidatePlanCache
    await query(
      "UPDATE organization_plans SET plan_id = 'pro' WHERE organization_id = $1",
      [testOrgId]
    );

    // Should return cached result ('free')
    const cachedCall = await getCurrentPlan(testOrgId);
    expect(cachedCall.planId).toBe('free');

    // Invalidate cache
    invalidatePlanCache(testOrgId);

    // Now should fetch updated DB row ('pro')
    const freshCall = await getCurrentPlan(testOrgId);
    expect(freshCall.planId).toBe('pro');
  });
});
