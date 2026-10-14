import { getCurrentPlan } from '../billing/current-plan';
import { orgRepo } from '../db/repositories/org-repo';
import { invitationRepo } from '../db/repositories/invitation-repo';
import { PoolClient } from 'pg';

export interface PlanLimitCheck {
  allowed: boolean;
  reason?: 'MEMBER_LIMIT' | 'PENDING_LIMIT';
  currentCount: number;
  limit: number;
  planName: string;
  upgradeUrl: string;
  message?: string;
}

/**
 * Check whether an organization has reached its active member limit.
 * - During invite creation: evaluates seats used (active members + pending invitations).
 * - During invite acceptance: evaluates active members count directly.
 */
export async function checkMemberLimit(
  organizationId: string,
  options?: { client?: PoolClient; isInviteCreation?: boolean }
): Promise<PlanLimitCheck> {
  const planInfo = await getCurrentPlan(organizationId);
  const planConfig = planInfo.planConfig;
  const upgradeUrl = '/settings/billing';

  let currentCount: number;
  if (options?.client) {
    const res = await options.client.query(
      'SELECT count(*) as count FROM organization_members WHERE organization_id = $1',
      [organizationId]
    );
    currentCount = parseInt(res.rows[0]?.count || '0', 10);
  } else if (options?.isInviteCreation) {
    currentCount = await orgRepo.countSeatsUsed(organizationId);
  } else {
    currentCount = await orgRepo.countMembers(organizationId);
  }

  const limit = planConfig.maxMembers;
  const allowed = currentCount < limit;

  return {
    allowed,
    ...(allowed ? {} : { reason: 'MEMBER_LIMIT' as const }),
    currentCount,
    limit,
    planName: planConfig.name,
    upgradeUrl,
    message: allowed
      ? undefined
      : `${planConfig.name} plan allows up to ${limit} team members. Upgrade to invite more.`,
  };
}

/**
 * Check whether an organization has reached its maximum allowed pending invitations.
 */
export async function checkPendingInviteLimit(
  organizationId: string,
  options?: { client?: PoolClient }
): Promise<PlanLimitCheck> {
  const planInfo = await getCurrentPlan(organizationId);
  const planConfig = planInfo.planConfig;
  const upgradeUrl = '/settings/billing';

  let currentCount: number;
  if (options?.client) {
    const res = await options.client.query(
      `SELECT count(*) as count FROM invitations WHERE organization_id = $1 AND status = 'pending'`,
      [organizationId]
    );
    currentCount = parseInt(res.rows[0]?.count || '0', 10);
  } else {
    currentCount = await invitationRepo.countPending(organizationId);
  }

  const limit = planConfig.maxPendingInvites;
  const allowed = currentCount < limit;

  return {
    allowed,
    ...(allowed ? {} : { reason: 'PENDING_LIMIT' as const }),
    currentCount,
    limit,
    planName: planConfig.name,
    upgradeUrl,
    message: allowed
      ? undefined
      : `${planConfig.name} plan allows up to ${limit} pending invitations. Upgrade to invite more.`,
  };
}
