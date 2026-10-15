import { queryOne, query } from '../db';
import { PLANS, PlanConfig, PlanId } from '../../config/plans';
import { OrganizationPlan, PlanTier, PlanStatus } from '../types/database';

export interface CurrentPlanResult {
  organizationId: string;
  planId: PlanTier;
  effectivePlanId: PlanTier;
  status: PlanStatus;
  planConfig: PlanConfig;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  currentPeriodEnd?: Date | string | null;
  showBanner: boolean;
  bannerType?: 'past_due' | 'canceled' | null;
}

interface CacheEntry {
  result: CurrentPlanResult;
  expiresAt: number;
}

// In-memory 30-second TTL cache keyed by organizationId
const planCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 30 * 1000;

/**
 * Invalidate cached plan details for a specific org or all orgs
 */
export function invalidatePlanCache(orgId?: string): void {
  if (orgId) {
    planCache.delete(orgId);
  } else {
    planCache.clear();
  }
}

export type OverrideKind = 'lifetime' | 'sponsored' | 'manual_tier';

export interface ResolvedOverride {
  kind: OverrideKind;
  planSlug: PlanTier;
  isActive: boolean;
  expiresAt?: Date | null;
}

/**
 * Resolve organization plan override with multi-duration sponsorship & expiry support (Prompt BILL-3)
 * Rules:
 * - 'lifetime' | 'vip' | 'lifetime_vip' -> Permanent Enterprise quotas (slug: 'lifetime')
 * - 'enterprise' | 'agency'            -> Permanent Enterprise quotas (slug: 'enterprise')
 * - 'pro'                              -> Permanent Pro quotas (slug: 'pro') — preserves manual Pro grants
 * - '1_month'|'3_month'|'6_month'|'12_month'
 *                                      -> Enterprise quotas until plan_override_expires_at; falls back when expired
 * - Any other non-null value           -> Enterprise quotas with warning log (fail-open)
 */
export function resolveOverride(
  planOverride: string | null | undefined,
  expiresAt?: Date | string | null
): ResolvedOverride | null {
  if (!planOverride) return null;
  const raw = planOverride.trim().toLowerCase();
  if (!raw) return null;

  // 1. Permanent Lifetime
  if (raw === 'lifetime' || raw === 'vip' || raw === 'lifetime_vip') {
    return {
      kind: 'lifetime',
      planSlug: 'lifetime',
      isActive: true,
      expiresAt: null,
    };
  }

  // 2. Permanent Enterprise
  if (raw === 'enterprise' || raw === 'agency') {
    return {
      kind: 'manual_tier',
      planSlug: 'enterprise',
      isActive: true,
      expiresAt: null,
    };
  }

  // 3. Permanent Pro (preserve manual pro grants)
  if (raw === 'pro' || raw === 'starter' || raw === 'professional') {
    return {
      kind: 'manual_tier',
      planSlug: 'pro',
      isActive: true,
      expiresAt: null,
    };
  }

  // 4. Sponsored overrides: '1_month', '3_month', '6_month', '12_month'
  if (['1_month', '3_month', '6_month', '12_month'].includes(raw)) {
    const parsedExpiry = expiresAt ? new Date(expiresAt) : null;
    const isExpired = parsedExpiry ? !isNaN(parsedExpiry.getTime()) && parsedExpiry.getTime() < Date.now() : false;
    if (isExpired) {
      return null;
    }

    return {
      kind: 'sponsored',
      planSlug: 'enterprise',
      isActive: true,
      expiresAt: parsedExpiry,
    };
  }

  // 5. Unknown override values: fail-open to Enterprise with warning log
  console.warn(`[resolveOverride] Unknown plan_override "${planOverride}" — defaulting to Enterprise access.`);
  return {
    kind: 'lifetime',
    planSlug: 'enterprise',
    isActive: true,
    expiresAt: null,
  };
}

/**
 * Fetch real-time active plan and seat limits for an organization
 */
export async function getCurrentPlan(orgId: string): Promise<CurrentPlanResult> {
  const cached = planCache.get(orgId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.result;
  }

  let row: OrganizationPlan | null = null;
  try {
    row = await queryOne<OrganizationPlan>(
      'SELECT * FROM organization_plans WHERE organization_id = $1',
      [orgId]
    );
  } catch (err: any) {
    console.warn(`[getCurrentPlan] Error querying organization_plans for ${orgId}:`, err?.message);
  }

  let planId: PlanTier = 'free';
  let status: PlanStatus = 'active';
  let stripeCustomerId: string | null = null;
  let stripeSubscriptionId: string | null = null;
  let currentPeriodEnd: Date | string | null = null;

  if (row) {
    planId = row.plan_id;
    status = row.status;
    stripeCustomerId = row.stripe_customer_id || null;
    stripeSubscriptionId = row.stripe_subscription_id || null;
    currentPeriodEnd = row.current_period_end || null;
  }

  // Resolve override with sponsor duration and expiry support (BILL-3)
  const override = resolveOverride(row?.plan_override, row?.plan_override_expires_at);

  let effectivePlanId: PlanTier;

  if (override && override.isActive) {
    // 1. ACTIVE OVERRIDE (Highest priority — grants Enterprise/Lifetime/Pro quotas)
    effectivePlanId = override.planSlug;
    planId = override.planSlug;
    status = 'active';
  } else {
    // 2. ACTIVE SUBSCRIPTION / PLAN TIER FALLBACK
    // If status is past_due or canceled (and no active override), treat as free for limits
    const isRestricted = status === 'past_due' || status === 'canceled';
    effectivePlanId = isRestricted ? 'free' : planId;
  }

  const planConfig: PlanConfig = PLANS[effectivePlanId as PlanId] || PLANS.free;

  const result: CurrentPlanResult = {
    organizationId: orgId,
    planId,
    effectivePlanId,
    status,
    planConfig,
    stripeCustomerId,
    stripeSubscriptionId,
    currentPeriodEnd,
    showBanner: (status === 'past_due' || status === 'canceled') && (!override || !override.isActive),
    bannerType: (status === 'past_due' || status === 'canceled') && (!override || !override.isActive)
      ? (status as 'past_due' | 'canceled')
      : null,
  };

  planCache.set(orgId, {
    result,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });

  return result;
}

/**
 * Update an organization's plan and immediately invalidate its cache entry
 */
export async function setOrganizationPlan(
  orgId: string,
  planId: PlanTier,
  status: PlanStatus = 'active',
  extra?: {
    stripeCustomerId?: string | null;
    stripeSubscriptionId?: string | null;
    currentPeriodEnd?: Date | string | null;
  }
): Promise<OrganizationPlan> {
  const updated = await queryOne<OrganizationPlan>(
    `INSERT INTO organization_plans (
       organization_id, plan_id, status, stripe_customer_id, stripe_subscription_id, current_period_end, updated_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, NOW())
     ON CONFLICT (organization_id) DO UPDATE SET
       plan_id = EXCLUDED.plan_id,
       status = EXCLUDED.status,
       stripe_customer_id = COALESCE(EXCLUDED.stripe_customer_id, organization_plans.stripe_customer_id),
       stripe_subscription_id = COALESCE(EXCLUDED.stripe_subscription_id, organization_plans.stripe_subscription_id),
       current_period_end = COALESCE(EXCLUDED.current_period_end, organization_plans.current_period_end),
       updated_at = NOW()
     RETURNING *`,
    [
      orgId,
      planId,
      status,
      extra?.stripeCustomerId || null,
      extra?.stripeSubscriptionId || null,
      extra?.currentPeriodEnd || null,
    ]
  );

  invalidatePlanCache(orgId);

  return updated!;
}
