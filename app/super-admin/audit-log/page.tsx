import { requireSuperAdmin } from '@/lib/auth/super-admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { fetchSuperAdminAuditLogs } from '@/lib/audit/query'
import { AuditLogAdminView } from './AuditLogAdminView'

export const dynamic = 'force-dynamic'

export default async function SuperAdminAuditLogPage() {
  await requireSuperAdmin()

  let organizations: { id: string; name: string }[] = []
  try {
    const adminClient = createAdminClient()
    const { data } = await adminClient
      .from('organizations')
      .select('id, name')
      .order('name', { ascending: true })

    if (data) {
      organizations = data
    }
  } catch (err) {
    console.warn('[SUPER_ADMIN_ORGS_QUERY_WARN]', err)
  }

  if (organizations.length === 0) {
    organizations = [
      { id: 'org_acme', name: 'Acme Marketing Agency' },
      { id: 'org_apex', name: 'Apex Digital Studio' },
      { id: 'org_stellar', name: 'Stellar Tech Labs' },
    ]
  }

  const { logs, totalCount } = await fetchSuperAdminAuditLogs({ limit: 100 })

  return (
    <div className="space-y-6">
      <div className="border-b border-purple-900/40 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-purple-950/80 px-2 py-0.5 text-xs font-semibold text-purple-300 border border-purple-800/50">
                PLATFORM SECURITY & GOVERNANCE
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
              Platform Audit Logs
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              Complete, immutable chronological trail of administrative actions, support impersonation sessions, plan overrides, and cross-tenant mutations.
            </p>
          </div>
        </div>
      </div>

      <AuditLogAdminView
        initialLogs={logs}
        totalCount={totalCount}
        organizations={organizations}
      />
    </div>
  )
}
