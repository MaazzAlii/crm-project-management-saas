/**
 * =============================================================================
 * Innoventix Platform — Plan Usage and Quota Analytics Service
 * =============================================================================
 * 
 * Provides real-time plan status, member and seat usage, pending invite quotas,
 * user email verification status, and organization domain verification status.
 * Strictly scoped to session organization only.
 * 
 * =============================================================================
 */

import { getCurrentPlan } from './current-plan';
import { orgRepo } from '../db/repositories/org-repo';
import { invitationRepo } from '../db/repositories/invitation-repo';
import { userRepo } from '../db/repositories/user-repo';
import { billingService } from '../services/billing-service';

export interface PlanUsageResult {
  plan: {
    id: string;
    name: string;
    priceMonthlyUsd: number | null;
  };
  planId: string;
  planName: string;
  planTier: string;
  maxMembers: number;
  membersUsed: number;
  seatsUsed: number;
  pendingInvites: number;
  maxPendingInvites: number;
  limitReached: {
    seats: boolean;
    pendingInvites: boolean;
  };
  seatLimitReached: boolean;
  pendingLimitReached: boolean;
  emailVerified: boolean;
  domainVerified: boolean;
  verifiedDomain: string | null;
  limits?: any;
  usage?: any;
}

/**
 * Fetch consolidated plan and usage statistics for an organization and user
 */
export async function getBillingUsage(orgId: string, userId?: string): Promise<PlanUsageResult> {
  const [currentPlan, membersCount, pendingInvites, org, user, legacyUsage] = await Promise.all([
    getCurrentPlan(orgId),
    orgRepo.countMembers(orgId),
    invitationRepo.countPending(orgId),
    orgRepo.findById(orgId),
    userId ? userRepo.findById(userId) : Promise.resolve(null),
    billingService.getUsageAndLimits(orgId).catch(() => null),
  ]);

  const planConfig = currentPlan.planConfig;
  const seatsUsed = membersCount + pendingInvites;
  const seatLimitReached = seatsUsed >= planConfig.maxMembers;
  const pendingLimitReached = pendingInvites >= planConfig.maxPendingInvites;

  const emailVerified = !!(user && (user.email_verified || user.email_verified_at));
  const domainVerified = !!(org && org.verified_domain && org.domain_verified_at);
  const verifiedDomain = org?.verified_domain || null;

  return {
    plan: {
      id: planConfig.id,
      name: planConfig.name,
      priceMonthlyUsd: planConfig.priceMonthlyUsd,
    },
    planId: planConfig.id,
    planName: planConfig.name,
    planTier: planConfig.id,
    maxMembers: planConfig.maxMembers,
    membersUsed: membersCount,
    seatsUsed,
    pendingInvites,
    maxPendingInvites: planConfig.maxPendingInvites,
    limitReached: {
      seats: seatLimitReached,
      pendingInvites: pendingLimitReached,
    },
    seatLimitReached,
    pendingLimitReached,
    emailVerified,
    domainVerified,
    verifiedDomain,
    limits: legacyUsage?.limits,
    usage: legacyUsage?.usage,
  };
}
