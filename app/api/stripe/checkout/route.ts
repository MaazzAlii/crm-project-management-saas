import { NextRequest } from 'next/server'
import { getAuthFromRequest } from '@/lib/auth/middleware'
import { stripe } from '@/lib/stripe/client'
import { getProPriceId } from '@/lib/stripe/config'
import { queryOne } from '@/lib/db'
import { apiSuccess, apiError, handleApiError } from '@/lib/utils/response'

/**
 * POST /api/stripe/checkout (Prompt 46 / BILL-2C)
 * Creates a Stripe Checkout Session in subscription mode for Pro tier.
 * Organization ID strictly derived from session context, never request body.
 */
export async function POST(request: NextRequest) {
  try {
    const proPriceId = getProPriceId()

    const auth = getAuthFromRequest(request)
    if (!auth || !auth.orgId) {
      return apiError('Unauthorized: Active organization session required', 401, 'UNAUTHORIZED')
    }

    // Fetch organization and existing customer ID if any
    const org = await queryOne<{ id: string; name: string; stripe_customer_id?: string | null }>(
      'SELECT id, name, stripe_customer_id FROM organizations WHERE id = $1',
      [auth.orgId]
    )

    if (!org) {
      return apiError('Organization not found', 404, 'NOT_FOUND')
    }

    const baseUrl = (process.env.APP_PUBLIC_URL || 'http://localhost:3000').replace(/\/$/, '')

    const sessionParams: any = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: proPriceId,
          quantity: 1,
        },
      ],
      metadata: {
        organization_id: auth.orgId,
        user_id: auth.userId,
      },
      subscription_data: {
        metadata: {
          organization_id: auth.orgId,
        },
      },
      success_url: `${baseUrl}/settings/billing?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/settings/billing`,
    }

    if (org.stripe_customer_id) {
      sessionParams.customer = org.stripe_customer_id
    } else if (auth.email) {
      sessionParams.customer_email = auth.email
    }

    const checkoutSession = await stripe.checkout.sessions.create(sessionParams)

    return apiSuccess({
      url: checkoutSession.url,
      sessionId: checkoutSession.id,
    })
  } catch (error: any) {
    if (error?.message?.includes('STRIPE_PRO_PRICE_ID')) {
      return apiError(error.message, 500, 'CONFIGURATION_ERROR')
    }
    return handleApiError(error)
  }
}
