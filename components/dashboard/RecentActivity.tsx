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
        return <FolderPlus className="h-4 w-4 text-purple-400" />
      case 'client':
        return <UserPlus className="h-4 w-4 text-sky-400" />
      case 'task':
        return <CheckCircle2 className="h-4 w-4 text-emerald-400" />
      default:
        return <Activity className="h-4 w-4 text-amber-400" />
    }
  }

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Activity className="h-4 w-4 text-sky-400" />
          Recent Activity
        </h3>
        <span className="text-[11px] font-mono text-slate-400">Live Feed</span>
      </div>

      <div className="mt-4 space-y-3.5 flex-1">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-slate-500">
            <Clock className="h-8 w-8 mb-2 opacity-50 text-slate-400" />
            <p className="text-xs font-semibold">No recent activity logged yet.</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Activity log will populate automatically as your team manages clients and tasks.
            </p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-3 rounded-xl border border-slate-800/60 bg-slate-950/60 p-3 transition hover:border-slate-700"
            >
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-900 border border-slate-800">
                {getIcon(item.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-white truncate">{item.title}</p>
                  <span className="text-[10px] text-slate-500 shrink-0 font-mono">
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">{item.description}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
