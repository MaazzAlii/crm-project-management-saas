import { requirePortalSession } from '@/lib/portal/auth'
import { createClient } from '@/lib/supabase/server'
import { PortalNav } from '@/components/client-portal/PortalNav'
import { PortalProjectCard } from '@/components/client-portal/PortalProjectCard'
import { PortalDeliverableRow } from '@/components/client-portal/PortalDeliverableRow'
import { FolderOpen, FileClock, FileText, TrendingUp } from 'lucide-react'

export const metadata = {
  title: 'Dashboard — Client Portal',
  description: 'View your active projects, deliverables awaiting review, and invoice status.',
}

export default async function PortalDashboardPage() {
  const { clientId, organizationId } = await requirePortalSession()
  const supabase = await createClient()

  // Parallel data fetch — all scoped by client_id via RLS
  const [
    { data: client },
    { data: org },
    { data: projects },
    { data: pendingDeliverables },
    { data: invoicedProjects },
  ] = await Promise.all([
    supabase
      .from('clients')
      .select('name, company_name, email')
      .eq('id', clientId)
      .maybeSingle(),

    supabase
      .from('organizations')
      .select('name, logo_url')
      .eq('id', organizationId)
      .maybeSingle(),

    supabase
      .from('projects')
      .select(`
        id, title, status, deadline, amount, currency,
        deliverables(id, status)
      `)
      .eq('client_id', clientId)
      .not('status', 'in', '("paid")')
      .order('created_at', { ascending: false }),

    supabase
      .from('deliverables')
      .select(`
        id, title, status, file_url, drive_link, submitted_at,
        projects!inner(id, title, client_id)
      `)
      .eq('status', 'pending')
      .eq('projects.client_id', clientId)
      .order('submitted_at', { ascending: false })
      .limit(5),

    supabase
      .from('projects')
      .select('id, amount, currency, status')
      .eq('client_id', clientId)
      .in('status', ['invoiced', 'paid']),
  ])

  const displayName = client?.company_name || client?.name || 'Client'
  const orgName = (org as any)?.name ?? 'Your Agency'
  const orgLogoUrl = (org as any)?.logo_url ?? null

  // Stats
  const activeProjectCount = projects?.length ?? 0
  const pendingReviewCount = pendingDeliverables?.length ?? 0
  const totalInvoiced = invoicedProjects?.reduce((acc, p) => acc + Number(p.amount), 0) ?? 0
  const paidTotal = invoicedProjects?.filter(p => p.status === 'paid').reduce((acc, p) => acc + Number(p.amount), 0) ?? 0

  return (
    <div className="portal-bg min-h-screen">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-60 left-1/2 -translate-x-1/2 h-[600px] w-[600px] rounded-full bg-violet-600/8 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-[400px] w-[400px] rounded-full bg-cyan-600/5 blur-3xl" />
      </div>

      <PortalNav orgName={orgName} orgLogoUrl={orgLogoUrl} />

      <main className="relative z-10 mx-auto max-w-5xl px-6 py-10">
        {/* Welcome header */}
        <div className="mb-10">
          <h1 className="text-2xl font-bold text-white">
            Welcome back, <span className="text-violet-400">{displayName}</span>
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Here&apos;s an overview of your work and activity.
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {[
            {
              icon: FolderOpen,
              value: activeProjectCount,
              label: 'Active Projects',
              color: 'text-violet-400',
              bg: 'bg-violet-500/15 ring-violet-500/20',
            },
            {
              icon: FileClock,
              value: pendingReviewCount,
              label: 'Awaiting Review',
              color: 'text-amber-400',
              bg: 'bg-amber-500/15 ring-amber-500/20',
            },
            {
              icon: FileText,
              value: `$${totalInvoiced.toLocaleString()}`,
              label: 'Total Invoiced',
              color: 'text-cyan-400',
              bg: 'bg-cyan-500/15 ring-cyan-500/20',
            },
            {
              icon: TrendingUp,
              value: `$${paidTotal.toLocaleString()}`,
              label: 'Paid to Date',
              color: 'text-emerald-400',
              bg: 'bg-emerald-500/15 ring-emerald-500/20',
            },
          ].map(({ icon: Icon, value, label, color, bg }) => (
            <div key={label} className="portal-card flex items-center gap-4 py-5">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${bg}`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div>
                <p className="text-xl font-bold text-white">{value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Deliverables awaiting review */}
        {pendingReviewCount > 0 && (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <FileClock className="h-4 w-4 text-amber-400" />
                Awaiting Your Review
              </h2>
              <span className="inline-flex items-center rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-medium text-amber-400 ring-1 ring-amber-500/20">
                {pendingReviewCount} pending
              </span>
            </div>
            <div className="space-y-3">
              {pendingDeliverables?.map((d) => (
                <PortalDeliverableRow
                  key={d.id}
                  id={d.id}
                  title={d.title}
                  status={d.status as 'pending' | 'approved' | 'revision_required'}
                  fileUrl={d.file_url}
                  driveLink={d.drive_link}
                  projectId={(d.projects as any).id}
                  projectTitle={(d.projects as any).title}
                  submittedAt={d.submitted_at}
                />
              ))}
            </div>
          </section>
        )}

        {/* Active Projects */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-violet-400" />
              Your Projects
            </h2>
          </div>

          {activeProjectCount === 0 ? (
            <div className="portal-card text-center py-16">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600/15 ring-1 ring-violet-500/20">
                <FolderOpen className="h-7 w-7 text-violet-400" />
              </div>
              <h3 className="text-base font-semibold text-white mb-1">No active projects yet</h3>
              <p className="text-sm text-slate-400">
                Projects assigned to you will appear here once your account manager creates them.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {projects?.map((project) => {
                const deliverables = (project.deliverables as any[]) ?? []
                const pendingCount = deliverables.filter((d) => d.status === 'pending').length
                return (
                  <PortalProjectCard
                    key={project.id}
                    id={project.id}
                    title={project.title}
                    status={project.status}
                    deadline={project.deadline}
                    amount={Number(project.amount)}
                    currency={project.currency ?? 'USD'}
                    deliverableCount={deliverables.length}
                    pendingReviewCount={pendingCount}
                  />
                )
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
