import { requirePortalSession } from '@/lib/portal/auth'
import { createClient } from '@/lib/supabase/server'
import { PortalNav } from '@/components/client-portal/PortalNav'
import { ApprovalForm } from '@/components/client-portal/ApprovalForm'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Calendar, DollarSign, Circle, FileCheck,
  FileClock, FileX, Download, ExternalLink, Package,
} from 'lucide-react'

export async function generateMetadata({ params }: { params: { id: string } }) {
  return { title: 'Project Detail — Client Portal' }
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  brief_received: { label: 'Brief Received', color: 'text-slate-400',  bg: 'bg-slate-500/15 ring-slate-500/20' },
  in_progress:    { label: 'In Progress',    color: 'text-violet-400', bg: 'bg-violet-500/15 ring-violet-500/20' },
  review:         { label: 'In Review',       color: 'text-amber-400',  bg: 'bg-amber-500/15 ring-amber-500/20' },
  delivered:      { label: 'Delivered',       color: 'text-emerald-400',bg: 'bg-emerald-500/15 ring-emerald-500/20' },
  invoiced:       { label: 'Invoiced',        color: 'text-cyan-400',   bg: 'bg-cyan-500/15 ring-cyan-500/20' },
  paid:           { label: 'Paid',            color: 'text-emerald-400',bg: 'bg-emerald-500/15 ring-emerald-500/20' },
  on_hold:        { label: 'On Hold',         color: 'text-orange-400', bg: 'bg-orange-500/15 ring-orange-500/20' },
}

const DELIVERABLE_STATUS = {
  pending:          { label: 'Awaiting Review', icon: FileClock, className: 'portal-badge-status-pending' },
  approved:         { label: 'Approved',        icon: FileCheck, className: 'portal-badge-status-active' },
  revision_required:{ label: 'Revision Needed', icon: FileX,
    className: 'inline-flex items-center gap-1.5 rounded-full bg-red-500/15 px-2.5 py-1 text-xs font-medium text-red-400 ring-1 ring-red-500/20' },
}

export default async function PortalProjectDetailPage({ params }: { params: { id: string } }) {
  const { clientId, organizationId } = await requirePortalSession()
  const supabase = await createClient()

  // Fetch project — RLS enforces client_id automatically
  const { data: project } = await supabase
    .from('projects')
    .select('id, title, description, type, status, priority, start_date, deadline, amount, currency, delivered_at, notes')
    .eq('id', params.id)
    .eq('client_id', clientId)   // explicit client_id guard (defense in depth)
    .maybeSingle()

  if (!project) notFound()

  const { data: deliverables } = await supabase
    .from('deliverables')
    .select('id, title, status, file_url, drive_link, client_feedback, submitted_at')
    .eq('project_id', params.id)
    .order('submitted_at', { ascending: false })

  const { data: org } = await supabase
    .from('organizations')
    .select('name, logo_url')
    .eq('id', organizationId)
    .maybeSingle()

  const s = STATUS_MAP[project.status] ?? STATUS_MAP.in_progress
  const deadlineDate = project.deadline ? new Date(project.deadline) : null
  const isOverdue = deadlineDate && deadlineDate < new Date() && !['paid', 'delivered', 'invoiced'].includes(project.status)

  return (
    <div className="portal-bg min-h-screen">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-60 left-1/2 -translate-x-1/2 h-[600px] w-[600px] rounded-full bg-violet-600/8 blur-3xl" />
      </div>

      <PortalNav orgName={(org as any)?.name ?? 'Client Portal'} orgLogoUrl={(org as any)?.logo_url} />

      <main className="relative z-10 mx-auto max-w-5xl px-6 py-10">
        {/* Back */}
        <Link href="/client/dashboard" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-8">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        {/* Header */}
        <div className="portal-card mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${s.bg} ${s.color}`}>
                  <Circle className="h-1.5 w-1.5 fill-current" />
                  {s.label}
                </span>
                {project.type && (
                  <span className="rounded-full bg-slate-700/40 px-2.5 py-1 text-xs text-slate-400 ring-1 ring-slate-700/40">
                    {project.type}
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-white">{project.title}</h1>
              {project.description && (
                <p className="mt-2 text-sm text-slate-400 leading-relaxed max-w-2xl">{project.description}</p>
              )}
            </div>
          </div>

          {/* Meta row */}
          <div className="mt-6 flex flex-wrap gap-6 border-t border-slate-800/60 pt-6">
            {deadlineDate && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-slate-500" />
                <span className={isOverdue ? 'text-red-400 font-medium' : 'text-slate-300'}>
                  {isOverdue ? 'Overdue · ' : 'Deadline: '}
                  {deadlineDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4 text-slate-500" />
              <span className="text-slate-300">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: project.currency ?? 'USD' }).format(Number(project.amount))}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Package className="h-4 w-4 text-slate-500" />
              <span className="text-slate-300">{deliverables?.length ?? 0} deliverable{(deliverables?.length ?? 0) !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>

        {/* Deliverables */}
        <section>
          <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Package className="h-4 w-4 text-violet-400" />
            Deliverables
          </h2>

          {!deliverables || deliverables.length === 0 ? (
            <div className="portal-card text-center py-12">
              <Package className="mx-auto h-10 w-10 text-slate-600 mb-3" />
              <p className="text-sm text-slate-400">No deliverables yet — the team will upload them here when ready.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {deliverables.map((d) => {
                const ds = DELIVERABLE_STATUS[d.status as keyof typeof DELIVERABLE_STATUS] ?? DELIVERABLE_STATUS.pending
                const DsIcon = ds.icon
                return (
                  <div
                    key={d.id}
                    id={`deliverable-${d.id}`}
                    className="portal-card scroll-mt-28"
                  >
                    {/* Deliverable header */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-800/60">
                          <DsIcon className="h-4 w-4 text-slate-400" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-white">{d.title}</h3>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <span className={ds.className}>
                              <DsIcon className="h-3 w-3" />
                              {ds.label}
                            </span>
                            <span className="text-xs text-slate-500">
                              {new Date(d.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Download / View */}
                      <div className="flex items-center gap-2 shrink-0">
                        {d.file_url && (
                          <a
                            href={d.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 rounded-lg border border-slate-700/60 bg-slate-800/40 px-3 py-2 text-xs font-medium text-slate-300 transition-colors hover:border-slate-600 hover:text-white"
                          >
                            <Download className="h-3.5 w-3.5" />
                            Download
                          </a>
                        )}
                        {d.drive_link && !d.file_url && (
                          <a
                            href={d.drive_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 rounded-lg border border-slate-700/60 bg-slate-800/40 px-3 py-2 text-xs font-medium text-slate-300 transition-colors hover:border-slate-600 hover:text-white"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            View File
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Previous feedback (if revision was requested) */}
                    {d.client_feedback && d.status === 'revision_required' && (
                      <div className="mb-5 rounded-lg border border-orange-500/20 bg-orange-500/5 px-4 py-3 text-sm text-orange-300">
                        <p className="font-medium mb-1 text-orange-400">Your revision notes:</p>
                        <p className="text-slate-300 whitespace-pre-wrap">{d.client_feedback}</p>
                      </div>
                    )}

                    {/* Approval form */}
                    <div className="border-t border-slate-800/60 pt-5">
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Your Action</p>
                      <ApprovalForm
                        deliverableId={d.id}
                        projectId={params.id}
                        deliverableTitle={d.title}
                        currentStatus={d.status as 'pending' | 'approved' | 'revision_required'}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
