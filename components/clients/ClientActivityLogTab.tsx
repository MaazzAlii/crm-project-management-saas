'use client'

import { Activity, Clock, User, ShieldCheck } from 'lucide-react'

export interface AuditItem {
  id: string
  action: string
  created_at: string
  details?: any
}

interface ClientActivityLogTabProps {
  logs?: AuditItem[]
}

export function ClientActivityLogTab({ logs = [] }: ClientActivityLogTabProps) {
  if (logs.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-12 text-center space-y-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800/80 text-slate-400 mx-auto">
          <Activity className="h-6 w-6" />
        </div>
        <div className="space-y-1 max-w-sm mx-auto">
          <h3 className="text-base font-bold text-white">No Activity Logs</h3>
          <p className="text-xs text-slate-400">Activity and audit events for this client will appear here.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-6 space-y-6">
      <h2 className="text-sm font-bold text-white uppercase tracking-wider">Audit & Activity Log</h2>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
        {logs.map((log) => (
          <div key={log.id} className="relative space-y-1">
            <div className="absolute -left-6 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 border border-slate-700 text-sky-400">
              <ShieldCheck className="h-3 w-3" />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider">{log.action.replace('_', ' ')}</span>
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{new Date(log.created_at).toLocaleString()}</span>
              </span>
            </div>

            {log.details && (
              <div className="text-xs text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60 font-mono">
                {JSON.stringify(log.details, null, 2)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
