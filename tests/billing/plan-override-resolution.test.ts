import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PLANS, getPlanConfig } from '../../config/plans';
import { resolveOverride, getCurrentPlan, invalidatePlanCache } from '../../lib/billing/current-plan';
import { formatInviteDate } from '../../components/settings/PendingInvitationsList';
import { query } from '../../lib/db';
import { orgRepo } from '../../lib/db/repositories/org-repo';
import { userRepo } from '../../lib/db/repositories/user-repo';

describe('BILL-3: Plan Override Resolution, Lifetime VIP = Enterprise, & Date Guard', () => {
  // -------------------------------------------------------------------------
  // 1. Deep Equality of PLANS.lifetime and PLANS.enterprise
  // -------------------------------------------------------------------------
  describe('Quotas & Features Deep Equality', () => {
    it('PLANS.lifetime must have identical quotas to PLANS.enterprise (maxMembers=500)', () => {
      expect(PLANS.lifetime.maxMembers).toBe(500);
      expect(PLANS.enterprise.maxMembers).toBe(500);
      expect(PLANS.lifetime.maxMembers).toBe(PLANS.enterprise.maxMembers);

      expect(PLANS.lifetime.maxPendingInvites).toBe(500);
      expect(PLANS.enterprise.maxPendingInvites).toBe(500);
      expect(PLANS.lifetime.maxPendingInvites).toBe(PLANS.enterprise.maxPendingInvites);

      expect(PLANS.lifetime.maxClients).toBe(999999);
      expect(PLANS.enterprise.maxClients).toBe(999999);

      expect(PLANS.lifetime.maxProjects).toBe(999999);
      expect(PLANS.enterprise.maxProjects).toBe(999999);

      expect(PLANS.lifetime.maxChannels).toBe(999);
      expect(PLANS.enterprise.maxChannels).toBe(999);

      expect(PLANS.lifetime.maxAIRequestsMonthly).toBe(10000);
      expect(PLANS.enterprise.maxAIRequestsMonthly).toBe(10000);
    });

    it('PLANS.lifetime must have identical feature flags to PLANS.enterprise (SSO, Audit, API)', () => {
      expect(PLANS.lifetime.ssoEnabled).toBe(true);
      expect(PLANS.enterprise.ssoEnabled).toBe(true);

      expect(PLANS.lifetime.auditLogsEnabled).toBe(true);
      expect(PLANS.enterprise.auditLogsEnabled).toBe(true);

      expect(PLANS.lifetime.apiAccessEnabled).toBe(true);
      expect(PLANS.enterprise.apiAccessEnabled).toBe(true);

      expect(PLANS.lifetime.clientPortalEnabled).toBe(true);
      expect(PLANS.enterprise.clientPortalEnabled).toBe(true);

      expect(PLANS.lifetime.emailIntegrationEnabled).toBe(true);
      expect(PLANS.enterprise.emailIntegrationEnabled).toBe(true);
    });

    it('getPlanConfig("lifetime") returns PLANS.lifetime', () => {
      const cfg = getPlanConfig('lifetime');
      expect(cfg.id).toBe('lifetime');
      expect(cfg.maxMembers).toBe(500);
      expect(cfg.ssoEnabled).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // 2. resolveOverride() Unit Tests
  // -------------------------------------------------------------------------
  describe('resolveOverride logic', () => {
    it('resolves "lifetime" to Enterprise quotas (slug: "lifetime", permanent)', () => {
      const res = resolveOverride('lifetime');
      expect(res).not.toBeNull();
      expect(res?.kind).toBe('lifetime');
      expect(res?.planSlug).toBe('lifetime');
      expect(res?.isActive).toBe(true);
    });

    it('resolves "vip" and "lifetime_vip" aliases to Enterprise quotas (slug: "lifetime")', () => {
      const res1 = resolveOverride('vip');
      expect(res1?.planSlug).toBe('lifetime');
      const res2 = resolveOverride('lifetime_vip');
      expect(res2?.planSlug).toBe('lifetime');
    });

    it('resolves "enterprise" to Enterprise quotas (slug: "enterprise", permanent)', () => {
      const res = resolveOverride('enterprise');
      expect(res).not.toBeNull();
      expect(res?.kind).toBe('manual_tier');
      expect(res?.planSlug).toBe('enterprise');
      expect(res?.isActive).toBe(true);
    });

    it('preserves manual "pro" override without upgrading to Enterprise', () => {
      const res = resolveOverride('pro');
      expect(res).not.toBeNull();
      expect(res?.kind).toBe('manual_tier');
      expect(res?.planSlug).toBe('pro');
      expect(res?.isActive).toBe(true);
    });

    it('resolves sponsored durations ("1_month", "3_month", "6_month", "12_month") with future expiry to Enterprise', () => {
      const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      for (const dur of ['1_month', '3_month', '6_month', '12_month']) {
        const res = resolveOverride(dur, future);
        expect(res).not.toBeNull();
        expect(res?.kind).toBe('sponsored');
        expect(res?.planSlug).toBe('enterprise');
        expect(res?.isActive).toBe(true);
      }
    });

    it('returns null when sponsored duration has expired in the past', () => {
      const past = new Date(Date.now() - 1000);
      const res = resolveOverride('1_month', past);
      expect(res).toBeNull();
    });

    it('fails open to Enterprise quotas with a warning log for unknown non-null overrides', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const res = resolveOverride('special_partner_grant');
      expect(res).not.toBeNull();
      expect(res?.planSlug).toBe('enterprise');
      expect(res?.isActive).toBe(true);
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Unknown plan_override'));
      warnSpy.mockRestore();
    });

    it('returns null for null or undefined override', () => {
      expect(resolveOverride(null)).toBeNull();
      expect(resolveOverride(undefined)).toBeNull();
      expect(resolveOverride('')).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // 3. Exact Production Org Regression Test
  // -------------------------------------------------------------------------
  describe('Production Org e568d645-b363-4d31-90cd-0ff849b8481b', () => {
    const PROD_ORG_ID = 'e568d645-b363-4d31-90cd-0ff849b8481b';

    it('getCurrentPlan returns slug "lifetime" with 500 member quota and enterprise features', async () => {
      invalidatePlanCache(PROD_ORG_ID);
      const plan = await getCurrentPlan(PROD_ORG_ID);

      expect(plan.effectivePlanId).toBe('lifetime');
      expect(plan.planConfig.maxMembers).toBe(500);
      expect(plan.planConfig.maxPendingInvites).toBe(500);
      expect(plan.planConfig.ssoEnabled).toBe(true);
      expect(plan.planConfig.auditLogsEnabled).toBe(true);
      expect(plan.planConfig.apiAccessEnabled).toBe(true);
      expect(plan.planConfig.clientPortalEnabled).toBe(true);
      expect(plan.planConfig.emailIntegrationEnabled).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // 4. End-to-End Database Scenarios (Overrides, Expiration & Fallbacks)
  // -------------------------------------------------------------------------
  describe('Database Scenarios & Fallbacks', () => {
    let testOrgId: string;
    let ownerUserId: string;

    beforeEach(async () => {
      const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const owner = await userRepo.create({
        email: `bill3_test_${id}@example.com`,
        fullName: 'Bill3 Owner',
        passwordHash: 'dummy_hash',
      });
      ownerUserId = owner.id;

      const org = await orgRepo.create({
        name: `Bill3 Org ${id}`,
        slug: `bill3-org-${id}`,
        ownerUserId,
      });
      testOrgId = org.id;
    });

    afterEach(async () => {
      invalidatePlanCache(testOrgId);
      await query('DELETE FROM organization_plans WHERE organization_id = $1', [testOrgId]);
      await query('DELETE FROM organizations WHERE id = $1', [testOrgId]);
      await query('DELETE FROM users WHERE id = $1', [ownerUserId]);
    });

    it('manual plan_override = "pro" resolves to Pro quotas (maxMembers: 15)', async () => {
      await query(
        `INSERT INTO organization_plans (organization_id, plan_id, status, plan_override)
         VALUES ($1, 'free', 'active', 'pro')
         ON CONFLICT (organization_id) DO UPDATE SET plan_override = 'pro', plan_id = 'free'`,
        [testOrgId]
      );

      invalidatePlanCache(testOrgId);
      const plan = await getCurrentPlan(testOrgId);
      expect(plan.effectivePlanId).toBe('pro');
      expect(plan.planConfig.maxMembers).toBe(15);
      expect(plan.planConfig.ssoEnabled).toBe(false);
    });

    it('manual plan_override = "enterprise" resolves to Enterprise quotas (maxMembers: 500)', async () => {
      await query(
        `INSERT INTO organization_plans (organization_id, plan_id, status, plan_override)
         VALUES ($1, 'free', 'active', 'enterprise')
         ON CONFLICT (organization_id) DO UPDATE SET plan_override = 'enterprise', plan_id = 'free'`,
        [testOrgId]
      );

      invalidatePlanCache(testOrgId);
      const plan = await getCurrentPlan(testOrgId);
      expect(plan.effectivePlanId).toBe('enterprise');
      expect(plan.planConfig.maxMembers).toBe(500);
      expect(plan.planConfig.ssoEnabled).toBe(true);
    });

    it('plan_override = "lifetime" resolves to Lifetime/Enterprise quotas (maxMembers: 500)', async () => {
      await query(
        `INSERT INTO organization_plans (organization_id, plan_id, status, plan_override)
         VALUES ($1, 'free', 'active', 'lifetime')
         ON CONFLICT (organization_id) DO UPDATE SET plan_override = 'lifetime', plan_id = 'free'`,
        [testOrgId]
      );

      invalidatePlanCache(testOrgId);
      const plan = await getCurrentPlan(testOrgId);
      expect(plan.effectivePlanId).toBe('lifetime');
      expect(plan.planConfig.maxMembers).toBe(500);
      expect(plan.planConfig.ssoEnabled).toBe(true);
      expect(plan.planConfig.auditLogsEnabled).toBe(true);
    });

    it('active sponsored override ("3_month") resolves to Enterprise quotas', async () => {
      // In current schema without migration 0050, plan_override='3_month' without expiry column defaults to active
      await query(
        `INSERT INTO organization_plans (organization_id, plan_id, status, plan_override)
         VALUES ($1, 'free', 'active', '3_month')
         ON CONFLICT (organization_id) DO UPDATE SET plan_override = '3_month', plan_id = 'free'`,
        [testOrgId]
      );

      invalidatePlanCache(testOrgId);
      const plan = await getCurrentPlan(testOrgId);
      expect(plan.effectivePlanId).toBe('enterprise');
      expect(plan.planConfig.maxMembers).toBe(500);
      expect(plan.planConfig.ssoEnabled).toBe(true);
    });

    it('null plan_override with no subscription resolves to Free plan (maxMembers: 3)', async () => {
      await query(
        `INSERT INTO organization_plans (organization_id, plan_id, status, plan_override)
         VALUES ($1, 'free', 'active', NULL)
         ON CONFLICT (organization_id) DO UPDATE SET plan_override = NULL, plan_id = 'free'`,
        [testOrgId]
      );

      invalidatePlanCache(testOrgId);
      const plan = await getCurrentPlan(testOrgId);
      expect(plan.effectivePlanId).toBe('free');
      expect(plan.planConfig.maxMembers).toBe(3);
      expect(plan.planConfig.ssoEnabled).toBe(false);
    });

    it('null plan_override with active Pro subscription resolves to Pro plan (maxMembers: 15)', async () => {
      await query(
        `INSERT INTO organization_plans (organization_id, plan_id, status, plan_override, stripe_subscription_id)
         VALUES ($1, 'pro', 'active', NULL, 'sub_test_123')
         ON CONFLICT (organization_id) DO UPDATE SET plan_override = NULL, plan_id = 'pro', status = 'active', stripe_subscription_id = 'sub_test_123'`,
        [testOrgId]
      );

      invalidatePlanCache(testOrgId);
      const plan = await getCurrentPlan(testOrgId);
      expect(plan.effectivePlanId).toBe('pro');
      expect(plan.planConfig.maxMembers).toBe(15);
      expect(plan.planConfig.ssoEnabled).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // 5. Date Guard & Field Mismatch Fix
  // -------------------------------------------------------------------------
  describe('Invitation Expiry Date Formatter & Guard', () => {
    it('returns "—" for undefined, null, or empty string without throwing', () => {
      expect(formatInviteDate(undefined)).toBe('—');
      expect(formatInviteDate(null)).toBe('—');
      expect(formatInviteDate('')).toBe('—');
    });

    it('returns "—" for invalid date strings when isNaN(d.getTime())', () => {
      expect(formatInviteDate('invalid-date')).toBe('—');
      expect(formatInviteDate('undefined')).toBe('—');
      expect(formatInviteDate('foo-bar-baz')).toBe('—');
    });

    it('correctly formats valid ISO date strings', () => {
      const formatted = formatInviteDate('2026-10-15T10:00:00.000Z');
      expect(formatted).not.toBe('Invalid Date');
      expect(formatted).not.toBe('—');
      expect(formatted).toMatch(/Oct (14|15|16), 2026/); // handles timezone offsets cleanly
    });
  });
});
