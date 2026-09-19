import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Supabase server client before importing plan-limits
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'
import {
  getOrganizationPlanLimits,
  checkTeamMemberLimit,
  checkClientLimit,
  checkProjectLimit,
  getOrganizationPlanUsageDetails,
  isAIFeatureAllowed,
} from '@/lib/billing/plan-limits'

describe('Billing & Plan Usage Calculations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getOrganizationPlanLimits', () => {
    it('returns plan feature limits when an active subscription exists', async () => {
      const mockLimits = {
        max_team_members: 15,
        max_clients: 100,
        max_projects: 200,
        storage_limit_gb: 50,
        client_portal_enabled: true,
        ai_features_enabled: true,
        ai_capabilities: {
          reply_suggestions: true,
          lead_scoring: true,
          task_extraction: true,
          weekly_narrative: true,
        },
        communication_channels_included: 5,
        analytics_level: 'advanced',
      }

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  subscription_plans: {
                    feature_limits: mockLimits,
                  },
                },
              }),
            }),
          }),
        }),
      }
      ;(createClient as any).mockResolvedValue(mockSupabase)

      const limits = await getOrganizationPlanLimits('org-pro-123')
      expect(limits.max_team_members).toBe(15)
      expect(limits.max_clients).toBe(100)
      expect(limits.ai_features_enabled).toBe(true)
      expect(limits.client_portal_enabled).toBe(true)
    })

    it('returns starter fallback limits when no subscription record exists', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: null }),
            }),
          }),
        }),
      }
      ;(createClient as any).mockResolvedValue(mockSupabase)

      const limits = await getOrganizationPlanLimits('org-no-sub')
      expect(limits.max_team_members).toBe(5)
      expect(limits.max_clients).toBe(25)
      expect(limits.max_projects).toBe(50)
      expect(limits.ai_features_enabled).toBe(false)
      expect(limits.client_portal_enabled).toBe(true)
    })
  })

  describe('Quota checks: Team, Client, Project', () => {
    it('allows team member creation when under the limit', async () => {
      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'organization_subscriptions') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: {
                      subscription_plans: {
                        feature_limits: { max_team_members: 5, max_clients: 25, max_projects: 50 },
                      },
                    },
                  }),
                }),
              }),
            }
          }
          if (table === 'organization_members') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ count: 3 }),
              }),
            }
          }
          return {}
        }),
      }
      ;(createClient as any).mockResolvedValue(mockSupabase)

      const result = await checkTeamMemberLimit('org-1')
      expect(result.allowed).toBe(true)
      expect(result.currentCount).toBe(3)
      expect(result.maxLimit).toBe(5)
      expect(result.reason).toBeUndefined()
    })

    it('blocks team member creation when at or exceeding the limit', async () => {
      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'organization_subscriptions') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: {
                      subscription_plans: {
                        feature_limits: { max_team_members: 5 },
                      },
                    },
                  }),
                }),
              }),
            }
          }
          if (table === 'organization_members') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ count: 5 }),
              }),
            }
          }
          return {}
        }),
      }
      ;(createClient as any).mockResolvedValue(mockSupabase)

      const result = await checkTeamMemberLimit('org-1')
      expect(result.allowed).toBe(false)
      expect(result.currentCount).toBe(5)
      expect(result.maxLimit).toBe(5)
      expect(result.reason).toContain('Organization limit reached (5 team members)')
    })

    it('blocks client creation when client limit reached', async () => {
      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'organization_subscriptions') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: {
                      subscription_plans: {
                        feature_limits: { max_clients: 10 },
                      },
                    },
                  }),
                }),
              }),
            }
          }
          if (table === 'clients') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ count: 10 }),
              }),
            }
          }
          return {}
        }),
      }
      ;(createClient as any).mockResolvedValue(mockSupabase)

      const result = await checkClientLimit('org-1')
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('Client limit reached')
    })

    it('blocks project creation when project limit reached', async () => {
      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'organization_subscriptions') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: {
                      subscription_plans: {
                        feature_limits: { max_projects: 20 },
                      },
                    },
                  }),
                }),
              }),
            }
          }
          if (table === 'projects') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ count: 20 }),
              }),
            }
          }
          return {}
        }),
      }
      ;(createClient as any).mockResolvedValue(mockSupabase)

      const result = await checkProjectLimit('org-1')
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('Project limit reached')
    })
  })

  describe('Proximity warning tiers in getOrganizationPlanUsageDetails', () => {
    it('evaluates normal, warning, critical, and exceeded thresholds correctly', async () => {
      // Setup limits: team=10, clients=100, projects=50
      // Current: team=9 (90% -> warning), clients=96 (96% -> critical), projects=50 (100% -> exceeded)
      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'organization_subscriptions') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: {
                      id: 'sub-1',
                      status: 'active',
                      current_period_end: new Date(Date.now() + 864000000).toISOString(),
                      cancel_at_period_end: false,
                      subscription_plans: {
                        name: 'Growth Plan',
                        slug: 'growth',
                        price_monthly: 99,
                        feature_limits: {
                          max_team_members: 10,
                          max_clients: 100,
                          max_projects: 50,
                          storage_limit_gb: 20,
                          communication_channels_included: 3,
                          ai_features_enabled: true,
                        },
                      },
                    },
                  }),
                }),
              }),
            }
          }
          if (table === 'organization_members') {
            return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ count: 9 }) }) }
          }
          if (table === 'clients') {
            return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ count: 96 }) }) }
          }
          if (table === 'projects') {
            return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ count: 50 }) }) }
          }
          if (table === 'communication_channels') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({ count: 1 }), // 1/3 (33% -> normal)
                }),
              }),
            }
          }
          if (table === 'ai_usage_log') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  gte: vi.fn().mockResolvedValue({ count: 100 }), // 100/500 (20% -> normal)
                }),
              }),
            }
          }
          return {}
        }),
      }
      ;(createClient as any).mockResolvedValue(mockSupabase)

      const usage = await getOrganizationPlanUsageDetails('org-growth')

      // Team members: 9/10 = 90% -> warning
      expect(usage.metrics.teamMembers.percentage).toBe(90)
      expect(usage.metrics.teamMembers.status).toBe('warning')

      // Clients: 96/100 = 96% -> critical
      expect(usage.metrics.clients.percentage).toBe(96)
      expect(usage.metrics.clients.status).toBe('critical')

      // Projects: 50/50 = 100% -> exceeded
      expect(usage.metrics.projects.percentage).toBe(100)
      expect(usage.metrics.projects.status).toBe('exceeded')

      // Channels: 1/3 = 33% -> normal
      expect(usage.metrics.channels.status).toBe('normal')

      // Aggregates
      expect(usage.hasWarnings).toBe(true)
      expect(usage.warningCount).toBe(3) // teamMembers, clients, projects
      expect(usage.highestProximityPercent).toBe(100)
    })
  })

  describe('isAIFeatureAllowed', () => {
    it('returns false when ai_features_enabled is false on plan', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  subscription_plans: {
                    feature_limits: { ai_features_enabled: false },
                  },
                },
              }),
            }),
          }),
        }),
      }
      ;(createClient as any).mockResolvedValue(mockSupabase)

      const allowed = await isAIFeatureAllowed('org-starter', 'reply_suggestions')
      expect(allowed).toBe(false)
    })

    it('returns true when capability is enabled on plan', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  subscription_plans: {
                    feature_limits: {
                      ai_features_enabled: true,
                      ai_capabilities: { reply_suggestions: true },
                    },
                  },
                },
              }),
            }),
          }),
        }),
      }
      ;(createClient as any).mockResolvedValue(mockSupabase)

      const allowed = await isAIFeatureAllowed('org-pro', 'reply_suggestions')
      expect(allowed).toBe(true)
    })
  })
})
