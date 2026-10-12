import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { getAuthFromRequest, getTenantOrgId } from '@/lib/auth/middleware';
import { generateAccessToken } from '@/lib/auth/jwt';
import { setOrganizationPlan, getCurrentPlan } from '@/lib/billing/current-plan';
import { query } from '@/lib/db';
import { getPipelineSession } from '@/lib/pipeline/auth-helper';

describe('Security & Multi-Tenancy Hardening', () => {
  const userOrgId = '00000000-0000-4000-8000-000000000001';
  const foreignOrgId = '00000000-0000-4000-8000-000000000002';
  const userId = '00000000-0000-4000-8000-000000000003';

  describe('1. Request with x-organization-id for foreign org returns 404', () => {
    it('getTenantOrgId rejects x-organization-id header mismatch with 404', () => {
      const auth = {
        userId,
        email: 'user@example.com',
        role: 'user' as const,
        orgId: userOrgId,
      };

      const request = new NextRequest('http://localhost:3000/api/projects', {
        headers: {
          'x-organization-id': foreignOrgId,
        },
      });

      const result = getTenantOrgId(request, auth);
      expect(result).toHaveProperty('status', 404);
      expect(result).toHaveProperty('error', 'Organization not found');
    });

    it('getPipelineSession rejects non-member x-organization-id context switch', async () => {
      const token = generateAccessToken({
        userId,
        email: 'user@example.com',
        role: 'user',
        orgId: userOrgId,
      });

      const request = new NextRequest('http://localhost:3000/api/pipeline/deals', {
        headers: {
          authorization: `Bearer ${token}`,
          'x-organization-id': foreignOrgId,
        },
      });

      const session = await getPipelineSession(request);
      expect(session).toBeNull();
    });
  });

  describe('2. Request with org cookie for another org uses token org, not cookie', () => {
    it('getAuthFromRequest strictly derives orgId from signed JWT and ignores untrusted cookie', () => {
      const token = generateAccessToken({
        userId,
        email: 'user@example.com',
        role: 'user',
        orgId: userOrgId,
      });

      // Attacker passes legitimate session cookie, but injects an arbitrary organization_id cookie
      const request = new NextRequest('http://localhost:3000/api/leads', {
        headers: {
          cookie: `innoventix_session=${token}; organization_id=${foreignOrgId}; current_org_id=${foreignOrgId}`,
        },
      });

      const auth = getAuthFromRequest(request);
      expect(auth).not.toBeNull();
      expect(auth?.orgId).toBe(userOrgId);
      expect(auth?.orgId).not.toBe(foreignOrgId);
    });
  });

  describe('3. Stripe webhook can NEVER set or overwrite plan_override', () => {
    const testOrgId = '00000000-0000-4000-8000-000000000099';

    beforeEach(async () => {
      await query('DELETE FROM organization_plans WHERE organization_id = $1', [testOrgId]);
      await query('DELETE FROM organizations WHERE id = $1', [testOrgId]);
      await query(
        `INSERT INTO organizations (id, name, slug, plan_tier, billing_status)
         VALUES ($1, 'Test Org', 'test-org-stripe', 'enterprise', 'active')
         ON CONFLICT (id) DO NOTHING`,
        [testOrgId]
      );
      await query(
        `INSERT INTO organization_plans (organization_id, plan_id, status, plan_override, updated_at)
         VALUES ($1, 'enterprise', 'active', 'lifetime', NOW())`,
        [testOrgId]
      );
    });

    it('Stripe checkout completed preserves plan_override = lifetime', async () => {
      // Simulates Stripe webhook calling setOrganizationPlan
      await setOrganizationPlan(testOrgId, 'pro', 'active', {
        stripeCustomerId: 'cus_test_123',
        stripeSubscriptionId: 'sub_test_123',
        currentPeriodEnd: new Date(Date.now() + 30 * 86400 * 1000),
      });

      const row = (
        await query(
          'SELECT plan_id, status, plan_override, stripe_customer_id FROM organization_plans WHERE organization_id = $1',
          [testOrgId]
        )
      ).rows[0];

      expect(row.plan_id).toBe('pro');
      expect(row.stripe_customer_id).toBe('cus_test_123');
      // plan_override is strictly preserved and was not touched or overwritten by Stripe
      expect(row.plan_override).toBe('lifetime');

      // Plan resolution still recognizes lifetime override as enterprise
      const plan = await getCurrentPlan(testOrgId);
      expect(plan.planId).toBe('enterprise');
    });

    it('Stripe customer.subscription.deleted / canceled preserves plan_override = lifetime and does not restrict account', async () => {
      // Stripe webhook marking status as canceled
      await setOrganizationPlan(testOrgId, 'free', 'canceled');

      const row = (
        await query(
          'SELECT plan_id, status, plan_override FROM organization_plans WHERE organization_id = $1',
          [testOrgId]
        )
      ).rows[0];

      expect(row.plan_override).toBe('lifetime');

      // getCurrentPlan does NOT restrict account to free tier because lifetime override protects it
      const plan = await getCurrentPlan(testOrgId);
      expect(plan.planId).toBe('enterprise');
    });
  });
});
