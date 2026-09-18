import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentSessionContext } from '@/lib/auth/session'
import { fetchWeeklyReportMetricsAction } from './actions'
import { WeeklyReportButton } from '@/components/reports/WeeklyReportButton'
import {
  FileText,
  CheckSquare,
  Briefcase,
  Users,
  DollarSign,
  MessageSquare,
  AlertTriangle,
  Building2,
  Calendar,
  Sparkles,
  TrendingUp,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Executive Reports & Weekly Summaries | CRM SaaS',
  description: 'AI-generated weekly progress narratives, CRM operational metrics, and executive status reports.',
}

export default async function ReportsPage() {
  const session = await getCurrentSessionContext()

  if (!session || !session.user) {
    redirect('/login')
  }

  if (!session.organization) {
    redirect('/onboarding')
  }

  const { figures, aiEnabled } = await fetchWeeklyReportMetricsAction()

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Executive Weekly Reports
            </h1>
            <span className="inline-flex items-center gap-1 rounded-md bg-indigo-500/10 px-2.5 py-1 text-xs font-semibold text-indigo-400 border border-indigo-500/20">
              <Sparkles className="h-3.5 w-3.5" />
              AI Intelligence
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Automated operational metrics synthesis and plain-language progress narratives for{' '}
            <span className="font-semibold text-slate-200">{session.organization.name}</span>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <WeeklyReportButton
            initialFigures={figures}
            aiEnabled={aiEnabled}
            size="lg"
            label="Generate Weekly Report"
          />
        </div>
      </div>

      {/* Date Window Banner */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Current Reporting Cycle</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Analyzing verified CRM activity from <span className="text-indigo-400 font-semibold">{figures.weekDateRange}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Building2 className="w-4 h-4 text-slate-500" />
          <span>Tenant Workspace: <strong className="text-slate-200">{figures.organizationName}</strong></span>
        </div>
      </div>

      {/* 6 Key Performance Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Tasks Completed</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">
            {figures.completedTasksCount}
          </div>
          <p className="text-xs text-slate-500">
            Milestones and tasks finalized across all active sprints in the last 7 days.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Active Client Projects</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">
            {figures.activeProjectsCount}
          </div>
          <p className="text-xs text-slate-500">
            Live client engagements currently in development, review, or delivery.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">New Client Signups</span>
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">
            {figures.newClientsCount}
          </div>
          <p className="text-xs text-slate-500">
            New commercial accounts onboarded to the platform during this period.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Revenue Recognized / Invoiced</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">
            ${figures.revenueGenerated.toLocaleString()}
          </div>
          <p className="text-xs text-slate-500">
            Stated contract and invoice volume associated with active accounts.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Communication Volume</span>
            <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">
            {figures.communicationVolume}
          </div>
          <p className="text-xs text-slate-500">
            Messages exchanged across Slack, WhatsApp, Email, Discord, and Upwork.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Overdue Items & Risks</span>
            <div className={`p-2 rounded-xl ${figures.overdueItemsCount > 0 ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-800 text-slate-500'}`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-3xl font-extrabold ${figures.overdueItemsCount > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
            {figures.overdueItemsCount}
          </div>
          <p className="text-xs text-slate-500">
            Overdue tasks past scheduled delivery dates requiring team attention.
          </p>
        </div>
      </div>

      {/* AI Narrative Showcase Card */}
      <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-indigo-950/20 to-slate-900 p-8 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">AI Weekly Progress Narrative</h2>
              <p className="text-xs text-slate-400">
                Transform raw figures into an authoritative stakeholder report in one click.
              </p>
            </div>
          </div>

          <WeeklyReportButton
            initialFigures={figures}
            aiEnabled={aiEnabled}
            label="Open Report Generator"
          />
        </div>

        <div className="rounded-2xl border border-slate-800/80 bg-slate-950/70 p-6 space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-3">
            <span className="font-semibold text-slate-200">Sample Executive Narrative Structure</span>
            <span className="text-[11px] text-indigo-400 font-mono">Dual-Tier Gated • ai_usage_log accounted</span>
          </div>

          <div className="text-xs text-slate-300 space-y-3 leading-relaxed">
            <p>
              <strong>1. Operational Velocity:</strong> The team finalized {figures.completedTasksCount} tasks and maintained active development on {figures.activeProjectsCount} client initiatives.
            </p>
            <p>
              <strong>2. Growth & Revenue:</strong> Welcomed {figures.newClientsCount} new client accounts with a combined volume of ${figures.revenueGenerated.toLocaleString()} under management.
            </p>
            <p>
              <strong>3. Engagement & Risk:</strong> Processed {figures.communicationVolume} client messages with {figures.overdueItemsCount} overdue item(s) flagged for timeline mitigation.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
