import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/db', () => ({
  query: vi.fn(),
  queryOne: vi.fn(),
}))

import { queryOne } from '@/lib/db'
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

      ;(queryOne as any).mockResolvedValue({
        feature_limits: mockLimits,
      })

      const limits = await getOrganizationPlanLimits('org-pro-123')
      expect(limits.max_team_members).toBe(15)
      expect(limits.max_clients).toBe(100)
      expect(limits.ai_features_enabled).toBe(true)
      expect(limits.client_portal_enabled).toBe(true)
    })

    it('returns starter fallback limits when no subscription record exists', async () => {
      ;(queryOne as any).mockResolvedValue(null)

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
      ;(queryOne as any).mockImplementation((sql: string) => {
        if (sql.includes('organization_subscriptions')) {
          return Promise.resolve({
            feature_limits: { max_team_members: 5, max_clients: 25, max_projects: 50 },
          })
        }
        if (sql.includes('organization_members')) {
          return Promise.resolve({ count: '3' })
        }
        return Promise.resolve(null)
      })

      const result = await checkTeamMemberLimit('org-1')
      expect(result.allowed).toBe(true)
      expect(result.currentCount).toBe(3)
      expect(result.maxLimit).toBe(5)
      expect(result.reason).toBeUndefined()
    })

    it('blocks team member creation when at or exceeding the limit', async () => {
      ;(queryOne as any).mockImplementation((sql: string) => {
        if (sql.includes('organization_subscriptions')) {
          return Promise.resolve({
            feature_limits: { max_team_members: 5 },
          })
        }
        if (sql.includes('organization_members')) {
          return Promise.resolve({ count: '5' })
        }
        return Promise.resolve(null)
      })

      const result = await checkTeamMemberLimit('org-1')
      expect(result.allowed).toBe(false)
      expect(result.currentCount).toBe(5)
      expect(result.maxLimit).toBe(5)
      expect(result.reason).toContain('Organization limit reached (5 team members)')
    })

    it('blocks client creation when client limit reached', async () => {
      ;(queryOne as any).mockImplementation((sql: string) => {
        if (sql.includes('organization_subscriptions')) {
          return Promise.resolve({
            feature_limits: { max_clients: 10 },
          })
        }
        if (sql.includes('clients')) {
          return Promise.resolve({ count: '10' })
        }
        return Promise.resolve(null)
      })

      const result = await checkClientLimit('org-1')
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('Client limit reached')
    })

    it('blocks project creation when project limit reached', async () => {
      ;(queryOne as any).mockImplementation((sql: string) => {
        if (sql.includes('organization_subscriptions')) {
          return Promise.resolve({
            feature_limits: { max_projects: 20 },
          })
        }
        if (sql.includes('projects')) {
          return Promise.resolve({ count: '20' })
        }
        return Promise.resolve(null)
      })

      const result = await checkProjectLimit('org-1')
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('Project limit reached')
    })
  })

  describe('Proximity warning tiers in getOrganizationPlanUsageDetails', () => {
    it('evaluates normal, warning, critical, and exceeded thresholds correctly', async () => {
      ;(queryOne as any).mockImplementation((sql: string) => {
        if (sql.includes('organization_subscriptions')) {
          return Promise.resolve({
            id: 'sub-1',
            status: 'active',
            current_period_end: new Date(Date.now() + 864000000).toISOString(),
            cancel_at_period_end: false,
            plan_name: 'Growth Plan',
            plan_slug: 'growth',
            price_monthly: 99,
            feature_limits: {
              max_team_members: 10,
              max_clients: 100,
              max_projects: 50,
              storage_limit_gb: 20,
              communication_channels_included: 3,
              ai_features_enabled: true,
            },
          })
        }
        if (sql.includes('organization_members')) {
          return Promise.resolve({ count: '9' })
        }
        if (sql.includes('clients')) {
          return Promise.resolve({ count: '96' })
        }
        if (sql.includes('projects')) {
          return Promise.resolve({ count: '50' })
        }
        if (sql.includes('communication_channels')) {
          return Promise.resolve({ count: '1' })
        }
        if (sql.includes('ai_usage_log')) {
          return Promise.resolve({ count: '100' })
        }
        return Promise.resolve(null)
      })

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
      ;(queryOne as any).mockResolvedValue({
        feature_limits: { ai_features_enabled: false },
      })

      const allowed = await isAIFeatureAllowed('org-starter', 'reply_suggestions')
      expect(allowed).toBe(false)
    })

    it('returns true when capability is enabled on plan', async () => {
      ;(queryOne as any).mockResolvedValue({
        feature_limits: {
          ai_features_enabled: true,
          ai_capabilities: { reply_suggestions: true },
        },
      })

      const allowed = await isAIFeatureAllowed('org-pro', 'reply_suggestions')
      expect(allowed).toBe(true)
    })
  })
})
