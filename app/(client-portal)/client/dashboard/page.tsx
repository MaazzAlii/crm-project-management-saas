import { requirePortalSession } from '@/lib/portal/auth'
import { query, queryOne } from '@/lib/db'
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

  // Parallel data fetch — all scoped by client_id
  const [
    client,
    org,
    projectsRes,
    pendingDeliverablesRes,
    invoicedProjectsRes,
  ] = await Promise.all([
    queryOne<{ name: string; company: string | null; email: string | null }>(
      'SELECT name, company, email FROM clients WHERE id = $1',
      [clientId]
    ),

    queryOne<{ name: string; logo_url: string | null }>(
      'SELECT name, logo_url FROM organizations WHERE id = $1',
      [organizationId]
    ),

    query<{
      id: string
      title: string
      status: string
      deadline: string | null
      amount: string | number
      currency: string | null
      deliverables: Array<{ id: string; status: string }>
    }>(
      `SELECT p.id, p.title, p.status, p.deadline, p.amount, p.currency,
              COALESCE(
                json_agg(json_build_object('id', d.id, 'status', d.status)) FILTER (WHERE d.id IS NOT NULL),
                '[]'
              ) as deliverables
       FROM projects p
       LEFT JOIN deliverables d ON d.project_id = p.id
       WHERE p.client_id = $1 AND p.status != 'paid'
       GROUP BY p.id
       ORDER BY p.created_at DESC`,
      [clientId]
    ),

    query<{
      id: string
      title: string
      status: string
      file_url: string | null
      drive_link: string | null
      submitted_at: string
      project_id: string
      project_title: string
    }>(
      `SELECT d.id, d.title, d.status, d.file_url, d.drive_link, d.submitted_at,
              p.id as project_id, p.title as project_title
       FROM deliverables d
       JOIN projects p ON p.id = d.project_id
       WHERE d.status = 'pending' AND p.client_id = $1
       ORDER BY d.submitted_at DESC
       LIMIT 5`,
      [clientId]
    ),

    query<{
      id: string
      amount: string | number
      currency: string | null
      status: string
    }>(
      `SELECT id, amount, currency, status
       FROM projects
       WHERE client_id = $1 AND status IN ('invoiced', 'paid')`,
      [clientId]
    ),
  ])

  const projects = projectsRes.rows
  const pendingDeliverables = pendingDeliverablesRes.rows
  const invoicedProjects = invoicedProjectsRes.rows

  const displayName = client?.company || client?.name || 'Client'
  const orgName = org?.name ?? 'Your Agency'
  const orgLogoUrl = org?.logo_url ?? null

  // Stats
  const activeProjectCount = projects.length
  const pendingReviewCount = pendingDeliverables.length
  const totalInvoiced = invoicedProjects.reduce((acc, p) => acc + Number(p.amount), 0)
  const paidTotal = invoicedProjects.filter(p => p.status === 'paid').reduce((acc, p) => acc + Number(p.amount), 0)

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
              {pendingDeliverables.map((d) => (
                <PortalDeliverableRow
                  key={d.id}
                  id={d.id}
                  title={d.title}
                  status={d.status as 'pending' | 'approved' | 'revision_required'}
                  fileUrl={d.file_url}
                  driveLink={d.drive_link}
                  projectId={d.project_id}
                  projectTitle={d.project_title}
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
              {projects.map((project) => {
                const deliverables = project.deliverables ?? []
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
