import Link from 'next/link'
import { Calendar, ChevronRight, Circle } from 'lucide-react'

interface PortalProjectCardProps {
  id: string
  title: string
  status: string
  deadline: string | null
  amount: number
  currency: string
  deliverableCount: number
  pendingReviewCount: number
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  brief_received: { label: 'Brief Received', color: 'text-slate-400', bg: 'bg-slate-500/15 ring-slate-500/20' },
  in_progress:    { label: 'In Progress',    color: 'text-violet-400', bg: 'bg-violet-500/15 ring-violet-500/20' },
  review:         { label: 'In Review',       color: 'text-amber-400',  bg: 'bg-amber-500/15 ring-amber-500/20' },
  delivered:      { label: 'Delivered',       color: 'text-emerald-400',bg: 'bg-emerald-500/15 ring-emerald-500/20' },
  invoiced:       { label: 'Invoiced',        color: 'text-cyan-400',   bg: 'bg-cyan-500/15 ring-cyan-500/20' },
  paid:           { label: 'Paid',            color: 'text-emerald-400',bg: 'bg-emerald-500/15 ring-emerald-500/20' },
  on_hold:        { label: 'On Hold',         color: 'text-orange-400', bg: 'bg-orange-500/15 ring-orange-500/20' },
}

function ProgressRing({ percent }: { percent: number }) {
  const r = 20
  const circ = 2 * Math.PI * r
  const offset = circ - (percent / 100) * circ
  return (
    <svg className="h-14 w-14 -rotate-90" viewBox="0 0 48 48">
      <circle cx="24" cy="24" r={r} fill="none" stroke="rgb(51 65 85)" strokeWidth="4" />
      <circle
        cx="24" cy="24" r={r} fill="none"
        stroke="rgb(139 92 246)"
        strokeWidth="4"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-700"
      />
      <text
        x="24" y="24"
        dominantBaseline="middle" textAnchor="middle"
        fill="white" fontSize="10" fontWeight="600"
        className="rotate-90 origin-center"
        transform="rotate(90, 24, 24)"
      >
        {percent}%
      </text>
    </svg>
  )
}

const STATUS_PROGRESS: Record<string, number> = {
  brief_received: 10,
  in_progress: 45,
  review: 75,
  delivered: 90,
  invoiced: 95,
  paid: 100,
  on_hold: 30,
}

export function PortalProjectCard({
  id, title, status, deadline, amount, currency, deliverableCount, pendingReviewCount,
}: PortalProjectCardProps) {
  const s = STATUS_MAP[status] ?? STATUS_MAP.in_progress
  const progress = STATUS_PROGRESS[status] ?? 50
  const deadlineDate = deadline ? new Date(deadline) : null
  const isOverdue = deadlineDate && deadlineDate < new Date() && status !== 'paid' && status !== 'delivered'

  return (
    <Link href={`/client/projects/${id}`} className="group block">
      <div className="portal-card transition-all duration-200 hover:border-violet-500/40 hover:shadow-violet-500/10 hover:shadow-lg">
        <div className="flex items-start justify-between gap-4">
          {/* Left */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${s.bg} ${s.color}`}>
                <Circle className="h-1.5 w-1.5 fill-current" />
                {s.label}
              </span>
              {pendingReviewCount > 0 && (
                <span className="inline-flex items-center rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-medium text-amber-400 ring-1 ring-amber-500/20">
                  {pendingReviewCount} awaiting review
                </span>
              )}
            </div>

            <h3 className="text-base font-semibold text-white truncate group-hover:text-violet-300 transition-colors">
              {title}
            </h3>

            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
              {deadlineDate && (
                <span className={`flex items-center gap-1.5 ${isOverdue ? 'text-red-400' : ''}`}>
                  <Calendar className="h-3.5 w-3.5" />
                  {isOverdue ? 'Overdue · ' : 'Due '}
                  {deadlineDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              )}
              <span>{deliverableCount} deliverable{deliverableCount !== 1 ? 's' : ''}</span>
              <span className="font-medium text-slate-300">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)}
              </span>
            </div>
          </div>

          {/* Progress ring */}
          <div className="shrink-0 flex items-center gap-3">
            <ProgressRing percent={progress} />
            <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-violet-400 transition-colors" />
          </div>
        </div>
      </div>
    </Link>
  )
}
