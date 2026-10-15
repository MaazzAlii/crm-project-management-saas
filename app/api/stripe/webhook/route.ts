import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/client'
import { query, queryOne } from '@/lib/db'
import { setOrganizationPlan } from '@/lib/billing/current-plan'
import { logAuditEvent } from '@/lib/audit/logger'
import type Stripe from 'stripe'

export const dynamic = 'force-dynamic'

/**
 * POST /api/stripe/webhook (Prompt 47 / BILL-2 Phase B)
 * - Verifies cryptographic signature with STRIPE_WEBHOOK_SECRET.
 * - Production hardening: Fails loudly with 500 if STRIPE_WEBHOOK_SECRET is unconfigured in production.
 * - Atomic upfront deduplication: INSERT ... ON CONFLICT (id) DO NOTHING RETURNING id.
 * - If already processed/claimed, returns { received: true, duplicate: true } without running handlers.
 * - Handler failure recovery: If handler fails after row insertion, deletes row so Stripe's retry reprocesses it.
 * - Handles checkout.session.completed, customer.subscription.updated, customer.subscription.deleted,
 *   invoice.paid, invoice.payment_failed.
 */
export async function POST(req: NextRequest) {
  let body: string
  try {
    body = await req.text()
  } catch {
    return NextResponse.json({ error: 'Failed to read request body' }, { status: 400 })
  }

  const signature = req.headers.get('stripe-signature') || ''
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  let event: Stripe.Event

  try {
    if (!webhookSecret) {
      if (process.env.NODE_ENV === 'production') {
        console.error('[FATAL_SECURITY_ERROR] STRIPE_WEBHOOK_SECRET is unconfigured in production.')
        return NextResponse.json({ error: 'Webhook secret unconfigured' }, { status: 500 })
      }
      // Dev mode fallback only if no secret set
      event = JSON.parse(body) as Stripe.Event
    } else {
      if (!signature) {
        return NextResponse.json({ error: 'Missing Stripe-Signature header' }, { status: 400 })
      }
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    }
  } catch (err: any) {
    const errorMessage = err instanceof Error ? err.message : 'Invalid signature'
    console.error(`[STRIPE_WEBHOOK_VERIFY_FAILED] ${errorMessage}`)
    return NextResponse.json({ error: `Webhook Error: ${errorMessage}` }, { status: 400 })
  }

  // 1. Atomic upfront idempotency claim
  let insertResult: { rows: Array<{ id: string }> }
  try {
    insertResult = await query<{ id: string }>(
      `INSERT INTO stripe_processed_events (id, event_type, payload)
       VALUES ($1, $2, $3)
       ON CONFLICT (id) DO NOTHING
       RETURNING id`,
      [event.id, event.type, JSON.stringify(event)]
    )
  } catch (colErr: any) {
    // Graceful fallback if migration 0048 (payload column) is unapplied in local database
    if (colErr?.message?.includes('payload')) {
      insertResult = await query<{ id: string }>(
        `INSERT INTO stripe_processed_events (id, event_type)
         VALUES ($1, $2)
         ON CONFLICT (id) DO NOTHING
         RETURNING id`,
        [event.id, event.type]
      )
    } else {
      throw colErr
    }
  }

  // If RETURNING array is empty, this event was already inserted by a prior/concurrent request
  if (!insertResult.rows || insertResult.rows.length === 0) {
    return NextResponse.json({ received: true, duplicate: true }, { status: 200 })
  }

  let matchedOrgId: string | null = null

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const organizationId =
          (session.metadata?.organization_id as string) ||
          (session.metadata?.organizationId as string)
        const subscriptionId = session.subscription as string
        const customerId = session.customer as string

        if (organizationId) {
          matchedOrgId = organizationId

          let currentPeriodEnd: Date | undefined
          if (subscriptionId) {
            try {
              const sub = await stripe.subscriptions.retrieve(subscriptionId)
              currentPeriodEnd = new Date(((sub as any).current_period_end || Date.now() / 1000) * 1000)
            } catch (err) {
              console.warn('Could not retrieve subscription details during checkout completion:', err)
            }
          }

          // 1. Update organization_plans to Pro
          await setOrganizationPlan(organizationId, 'pro', 'active', {
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            currentPeriodEnd,
          })

          // 2. Sync tenant organization record
          await query(
            `UPDATE organizations
             SET plan_tier = 'pro',
                 stripe_customer_id = COALESCE($1, stripe_customer_id),
                 updated_at = NOW()
             WHERE id = $2`,
            [customerId, organizationId]
          )

          // 3. Audit log
          try {
            await logAuditEvent({
              organizationId,
              action: 'STRIPE_CHECKOUT_COMPLETED',
              targetType: 'subscription',
              targetId: subscriptionId || session.id,
              details: { customerId, plan: 'pro', status: 'active' },
            })
          } catch (e) {}
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string
        const subData = subscription as unknown as { current_period_end: number }
        const currentPeriodEnd = new Date((subData.current_period_end || Date.now() / 1000) * 1000)

        // Find organization by customer ID or subscription metadata
        const orgMeta = subscription.metadata?.organization_id
        let orgId: string | undefined = orgMeta

        if (!orgId) {
          const orgRow = await queryOne<{ id: string }>(
            'SELECT organization_id as id FROM organization_plans WHERE stripe_customer_id = $1 OR stripe_subscription_id = $2',
            [customerId, subscription.id]
          )
          orgId = orgRow?.id
        }

        if (orgId) {
          matchedOrgId = orgId

          // Map Stripe status to PlanStatus ('active', 'past_due', 'canceled')
          const mappedStatus =
            subscription.status === 'past_due'
              ? 'past_due'
              : subscription.status === 'canceled' || subscription.status === 'unpaid'
              ? 'canceled'
              : 'active'

          const planTier = mappedStatus === 'active' ? 'pro' : 'free'

          await setOrganizationPlan(orgId, planTier, mappedStatus, {
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscription.id,
            currentPeriodEnd,
          })

          await query(
            `UPDATE organizations
             SET billing_status = $1,
                 updated_at = NOW()
             WHERE id = $2`,
            [mappedStatus, orgId]
          )

          try {
            await logAuditEvent({
              organizationId: orgId,
              action: 'STRIPE_SUBSCRIPTION_UPDATED',
              targetType: 'subscription',
              targetId: subscription.id,
              details: { status: subscription.status, mappedStatus, planTier },
            })
          } catch (e) {}
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        const orgMeta = subscription.metadata?.organization_id
        let orgId: string | undefined = orgMeta

        if (!orgId) {
          const orgRow = await queryOne<{ id: string }>(
            'SELECT organization_id as id FROM organization_plans WHERE stripe_customer_id = $1 OR stripe_subscription_id = $2',
            [customerId, subscription.id]
          )
          orgId = orgRow?.id
        }

        if (orgId) {
          matchedOrgId = orgId

          // Plan falls back to free. Existing members remain intact, but new invites will be constrained by free limits.
          await setOrganizationPlan(orgId, 'free', 'canceled', {
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscription.id,
          })

          await query(
            `UPDATE organizations
             SET plan_tier = 'free',
                 billing_status = 'canceled',
                 updated_at = NOW()
             WHERE id = $1`,
            [orgId]
          )

          try {
            await logAuditEvent({
              organizationId: orgId,
              action: 'STRIPE_SUBSCRIPTION_CANCELED',
              targetType: 'subscription',
              targetId: subscription.id,
              details: { status: 'canceled', fallbackPlan: 'free' },
            })
          } catch (e) {}
        }
        break
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string
        const subscriptionId = ((invoice as any).subscription as string) || null

        const orgRow = await queryOne<{ id: string }>(
          'SELECT organization_id as id FROM organization_plans WHERE stripe_customer_id = $1 OR stripe_subscription_id = $2',
          [customerId, subscriptionId]
        )

        if (orgRow?.id) {
          matchedOrgId = orgRow.id
          try {
            await logAuditEvent({
              organizationId: orgRow.id,
              action: 'STRIPE_INVOICE_PAID',
              targetType: 'invoice',
              targetId: invoice.id,
              details: {
                customerId,
                subscriptionId,
                amountPaid: invoice.amount_paid,
                currency: invoice.currency,
              },
            })
          } catch (e) {}
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string
        const subscriptionId = ((invoice as any).subscription as string) || null

        const orgRow = await queryOne<{ id: string }>(
          'SELECT organization_id as id FROM organization_plans WHERE stripe_customer_id = $1 OR stripe_subscription_id = $2',
          [customerId, subscriptionId]
        )

        if (orgRow?.id) {
          matchedOrgId = orgRow.id
          try {
            await logAuditEvent({
              organizationId: orgRow.id,
              action: 'STRIPE_INVOICE_PAYMENT_FAILED',
              targetType: 'invoice',
              targetId: invoice.id,
              details: {
                customerId,
                subscriptionId,
                amountDue: invoice.amount_due,
                attemptCount: invoice.attempt_count,
              },
            })
          } catch (e) {}
        }
        break
      }
    }

    // Enrich processed event with organization ID if resolved
    if (matchedOrgId) {
      try {
        await query(
          'UPDATE stripe_processed_events SET organization_id = $1 WHERE id = $2',
          [matchedOrgId, event.id]
        )
      } catch (enrichErr) {
        console.warn('[STRIPE_WEBHOOK_ENRICH_WARN] Could not update organization_id:', enrichErr)
      }
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error: any) {
    console.error('[STRIPE_WEBHOOK_PROCESSING_EXCEPTION]', error)

    // Option (b) Handler failure recovery:
    // Delete the row from stripe_processed_events so Stripe retry is re-processed rather than silently skipped as duplicate.
    try {
      await query('DELETE FROM stripe_processed_events WHERE id = $1', [event.id])
    } catch (cleanupErr) {
      console.error('[STRIPE_WEBHOOK_CLEANUP_ERROR] Failed to delete event on handler error:', cleanupErr)
    }

    return NextResponse.json({ error: error.message || 'Webhook processing error' }, { status: 500 })
  }
}
