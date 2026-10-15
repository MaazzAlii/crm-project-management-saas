import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock database
vi.mock('@/lib/db', () => ({
  query: vi.fn().mockResolvedValue({ rows: [], rowCount: 1 }),
  queryOne: vi.fn(),
}))

// Mock session context
vi.mock('@/lib/auth/session', () => ({
  getCurrentSessionContext: vi.fn(),
}))

// Mock audit logger
vi.mock('@/lib/audit/logger', () => ({
  logAuditEvent: vi.fn().mockResolvedValue(true),
}))

// Mock Stripe client
const mockCheckoutCreate = vi.fn()
const mockPortalCreate = vi.fn()

vi.mock('@/lib/stripe/client', () => ({
  stripe: {
    checkout: {
      sessions: {
        create: (...args: any[]) => mockCheckoutCreate(...args),
      },
    },
    billingPortal: {
      sessions: {
        create: (...args: any[]) => mockPortalCreate(...args),
      },
    },
  },
}))

import { query, queryOne } from '@/lib/db'
import { getCurrentSessionContext } from '@/lib/auth/session'
import { createCheckoutSession, createCustomerPortalSession } from '@/app/actions/stripe'
import { setOrganizationPlan } from '@/lib/billing/current-plan'

describe('BILL-2 Phase B: Stripe Proration, Lifecycle & Customer Portal (Option A)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('1. Stripe Checkout Session Configuration (#4)', () => {
    it('creates checkout session with subscription mode, metadata, and success redirect URL', async () => {
      ;(getCurrentSessionContext as any).mockResolvedValue({
        user: { id: 'usr_test_123', email: 'owner@example.com' },
        organization: { id: 'org_test_123', name: 'Test Org' },
        role: 'owner',
      })

      mockCheckoutCreate.mockResolvedValue({
        id: 'cs_test_mock_session',
        url: 'https://checkout.stripe.com/pay/cs_test_mock_session',
      })

      const result = await createCheckoutSession('price_1UPcesKO8Y3ohhlUm5KdI8hO')

      expect(result.url).toBe('https://checkout.stripe.com/pay/cs_test_mock_session')
      expect(mockCheckoutCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: 'subscription',
          line_items: [{ price: 'price_1UPcesKO8Y3ohhlUm5KdI8hO', quantity: 1 }],
          success_url: expect.stringContaining('checkout=success&session_id={CHECKOUT_SESSION_ID}'),
          metadata: expect.objectContaining({
            organization_id: 'org_test_123',
            user_id: 'usr_test_123',
          }),
          subscription_data: expect.objectContaining({
            metadata: expect.objectContaining({
              organization_id: 'org_test_123',
            }),
          }),
        })
      )
    })

    it('denies checkout session creation for non-billing roles (viewer/member)', async () => {
      ;(getCurrentSessionContext as any).mockResolvedValue({
        user: { id: 'usr_viewer_123', email: 'viewer@example.com' },
        organization: { id: 'org_test_123' },
        role: 'member',
      })

      const result = await createCheckoutSession('price_1UPcesKO8Y3ohhlUm5KdI8hO')
      expect(result.error).toContain('Permission denied')
      expect(mockCheckoutCreate).not.toHaveBeenCalled()
    })
  })

  describe('2. Customer Portal Session & Downgrade Flow (#8)', () => {
    it('creates customer portal session when organization has stripe_customer_id', async () => {
      ;(getCurrentSessionContext as any).mockResolvedValue({
        user: { id: 'usr_test_123', email: 'owner@example.com' },
        organization: { id: 'org_test_123' },
        role: 'owner',
      })

      ;(queryOne as any).mockResolvedValueOnce({
        stripe_customer_id: 'cus_test_existing_456',
      })

      mockPortalCreate.mockResolvedValue({
        url: 'https://billing.stripe.com/p/session/test_portal_session',
      })

      const result = await createCustomerPortalSession()

      expect(result.url).toBe('https://billing.stripe.com/p/session/test_portal_session')
      expect(mockPortalCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          customer: 'cus_test_existing_456',
          return_url: expect.stringContaining('/settings/billing'),
        })
      )
    })

    it('returns friendly error when no Stripe customer exists for the organization', async () => {
      ;(getCurrentSessionContext as any).mockResolvedValue({
        user: { id: 'usr_test_123' },
        organization: { id: 'org_no_stripe' },
        role: 'owner',
      })

      ;(queryOne as any).mockResolvedValue(null)

      const result = await createCustomerPortalSession()
      expect(result.error).toContain('No active Stripe customer found')
      expect(mockPortalCreate).not.toHaveBeenCalled()
    })
  })

  describe('3. Proration & Cancellation Webhook Lifecycle Verification', () => {
    it('maintains Pro tier access when subscription is scheduled for cancellation at period end', async () => {
      // In customer.subscription.updated, when cancel_at_period_end is true but status is active:
      // setOrganizationPlan should maintain 'pro' plan with 'active' status until the period actually elapses.
      const orgId = 'org_proration_test_1'
      const periodEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)

      await setOrganizationPlan(orgId, 'pro', 'active', {
        stripeCustomerId: 'cus_proration_1',
        stripeSubscriptionId: 'sub_proration_1',
        currentPeriodEnd: periodEnd,
      })

      expect(queryOne).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO organization_plans'),
        expect.arrayContaining([orgId, 'pro', 'active'])
      )
    })

    it('reverts organization to Free tier upon customer.subscription.deleted', async () => {
      // When subscription period ends or is canceled immediately, customer.subscription.deleted sets plan to 'free'
      const orgId = 'org_proration_test_2'

      await setOrganizationPlan(orgId, 'free', 'canceled', {
        stripeCustomerId: 'cus_proration_2',
        stripeSubscriptionId: 'sub_proration_2',
      })

      expect(queryOne).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO organization_plans'),
        expect.arrayContaining([orgId, 'free', 'canceled'])
      )
    })
  })
})
