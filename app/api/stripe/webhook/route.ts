import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/client'
import { createClient } from '@/lib/supabase/server'
import type Stripe from 'stripe'

export async function POST(req: Request) {
  const body = await req.text()
  const signature = headers().get('Stripe-Signature') as string

  let event: Stripe.Event

  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.warn('STRIPE_WEBHOOK_SECRET not configured. Skipping signature verification in dev mode.')
      event = JSON.parse(body) as Stripe.Event
    } else {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown webhook error'
    console.error(`Webhook signature verification failed: ${errorMessage}`)
    return new NextResponse(`Webhook Error: ${errorMessage}`, { status: 400 })
  }

  const supabase = await createClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const organizationId = session.metadata?.organizationId
      const subscriptionId = session.subscription as string

      if (organizationId && subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const subData = subscription as unknown as { current_period_start: number; current_period_end: number }
        
        await supabase
          .from('organization_subscriptions')
          .upsert({
            organization_id: organizationId,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: subscriptionId,
            status: subscription.status,
            current_period_start: new Date((subData.current_period_start || Date.now() / 1000) * 1000).toISOString(),
            current_period_end: new Date((subData.current_period_end || Date.now() / 1000) * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          }, { onConflict: 'organization_id' })
      }
      break
    }

    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const subData = subscription as unknown as { current_period_start: number; current_period_end: number }
      const customerId = subscription.customer as string

      // Sync database subscription status with Stripe source of truth
      await supabase
        .from('organization_subscriptions')
        .update({
          status: subscription.status,
          current_period_start: new Date((subData.current_period_start || Date.now() / 1000) * 1000).toISOString(),
          current_period_end: new Date((subData.current_period_end || Date.now() / 1000) * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_customer_id', customerId)
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string

      await supabase
        .from('organization_subscriptions')
        .update({
          status: 'past_due',
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_customer_id', customerId)
      break
    }
  }

  return NextResponse.json({ received: true })
}
