/**
 * =============================================================================
 * Innoventix Platform — Plan Rules & Seat Limit Configuration
 * =============================================================================
 * 
 * CORE RULES:
 * 1. Free users get the full platform. Only team size and pending invites are limited.
 * 2. Limits are enforced on the server only. Hidden buttons are not security.
 * 3. Changing a number here changes the limit everywhere.
 * 
 * =============================================================================
 */

export type PlanId = 'free' | 'pro' | 'enterprise'

export interface PlanConfig {
  id: PlanId
  name: string
  priceMonthlyUsd: number | null
  maxMembers: number // Seats including the workspace owner
  maxPendingInvites: number
  canUseAllFeatures: boolean // Always true: free gets the full platform
  features: string[] // List of features displayed in the upgrade UI
}

export const PLANS: Record<'free' | 'pro' | 'enterprise', PlanConfig> = {
  free: {
    id: 'free',
    name: 'Free',
    priceMonthlyUsd: 0,
    maxMembers: 3,
    maxPendingInvites: 2,
    canUseAllFeatures: true,
    features: [
      'Up to 3 team members',
      'Up to 2 pending invitations',
      'Full CRM & pipeline management',
      'Unlimited client accounts',
      'Unlimited projects and tasks',
      'Client portal access',
      'Unified communication hub',
      'Custom automations and webhooks',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    priceMonthlyUsd: 35,
    maxMembers: 15,
    maxPendingInvites: 20,
    canUseAllFeatures: true,
    features: [
      'Up to 15 team members',
      'Up to 20 pending invitations',
      'Priority email delivery',
      'Full CRM & pipeline management',
      'Unlimited client accounts',
      'Unlimited projects and tasks',
      'Client portal access',
      'Unified communication hub',
      'Advanced executive analytics & reporting',
    ],
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    priceMonthlyUsd: null, // Contact sales
    maxMembers: 500,
    maxPendingInvites: 500,
    canUseAllFeatures: true,
    features: [
      'Up to 500 team members',
      'Up to 500 pending invitations',
      'Dedicated account manager',
      'Custom domain & branding options',
      'Custom SLA guarantees',
      'Tailored security and audit compliance',
    ],
  },
}

/**
 * Helper to fetch plan configuration by slug or tier ID
 */
export function getPlanConfig(planId?: string | null): PlanConfig {
  if (!planId) return PLANS.free
  const normalized = planId.toLowerCase()
  if (normalized === 'pro' || normalized === 'starter' || normalized === 'professional') {
    return PLANS.pro
  }
  if (normalized === 'enterprise' || normalized === 'lifetime') {
    return PLANS.enterprise
  }
  return PLANS.free
}
