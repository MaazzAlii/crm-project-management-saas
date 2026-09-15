import { CheckCircle2, Clock, AlertTriangle, AlertCircle } from 'lucide-react'

export type ProjectHealthStatus = 'On Track' | 'At Risk' | 'Overdue' | 'Completed'

export function calculateProjectHealth(
  deadline?: string | null,
  status?: string | null,
  completionPct?: number
): ProjectHealthStatus {
  const normStatus = (status || '').toLowerCase()
  if (normStatus === 'completed' || normStatus === 'delivered' || normStatus === 'invoiced' || normStatus === 'paid') {
    return 'Completed'
  }

  if (!deadline) return 'On Track'

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const targetDate = new Date(deadline)
  targetDate.setHours(0, 0, 0, 0)

  const diffTime = targetDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    return 'Overdue'
  }
  if (diffDays <= 3) {
    return 'At Risk'
  }
  return 'On Track'
}

interface ProjectHealthBadgeProps {
  deadline?: string | null
  status?: string | null
  completionPct?: number
  healthOverride?: ProjectHealthStatus
  size?: 'sm' | 'md'
}

export function ProjectHealthBadge({
  deadline,
  status,
  completionPct,
  healthOverride,
  size = 'sm'
}: ProjectHealthBadgeProps) {
  const health = healthOverride || calculateProjectHealth(deadline, status, completionPct)

  let style = 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
  let Icon = CheckCircle2

  if (health === 'At Risk') {
    style = 'bg-amber-500/10 text-amber-500 border-amber-500/20'
    Icon = AlertTriangle
  } else if (health === 'Overdue') {
    style = 'bg-red-500/10 text-red-500 border-red-500/20'
    Icon = AlertCircle
  } else if (health === 'Completed') {
    style = 'bg-blue-500/10 text-blue-500 border-blue-500/20'
    Icon = CheckCircle2
  } else {
    style = 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
    Icon = Clock
  }

  const py = size === 'sm' ? 'py-0.5 px-2 text-[11px]' : 'py-1 px-3 text-xs'

  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold rounded-full border ${style} ${py}`}
      title={`Health Indicator: ${health}`}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span>{health}</span>
    </span>
  )
}
