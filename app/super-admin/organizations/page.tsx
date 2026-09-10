import { createClient } from '@/lib/supabase/server'
import { requireSuperAdmin } from '@/lib/auth/super-admin'
import { OrgListTable, type OrgListItem } from '@/components/super-admin/org-list-table'
import { Building2, Plus, ShieldCheck } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function SuperAdminOrganizationsPage() {
  await requireSuperAdmin()
  const supabase = await createClient()

  // Fetch organizations
  const { data: orgsData } = await supabase
    .from('organizations')
    .select('id, name, slug, plan_tier, billing_status, is_suspended, created_at')
    .order('created_at', { ascending: false })

  const orgs = orgsData || []

  // Fetch member counts per organization
  const { data: membersData } = await supabase
    .from('organization_members')
    .select('organization_id')

  const memberCountMap: Record<string, number> = {}
  if (membersData) {
    membersData.forEach((m: any) => {
      memberCountMap[m.organization_id] = (memberCountMap[m.organization_id] || 0) + 1
    })
  }

  const items: OrgListItem[] = orgs.map((org) => ({
    ...org,
    memberCount: memberCountMap[org.id] || 0,
  }))

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Organization Management
            </h1>
            <span className="inline-flex items-center gap-1 rounded-md bg-purple-500/10 px-2.5 py-1 text-xs font-semibold text-purple-300 border border-purple-500/20">
              <Building2 className="h-3.5 w-3.5" />
              {items.length} Registered Tenants
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Control tenant status, manage subscription tiers, suspend/resume accounts, and monitor usage limits.
          </p>
        </div>
      </div>

      {/* Interactive Table */}
      <OrgListTable organizations={items} />
    </div>
  )
}
