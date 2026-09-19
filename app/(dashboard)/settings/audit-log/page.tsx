import { redirect } from 'next/navigation'
import { getCurrentSessionContext } from '@/lib/auth/session'
import { fetchOrgAuditLogs } from '@/lib/audit/query'
import { AuditLogOrgView } from './AuditLogOrgView'

export const dynamic = 'force-dynamic'

export default async function OrgAuditLogPage() {
  const session = await getCurrentSessionContext()

  if (!session || !session.user || !session.organization) {
    redirect('/login')
  }

  // Enforce role permission: Only owners, admins, or super admins can inspect audit trails
  const isAllowed = session.role === 'owner' || session.role === 'admin' || session.isSuperAdmin

  if (!isAllowed) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-950/20 p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="mt-4 text-lg font-bold text-white">Access Restricted</h3>
        <p className="mt-2 text-sm text-slate-400 max-w-md mx-auto">
          Audit logs contain sensitive organization security events and are only accessible by Workspace Owners and Administrators.
        </p>
      </div>
    )
  }

  const { logs, totalCount } = await fetchOrgAuditLogs(session.organization.id, { limit: 100 })

  return (
    <AuditLogOrgView
      organizationId={session.organization.id}
      organizationName={session.organization.name}
      initialLogs={logs}
      totalCount={totalCount}
    />
  )
}
