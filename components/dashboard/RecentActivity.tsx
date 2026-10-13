import { Activity, Clock, FileText, CheckCircle2, UserPlus, FolderPlus } from 'lucide-react'

export interface ActivityItem {
  id: string
  title: string
  description: string
  timestamp: string
  type: 'project' | 'client' | 'task' | 'general'
}

interface RecentActivityProps {
  items: ActivityItem[]
}

export function RecentActivity({ items }: RecentActivityProps) {
  const getIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'project':
        return <FolderPlus className="h-4 w-4 text-purple-500 dark:text-purple-400" />
      case 'client':
        return <UserPlus className="h-4 w-4 text-sky-500 dark:text-sky-400" />
      case 'task':
        return <CheckCircle2 className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
      default:
        return <Activity className="h-4 w-4 text-amber-500 dark:text-amber-400" />
    }
  }

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-sm dark:shadow-xl">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Activity className="h-4 w-4 text-sky-500 dark:text-sky-400" />
          Recent Activity
        </h3>
        <span className="text-[11px] font-mono text-muted-foreground">Live Feed</span>
      </div>

      <div className="mt-4 space-y-3.5 flex-1">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
            <Clock className="h-8 w-8 mb-2 opacity-50 text-muted-foreground" />
            <p className="text-xs font-semibold text-foreground">No recent activity logged yet.</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Activity log will populate automatically as your team manages clients and tasks.
            </p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-3 rounded-xl border border-border/80 bg-slate-50/80 dark:bg-slate-950/60 p-3 transition hover:border-slate-300 dark:hover:border-slate-700"
            >
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white dark:bg-slate-900 border border-border">
                {getIcon(item.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-foreground truncate">{item.title}</p>
                  <span className="text-[10px] text-muted-foreground shrink-0 font-mono">
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground truncate mt-0.5">{item.description}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
