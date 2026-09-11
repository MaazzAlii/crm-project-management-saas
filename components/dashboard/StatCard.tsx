import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  variant?: 'default' | 'success' | 'warning' | 'error' | 'accent'
  trend?: string
  loading?: boolean
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default',
  trend,
  loading = false,
}: StatCardProps) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-4 w-24 rounded bg-slate-800" />
          <div className="h-9 w-9 rounded-xl bg-slate-800" />
        </div>
        <div className="mt-4 h-8 w-16 rounded bg-slate-800" />
        <div className="mt-2 h-3 w-32 rounded bg-slate-800" />
      </div>
    )
  }

  const variantStyles = {
    default: {
      border: 'border-slate-800/80',
      iconBg: 'bg-slate-800/80 text-slate-300 border-slate-700/50',
      text: 'text-white',
    },
    accent: {
      border: 'border-sky-500/30',
      iconBg: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
      text: 'text-white',
    },
    success: {
      border: 'border-emerald-500/30',
      iconBg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      text: 'text-emerald-300',
    },
    warning: {
      border: 'border-amber-500/30',
      iconBg: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      text: 'text-amber-300',
    },
    error: {
      border: 'border-rose-500/30',
      iconBg: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
      text: 'text-rose-300',
    },
  }

  const currentVariant = variantStyles[variant] || variantStyles.default

  return (
    <div
      className={`flex flex-col justify-between rounded-2xl border ${currentVariant.border} bg-slate-900/90 p-5 shadow-xl transition hover:border-slate-700`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {title}
        </span>
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${currentVariant.iconBg}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <div className="mt-4">
        <div className={`text-3xl font-extrabold tracking-tight ${currentVariant.text}`}>
          {value}
        </div>
        {subtitle && (
          <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
        )}
      </div>

      {trend && (
        <div className="mt-3 border-t border-slate-800/80 pt-2 text-[11px] font-medium text-slate-400">
          {trend}
        </div>
      )}
    </div>
  )
}
