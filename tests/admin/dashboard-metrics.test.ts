import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getAdminDashboardMetrics,
  clearAdminDashboardMetricsCache,
} from '@/lib/services/dashboard-metrics'
import * as db from '@/lib/db'

describe('ADMIN-1 Dashboard Metrics & MRR Integrity', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    clearAdminDashboardMetricsCache()
  })

  describe('Guardrail 4: MRR Computation Excludes Lifetime & Sponsored Overrides', () => {
    it('excludes lifetime and sponsored override orgs with $0 payment from MRR revenue', async () => {
      const queryOneSpy = vi.spyOn(db, 'queryOne').mockImplementation(async (sql: string) => {
        expect(sql).toContain("op.plan_override IN ('lifetime', 'sponsored')")
        return {
          total_orgs: 5,
          active_orgs: 4,
          trial_orgs: 0,
          canceled_orgs: 1,
          suspended_orgs: 0,
          total_users: 15,
          active_users: 14,
          total_clients: 20,
          total_projects: 10,
          total_messages: 50,
          pending_invites: 3,
          monthly_ai_tokens: '5000',
          total_mrr: '158.00', // Only paid subscriptions counted; lifetime/sponsored $0 excluded
        }
      })

      const metrics = await getAdminDashboardMetrics(true)
      expect(metrics.totalMrr).toBe(158)
      expect(metrics.totalOrganizations).toBe(5)
      expect(metrics.totalUsers).toBe(15)
      expect(queryOneSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('60-Second In-Memory Caching Singleton', () => {
    it('returns cached metrics on subsequent calls without querying DB within 60s', async () => {
      let queryCallCount = 0
      vi.spyOn(db, 'queryOne').mockImplementation(async () => {
        queryCallCount++
        return {
          total_orgs: 100,
          active_orgs: 90,
          trial_orgs: 5,
          canceled_orgs: 5,
          suspended_orgs: 0,
          total_users: 250,
          active_users: 240,
          total_clients: 80,
          total_projects: 60,
          total_messages: 500,
          pending_invites: 12,
          monthly_ai_tokens: 0,
          total_mrr: '450.00',
        }
      })

      // 1. First call - queries database
      const firstMetrics = await getAdminDashboardMetrics()
      expect(queryCallCount).toBe(1)
      expect(firstMetrics.totalOrganizations).toBe(100)

      // 2. Second call within 60s - returns from global cache without DB call
      const secondMetrics = await getAdminDashboardMetrics()
      expect(queryCallCount).toBe(1)
      expect(secondMetrics).toEqual(firstMetrics)

      // 3. Clear cache and call again - executes DB query
      clearAdminDashboardMetricsCache()
      const thirdMetrics = await getAdminDashboardMetrics()
      expect(queryCallCount).toBe(2)
      expect(thirdMetrics.totalOrganizations).toBe(100)
    })
  })

  describe('Empty Database Handling (Zero Invention / No Fake Fallbacks)', () => {
    it('returns clean zeroes and never invents mock data if DB is empty', async () => {
      vi.spyOn(db, 'queryOne').mockResolvedValueOnce({
        total_orgs: 0,
        active_orgs: 0,
        trial_orgs: 0,
        canceled_orgs: 0,
        suspended_orgs: 0,
        total_users: 0,
        active_users: 0,
        total_clients: 0,
        total_projects: 0,
        total_messages: 0,
        pending_invites: 0,
        monthly_ai_tokens: 0,
        total_mrr: 0,
      })

      const metrics = await getAdminDashboardMetrics(true)
      expect(metrics.totalOrganizations).toBe(0)
      expect(metrics.totalMrr).toBe(0)
      expect(metrics.totalClients).toBe(0)
      expect(metrics.totalProjects).toBe(0)
      expect(metrics.totalMessages).toBe(0)
      // Assert explicitly that it does NOT return the old hardcoded fake values ($357, 42 clients, 88 projects)
      expect(metrics.totalMrr).not.toBe(357)
      expect(metrics.totalClients).not.toBe(42)
      expect(metrics.totalProjects).not.toBe(88)
      expect(metrics.totalMessages).not.toBe(1240)
    })
  })
})
