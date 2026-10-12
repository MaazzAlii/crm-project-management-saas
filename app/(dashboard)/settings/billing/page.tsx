import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentSessionContext } from '@/lib/auth/session'
import { queryOne } from '@/lib/db'
import { stripe } from '@/lib/stripe/client'
import { PlanUsageCard } from '@/components/billing/PlanUsageCard'
import { BillingSettingsClient, type InvoiceItem } from '@/components/settings/BillingSettingsClient'

export const metadata: Metadata = {
  title: 'Billing & Subscription Settings | Innoventix Hub',
  description: 'Manage organization plan, view live resource quotas, and handle payment methods.',
}

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams?: Promise<{ checkout?: string; session_id?: string }> | { checkout?: string; session_id?: string }
}

export default async function BillingSettingsPage({ searchParams }: PageProps) {
  const session = await getCurrentSessionContext()

  if (!session || !session.organization) {
    redirect('/login')
  }

  const resolvedParams = await Promise.resolve(searchParams || {})
  const checkoutStatus = resolvedParams.checkout

  // Retrieve organization Stripe customer ID
  const org = await queryOne<{ stripe_customer_id?: string | null; plan_tier: string; billing_status: string }>(
    'SELECT stripe_customer_id, plan_tier, billing_status FROM organizations WHERE id = $1',
    [session.organization.id]
  )

  const customerId = org?.stripe_customer_id || null
  let invoices: InvoiceItem[] = []

  if (customerId && !customerId.startsWith('mock_')) {
    try {
      const stripeInvoices = await stripe.invoices.list({
        customer: customerId,
        limit: 5,
      })

      invoices = stripeInvoices.data.map((inv) => ({
        id: inv.id,
        number: inv.number || inv.id.slice(0, 10),
        amount: (inv.amount_paid || inv.total || 0) / 100,
        status: inv.status || 'paid',
        date: new Date((inv.created || Date.now() / 1000) * 1000).toISOString(),
        pdfUrl: inv.invoice_pdf || null,
      }))
    } catch {
      // Invoices list defaults to empty on failure or unconfigured keys
    }
  }

  const isPro = org?.plan_tier === 'pro' || org?.plan_tier === 'enterprise'

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 space-y-8">
      {/* Checkout Processing Banner (Prompt 46) */}
      {checkoutStatus === 'success' && (
        <div
          data-testid="checkout-processing-banner"
          className="rounded-2xl border border-sky-500/30 bg-gradient-to-r from-sky-950/60 via-slate-900 to-indigo-950/40 p-4 shadow-xl text-xs text-sky-200 flex items-center justify-between"
        >
          <div className="flex items-center gap-2.5">
            <span className="flex h-2 w-2 rounded-full bg-sky-400 animate-ping" />
            <span>
              <strong>Processing payment:</strong> Your Pro subscription is being finalized. Your limits will refresh automatically.
            </span>
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white">Billing & Subscription</h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage your organization plan, view live resource quotas, and handle payment methods.
        </p>
      </div>

      {/* Plan Usage & Seat Limits Card (Prompt 40 & 48) */}
      <PlanUsageCard />

      {/* Billing Actions & Invoices Component (Prompt 48) */}
      <BillingSettingsClient
        isPro={isPro}
        hasCustomer={!!customerId}
        invoices={invoices}
        organizationName={session.organization.name}
      />
    </div>
  )
}
