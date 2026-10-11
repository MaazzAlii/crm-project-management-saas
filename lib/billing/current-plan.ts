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

/**
 * Fetch real-time active plan and seat limits for an organization
 */
export async function getCurrentPlan(orgId: string): Promise<CurrentPlanResult> {
  const cached = planCache.get(orgId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.result;
  }

  const row = await queryOne<OrganizationPlan>(
    'SELECT * FROM organization_plans WHERE organization_id = $1',
    [orgId]
  );

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

  // If status is past_due or canceled, treat as free for limits but show a banner
  const isRestricted = status === 'past_due' || status === 'canceled';
  const effectivePlanId: PlanTier = isRestricted ? 'free' : planId;
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
    showBanner: isRestricted,
    bannerType: isRestricted ? (status as 'past_due' | 'canceled') : null,
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
