import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/billing/plan-limits', () => ({
  getOrganizationPlanLimits: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'
import { getOrganizationPlanLimits } from '@/lib/billing/plan-limits'
import { checkAIAccess } from '@/lib/ai/guard'

describe('AI Feature Gating (Dual-Tier Enforcement)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects evaluation when organizationId is empty', async () => {
    const result = await checkAIAccess('', 'reply_suggestions')
    expect(result.allowed).toBe(false)
    expect(result.code).toBe('PLAN_LIMIT_REACHED')
  })

  it('allows bypass for dev-org', async () => {
    const result = await checkAIAccess('dev-org', 'reply_suggestions')
    expect(result.allowed).toBe(true)
  })

  describe('Tier 1: Platform-Wide Super Admin Kill Switch & Feature Flags', () => {
    it('blocks access with KILL_SWITCH_ACTIVE when global ai_kill_switch is true', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  value: {
                    ai_kill_switch: true,
                  },
                },
              }),
            }),
          }),
        }),
      }
      ;(createClient as any).mockResolvedValue(mockSupabase)

      const result = await checkAIAccess('org-123', 'reply_suggestions')
      expect(result.allowed).toBe(false)
      expect(result.code).toBe('KILL_SWITCH_ACTIVE')
      expect(result.reason).toContain('temporarily suspended platform-wide')
    })

    it('blocks specific feature when individual platform toggle is false', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  value: {
                    ai_kill_switch: false,
                    ai_lead_scoring: false, // specifically disabled
                  },
                },
              }),
            }),
          }),
        }),
      }
      ;(createClient as any).mockResolvedValue(mockSupabase)

      const result = await checkAIAccess('org-123', 'lead_scoring')
      expect(result.allowed).toBe(false)
      expect(result.code).toBe('KILL_SWITCH_ACTIVE')
      expect(result.reason).toContain('AI lead scoring is currently disabled')
    })
  })

  describe('Tier 2: Organization Subscription Plan Limits', () => {
    it('blocks access with PLAN_LIMIT_REACHED when plan does not include AI', async () => {
      // Platform flags are open
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { value: { ai_kill_switch: false } },
              }),
            }),
          }),
        }),
      }
      ;(createClient as any).mockResolvedValue(mockSupabase)

      // Plan limits: AI disabled
      ;(getOrganizationPlanLimits as any).mockResolvedValue({
        ai_features_enabled: false,
      })

      const result = await checkAIAccess('org-starter', 'task_extraction')
      expect(result.allowed).toBe(false)
      expect(result.code).toBe('PLAN_LIMIT_REACHED')
      expect(result.reason).toContain('AI features are not enabled on your organization’s subscription plan')
    })

    it('blocks access with CAPABILITY_DISABLED when specific capability is false on plan', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { value: { ai_kill_switch: false } },
              }),
            }),
          }),
        }),
      }
      ;(createClient as any).mockResolvedValue(mockSupabase)

      // Plan has AI enabled, but weekly_narrative is false
      ;(getOrganizationPlanLimits as any).mockResolvedValue({
        ai_features_enabled: true,
        ai_capabilities: {
          weekly_narrative: false,
        },
      })

      const result = await checkAIAccess('org-pro', 'weekly_narrative')
      expect(result.allowed).toBe(false)
      expect(result.code).toBe('CAPABILITY_DISABLED')
      expect(result.reason).toContain('Your current plan does not include the weekly narrative AI capability')
    })
  })

  describe('Tier 3: Tenant Organization Admin Controls', () => {
    it('blocks access with FEATURE_DISABLED_BY_ORGANIZATION when org admin disabled the feature', async () => {
      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'platform_settings') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: { value: { ai_kill_switch: false } },
                  }),
                }),
              }),
            }
          }
          if (table === 'organizations') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: {
                      ai_feature_settings: {
                        reply_suggestions: false, // tenant admin turned it off
                      },
                    },
                  }),
                }),
              }),
            }
          }
          return {}
        }),
      }
      ;(createClient as any).mockResolvedValue(mockSupabase)

      ;(getOrganizationPlanLimits as any).mockResolvedValue({
        ai_features_enabled: true,
      })

      const result = await checkAIAccess('org-pro', 'reply_suggestions')
      expect(result.allowed).toBe(false)
      expect(result.code).toBe('FEATURE_DISABLED_BY_ORGANIZATION')
      expect(result.reason).toContain('disabled by your organization administrator')
    })

    it('allows access when platform switch, plan limits, and org settings all permit', async () => {
      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'platform_settings') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: { value: { ai_kill_switch: false } },
                  }),
                }),
              }),
            }
          }
          if (table === 'organizations') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: {
                      ai_feature_settings: {
                        reply_suggestions: true,
                      },
                    },
                  }),
                }),
              }),
            }
          }
          return {}
        }),
      }
      ;(createClient as any).mockResolvedValue(mockSupabase)

      ;(getOrganizationPlanLimits as any).mockResolvedValue({
        ai_features_enabled: true,
        ai_capabilities: {
          reply_suggestions: true,
        },
      })

      const result = await checkAIAccess('org-enterprise', 'reply_suggestions')
      expect(result.allowed).toBe(true)
      expect(result.reason).toBeUndefined()
    })
  })
})
