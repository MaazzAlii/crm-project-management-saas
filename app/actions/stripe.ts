'use server'

import { stripe } from '@/lib/stripe/client'
import { createClient } from '@/lib/supabase/server'
import { getCurrentSessionContext } from '@/lib/auth/session'
import { logAuditEvent } from '@/lib/audit/logger'

export async function createCheckoutSession(priceId: string) {
  const session = await getCurrentSessionContext()

  if (!session || !session.organization) {
    return { error: 'Unauthorized: Active organization context required.' }
  }

  // Ensure user has owner or billing_manager role
  if (!['owner', 'admin', 'billing_manager'].includes(session.role || '')) {
    return { error: 'Permission denied: Billing changes require owner or billing manager role.' }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      billing_address_collection: 'required',
      customer_email: session.user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${appUrl}/settings/billing?success=true`,
      cancel_url: `${appUrl}/settings/billing?canceled=true`,
      metadata: {
        organizationId: session.organization.id,
        userId: session.user.id,
      },
    })

    try {
      await logAuditEvent({
        actorId: session.user.id,
        organizationId: session.organization.id,
        action: 'CHECKOUT_SESSION_INITIATED',
        targetType: 'billing',
        targetId: priceId,
        details: { priceId, sessionId: checkoutSession.id },
      })
    } catch (e) {}

    return { url: checkoutSession.url }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Stripe checkout failed'
    return { error: message }
  }
}

export async function createCustomerPortalSession() {
  const session = await getCurrentSessionContext()

  if (!session || !session.organization) {
    return { error: 'Unauthorized' }
  }

  const supabase = await createClient()

  const { data: sub } = await supabase
    .from('organization_subscriptions')
    .select('stripe_customer_id')
    .eq('organization_id', session.organization.id)
    .single()

  if (!sub || !sub.stripe_customer_id) {
    return { error: 'No active Stripe customer found for this organization.' }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  try {
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: `${appUrl}/settings/billing`,
    })

    try {
      await logAuditEvent({
        actorId: session.user.id,
        organizationId: session.organization.id,
        action: 'BILLING_PORTAL_OPENED',
        targetType: 'billing',
        targetId: sub.stripe_customer_id,
        details: { customerId: sub.stripe_customer_id },
      })
    } catch (e) {}

    return { url: portalSession.url }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Stripe portal failed'
    return { error: message }
  }
}
