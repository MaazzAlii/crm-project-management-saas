/**
 * =============================================================================
 * Innoventix Platform v2 — Billing & Subscription Limits Service
 * =============================================================================
 * Business logic layer for Multi-Tenant Plan Quotas, Limits, Invoices, and Stripe.
 */

import { query, queryOne } from '../db';
import { orgRepo } from '../db/repositories/org-repo';
import { auditRepo } from '../db/repositories/audit-repo';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/error-handler';

export interface PlanLimits {
  name: string;
  priceMonthly: number;
  maxClients: number;
  maxProjects: number;
  maxTeamMembers: number;
  aiFeaturesEnabled: boolean;
  clientPortalEnabled: boolean;
}

export const PLAN_LIMITS_MAP: Record<string, PlanLimits> = {
  free: {
    name: 'Free Starter',
    priceMonthly: 0,
    maxClients: 5,
    maxProjects: 3,
    maxTeamMembers: 2,
    aiFeaturesEnabled: false,
    clientPortalEnabled: false,
  },
  starter: {
    name: 'Starter Tier',
    priceMonthly: 29,
    maxClients: 25,
    maxProjects: 15,
    maxTeamMembers: 5,
    aiFeaturesEnabled: true,
    clientPortalEnabled: true,
  },
  pro: {
    name: 'Professional Tier',
    priceMonthly: 79,
    maxClients: 100,
    maxProjects: 50,
    maxTeamMembers: 15,
    aiFeaturesEnabled: true,
    clientPortalEnabled: true,
  },
  enterprise: {
    name: 'Enterprise Tier',
    priceMonthly: 199,
    maxClients: 99999,
    maxProjects: 99999,
    maxTeamMembers: 99999,
    aiFeaturesEnabled: true,
    clientPortalEnabled: true,
  },
};

export class BillingService {
  /**
   * List all available subscription plans
   */
  getPlans() {
    return Object.entries(PLAN_LIMITS_MAP).map(([key, plan]) => ({
      id: key,
      ...plan,
    }));
  }

  /**
   * Get live resource usage vs plan limits for an organization
   */
  async getUsageAndLimits(orgId: string) {
    const org = await orgRepo.findById(orgId);
    if (!org) {
      throw new NotFoundError('Organization not found');
    }

    const planTier = (org as any).plan_tier || 'free';
    const limits = PLAN_LIMITS_MAP[planTier] || PLAN_LIMITS_MAP.free;

    // Aggregate counts
    const [clientsRes, projectsRes, membersRes] = await Promise.all([
      queryOne<{ count: string }>('SELECT COUNT(*) as count FROM clients WHERE organization_id = $1', [orgId]),
      queryOne<{ count: string }>('SELECT COUNT(*) as count FROM projects WHERE organization_id = $1', [orgId]),
      queryOne<{ count: string }>('SELECT COUNT(*) as count FROM organization_members WHERE organization_id = $1', [orgId]),
    ]);

    const clientsCount = parseInt(clientsRes?.count || '0', 10);
    const projectsCount = parseInt(projectsRes?.count || '0', 10);
    const membersCount = parseInt(membersRes?.count || '0', 10);

    return {
      planTier,
      limits,
      usage: {
        clients: { current: clientsCount, max: limits.maxClients, percentage: Math.min(100, (clientsCount / limits.maxClients) * 100) },
        projects: { current: projectsCount, max: limits.maxProjects, percentage: Math.min(100, (projectsCount / limits.maxProjects) * 100) },
        teamMembers: { current: membersCount, max: limits.maxTeamMembers, percentage: Math.min(100, (membersCount / limits.maxTeamMembers) * 100) },
      },
    };
  }

  /**
   * Assert that an organization has not exceeded a specific resource quota
   */
  async assertQuotaAvailable(orgId: string, resource: 'clients' | 'projects' | 'teamMembers'): Promise<void> {
    const { limits, usage } = await this.getUsageAndLimits(orgId);
    const resourceUsage = usage[resource];

    if (resourceUsage.current >= resourceUsage.max) {
      throw new ForbiddenError(
        `Plan limit exceeded: Your current plan allows up to ${resourceUsage.max} ${resource}. Please upgrade your subscription to continue.`
      );
    }
  }

  /**
   * Upgrade or modify an organization's subscription tier
   */
  async updateSubscriptionTier(orgId: string, actorUserId: string, planTier: string) {
    if (!PLAN_LIMITS_MAP[planTier]) {
      throw new ValidationError(`Invalid plan tier: ${planTier}`);
    }

    await query(
      `UPDATE organizations 
       SET plan_tier = $1, 
           updated_at = NOW() 
       WHERE id = $2`,
      [planTier, orgId]
    );

    await auditRepo.log({
      organizationId: orgId,
      userId: actorUserId,
      action: 'ORGANIZATION_PLAN_UPDATED',
      resourceType: 'organization',
      resourceId: orgId,
      metadata: { newPlanTier: planTier },
    });

    return {
      organizationId: orgId,
      planTier,
      limits: PLAN_LIMITS_MAP[planTier],
    };
  }

  /**
   * Get billing invoice history for an organization
   */
  async getInvoices(orgId: string) {
    const res = await query(
      `SELECT id, amount, currency, status, invoice_url, created_at 
       FROM invoices 
       WHERE organization_id = $1 
       ORDER BY created_at DESC`,
      [orgId]
    ).catch(() => ({ rows: [] })); // safe fallback if table empty or mock

    return res.rows;
  }
}

export const billingService = new BillingService();
