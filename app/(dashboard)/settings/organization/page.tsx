import { getCurrentSessionContext } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OrgProfileForm } from '@/components/settings/OrgProfileForm'

export const dynamic = 'force-dynamic'

export default async function OrganizationSettingsPage() {
  const session = await getCurrentSessionContext()

  if (!session || !session.user) {
    redirect('/login')
  }

  if (!session.organization) {
    redirect('/onboarding')
  }

  const supabase = await createClient()

  // Fetch full organization details
  const { data: orgData } = await supabase
    .from('organizations')
    .select('id, name, slug, plan_tier, billing_status, industry_type, logo_url, timezone')
    .eq('id', session.organization.id)
    .single()

  const org = orgData || {
    id: session.organization.id,
    name: session.organization.name,
    slug: session.organization.slug,
    plan_tier: session.organization.plan_tier,
    billing_status: session.organization.billing_status,
    industry_type: 'General Agency',
    logo_url: '',
    timezone: 'UTC',
  }

  const canEdit = session.role === 'owner' || session.role === 'admin' || session.isSuperAdmin

  return <OrgProfileForm org={org} canEdit={canEdit} />
}
