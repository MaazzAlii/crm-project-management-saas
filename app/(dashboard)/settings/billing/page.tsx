import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentSessionContext } from '@/lib/auth/session'
import { getOrganizationPlanUsageDetails } from '@/lib/billing/plan-limits'
import { BillingSettingsClient } from '@/components/settings/BillingSettingsClient'

export const metadata: Metadata = {
  title: 'Billing & Subscription Settings | Innoventix Hub',
  description: 'Manage organization plan, view live resource quotas, and handle payment methods.',
}

export default async function BillingSettingsPage() {
  const session = await getCurrentSessionContext()

  if (!session || !session.organization) {
    redirect('/login')
  }

  const usage = await getOrganizationPlanUsageDetails(session.organization.id)

  return <BillingSettingsClient usage={usage} />
}
