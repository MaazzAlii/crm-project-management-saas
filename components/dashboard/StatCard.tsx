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
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm dark:shadow-xl animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-9 w-9 rounded-xl bg-slate-200 dark:bg-slate-800" />
        </div>
        <div className="mt-4 h-8 w-16 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="mt-2 h-3 w-32 rounded bg-slate-200 dark:bg-slate-800" />
      </div>
    )
  }

  const variantStyles = {
    default: {
      border: 'border-border',
      iconBg: 'bg-slate-100 text-foreground border-slate-200 dark:bg-slate-800/80 dark:border-slate-700/50',
      text: 'text-foreground',
    },
    accent: {
      border: 'border-sky-300 dark:border-sky-500/30',
      iconBg: 'bg-sky-50 text-sky-600 border-sky-200 dark:bg-sky-500/15 dark:text-sky-400 dark:border-sky-500/30',
      text: 'text-foreground',
    },
    success: {
      border: 'border-emerald-300 dark:border-emerald-500/30',
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30',
      text: 'text-emerald-700 dark:text-emerald-300',
    },
    warning: {
      border: 'border-amber-300 dark:border-amber-500/30',
      iconBg: 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30',
      text: 'text-amber-700 dark:text-amber-300',
    },
    error: {
      border: 'border-rose-300 dark:border-rose-500/30',
      iconBg: 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/30',
      text: 'text-rose-700 dark:text-rose-300',
    },
  }

  const currentVariant = variantStyles[variant] || variantStyles.default

  return (
    <div
      className={`flex flex-col justify-between rounded-2xl border ${currentVariant.border} bg-card p-5 shadow-sm dark:shadow-xl transition hover:border-slate-300 dark:hover:border-slate-700`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {title}
        </span>
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${currentVariant.iconBg}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <div className="mt-4">
        <div className={`text-3xl font-extrabold tracking-tight font-mono ${currentVariant.text}`}>
          {value}
        </div>
        {subtitle && (
          <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>

      {trend && (
        <div className="mt-3 border-t border-border pt-2 text-[11px] font-medium text-muted-foreground">
          {trend}
        </div>
      )}
    </div>
  )
}
