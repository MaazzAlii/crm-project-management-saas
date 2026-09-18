import { requirePortalSession } from '@/lib/portal/auth'
import { createClient } from '@/lib/supabase/server'
import { Building2, FolderOpen, CheckSquare, LogOut } from 'lucide-react'
import Link from 'next/link'

/**
 * Client Portal Dashboard — landing page after magic-link login.
 * Full dashboard UI is implemented in TASK 55.
 * This stub validates session, shows client name and a welcome screen.
 */
export default async function PortalDashboardPage() {
  const { clientId, organizationId } = await requirePortalSession()

  const supabase = await createClient()

  const { data: client } = await supabase
    .from('clients')
    .select('name, company_name, email')
    .eq('id', clientId)
    .maybeSingle()

  const { count: projectCount } = await supabase
    .from('projects')
    .select('id', { count: 'exact', head: true })
    .eq('client_id', clientId)

  return (
    <div className="portal-bg min-h-screen">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-violet-600/8 blur-3xl" />
      </div>

      {/* Nav */}
      <nav className="sticky top-0 z-30 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600/20 ring-1 ring-violet-500/30">
              <Building2 className="h-4 w-4 text-violet-400" />
            </div>
            <span className="text-sm font-semibold text-white">Client Portal</span>
          </div>

          <form action="/client/auth/signout" method="post">
            <button
              type="submit"
              className="flex items-center gap-1.5 text-sm text-slate-400 transition-colors hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </form>
        </div>
      </nav>

      {/* Content */}
      <main className="relative z-10 mx-auto max-w-5xl px-6 py-12">
        <div className="mb-10">
          <h1 className="text-2xl font-bold text-white">
            Welcome{client?.company_name ? `, ${client.company_name}` : ''}
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Your secure workspace — track your projects and deliverables.
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-12">
          <div className="portal-card flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 ring-1 ring-violet-500/20">
              <FolderOpen className="h-6 w-6 text-violet-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{projectCount ?? 0}</p>
              <p className="text-sm text-slate-400">Active Projects</p>
            </div>
          </div>

          <div className="portal-card flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 ring-1 ring-emerald-500/20">
              <CheckSquare className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">—</p>
              <p className="text-sm text-slate-400">Open Tasks</p>
            </div>
          </div>
        </div>

        {/* Coming soon — Task 55 */}
        <div className="portal-card text-center py-16">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600/15 ring-1 ring-violet-500/20">
            <FolderOpen className="h-7 w-7 text-violet-400" />
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">Full dashboard coming soon</h2>
          <p className="text-sm text-slate-400 max-w-sm mx-auto">
            Project details, deliverable approvals, and invoice history will appear here (Task 55–57).
          </p>
          <Link
            href="/client/projects"
            className="mt-6 inline-flex items-center gap-2 portal-btn-primary w-auto px-6"
          >
            View Projects
          </Link>
        </div>
      </main>
    </div>
  )
}
