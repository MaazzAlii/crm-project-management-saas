import { getCurrentPlan } from '../billing/current-plan';
import { orgRepo } from '../db/repositories/org-repo';
import { invitationRepo } from '../db/repositories/invitation-repo';
import { queryOne } from '../db';
import { PoolClient } from 'pg';
import { PlanConfig } from '../../config/plans';

export interface PlanLimitCheck {
  allowed: boolean;
  reason?: 'MEMBER_LIMIT' | 'PENDING_LIMIT' | 'CLIENT_LIMIT' | 'PROJECT_LIMIT' | 'CHANNEL_LIMIT' | 'AI_LIMIT' | 'UPGRADE_REQUIRED';
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

/**
 * Check whether an organization has reached its client quota.
 */
export async function checkClientLimit(
  organizationId: string,
  options?: { client?: PoolClient }
): Promise<PlanLimitCheck> {
  const planInfo = await getCurrentPlan(organizationId);
  const planConfig = planInfo.planConfig;
  const upgradeUrl = '/settings/billing';

  let currentCount: number;
  if (options?.client) {
    const res = await options.client.query(
      'SELECT count(*) as count FROM clients WHERE organization_id = $1',
      [organizationId]
    );
    currentCount = parseInt(res.rows[0]?.count || '0', 10);
  } else {
    const res = await queryOne<{ count: string }>(
      'SELECT count(*) as count FROM clients WHERE organization_id = $1',
      [organizationId]
    );
    currentCount = parseInt(res?.count || '0', 10);
  }

  const limit = planConfig.maxClients;
  const allowed = currentCount < limit;

  return {
    allowed,
    ...(allowed ? {} : { reason: 'CLIENT_LIMIT' as const }),
    currentCount,
    limit,
    planName: planConfig.name,
    upgradeUrl,
    message: allowed
      ? undefined
      : `${planConfig.name} plan allows up to ${limit} clients. Upgrade to add more.`,
  };
}

/**
 * Check whether an organization has reached its project quota.
 */
export async function checkProjectLimit(
  organizationId: string,
  options?: { client?: PoolClient }
): Promise<PlanLimitCheck> {
  const planInfo = await getCurrentPlan(organizationId);
  const planConfig = planInfo.planConfig;
  const upgradeUrl = '/settings/billing';

  let currentCount: number;
  if (options?.client) {
    const res = await options.client.query(
      'SELECT count(*) as count FROM projects WHERE organization_id = $1',
      [organizationId]
    );
    currentCount = parseInt(res.rows[0]?.count || '0', 10);
  } else {
    const res = await queryOne<{ count: string }>(
      'SELECT count(*) as count FROM projects WHERE organization_id = $1',
      [organizationId]
    );
    currentCount = parseInt(res?.count || '0', 10);
  }

  const limit = planConfig.maxProjects;
  const allowed = currentCount < limit;

  return {
    allowed,
    ...(allowed ? {} : { reason: 'PROJECT_LIMIT' as const }),
    currentCount,
    limit,
    planName: planConfig.name,
    upgradeUrl,
    message: allowed
      ? undefined
      : `${planConfig.name} plan allows up to ${limit} projects. Upgrade to add more.`,
  };
}

/**
 * Check whether an organization has reached its connected communication channel quota.
 */
export async function checkChannelLimit(
  organizationId: string,
  options?: { client?: PoolClient }
): Promise<PlanLimitCheck> {
  const planInfo = await getCurrentPlan(organizationId);
  const planConfig = planInfo.planConfig;
  const upgradeUrl = '/settings/billing';

  let currentCount: number;
  const sql = "SELECT count(*) as count FROM communication_channels WHERE organization_id = $1 AND status = 'active'";
  if (options?.client) {
    const res = await options.client.query(sql, [organizationId]);
    currentCount = parseInt(res.rows[0]?.count || '0', 10);
  } else {
    const res = await queryOne<{ count: string }>(sql, [organizationId]);
    currentCount = parseInt(res?.count || '0', 10);
  }

  const limit = planConfig.maxChannels;
  const allowed = currentCount < limit;

  return {
    allowed,
    ...(allowed ? {} : { reason: 'CHANNEL_LIMIT' as const }),
    currentCount,
    limit,
    planName: planConfig.name,
    upgradeUrl,
    message: allowed
      ? undefined
      : `${planConfig.name} plan allows up to ${limit} communication channels. Upgrade to connect more.`,
  };
}

/**
 * Check whether an organization has reached its monthly AI invocation quota.
 */
export async function checkAIUsageLimit(
  organizationId: string,
  options?: { client?: PoolClient }
): Promise<PlanLimitCheck> {
  const planInfo = await getCurrentPlan(organizationId);
  const planConfig = planInfo.planConfig;
  const upgradeUrl = '/settings/billing';

  let currentCount: number;
  const sql = "SELECT count(*) as count FROM ai_usage_log WHERE organization_id = $1 AND created_at >= date_trunc('month', now())";
  if (options?.client) {
    const res = await options.client.query(sql, [organizationId]);
    currentCount = parseInt(res.rows[0]?.count || '0', 10);
  } else {
    const res = await queryOne<{ count: string }>(sql, [organizationId]);
    currentCount = parseInt(res?.count || '0', 10);
  }

  const limit = planConfig.maxAIRequestsMonthly;
  const allowed = currentCount < limit;

  return {
    allowed,
    ...(allowed ? {} : { reason: 'AI_LIMIT' as const }),
    currentCount,
    limit,
    planName: planConfig.name,
    upgradeUrl,
    message: allowed
      ? undefined
      : `${planConfig.name} plan allows up to ${limit} AI requests per month. Upgrade to continue using AI.`,
  };
}

/**
 * Check whether an organization's subscription plan entitles them to a specific feature flag.
 */
export async function checkFeatureAccess(
  organizationId: string,
  feature: 'clientPortal' | 'emailIntegration' | 'sso' | 'auditLogs' | 'apiAccess',
  _options?: { client?: PoolClient }
): Promise<PlanLimitCheck> {
  const planInfo = await getCurrentPlan(organizationId);
  const planConfig = planInfo.planConfig;
  const upgradeUrl = '/settings/billing';

  const flagMap: Record<string, keyof PlanConfig> = {
    clientPortal: 'clientPortalEnabled',
    emailIntegration: 'emailIntegrationEnabled',
    sso: 'ssoEnabled',
    auditLogs: 'auditLogsEnabled',
    apiAccess: 'apiAccessEnabled',
  };

  const featureNames: Record<string, string> = {
    clientPortal: 'Client Portal',
    emailIntegration: 'Email Integration',
    sso: 'Single Sign-On (SSO)',
    auditLogs: 'Audit Logs',
    apiAccess: 'API Access',
  };

  const flagKey = flagMap[feature];
  const allowed = !!planConfig[flagKey];
  const displayName = featureNames[feature] || feature;

  return {
    allowed,
    ...(allowed ? {} : { reason: 'UPGRADE_REQUIRED' as const }),
    currentCount: allowed ? 1 : 0,
    limit: 1,
    planName: planConfig.name,
    upgradeUrl,
    message: allowed
      ? undefined
      : `${displayName} is not available on ${planConfig.name} plan. Upgrade to access this feature.`,
  };
}
