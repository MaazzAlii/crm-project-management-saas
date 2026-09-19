'use client'

import { useState, useMemo } from 'react'
import type { AuditLogRecord } from '@/lib/audit/log'
import {
  ShieldCheck,
  Search,
  Download,
  Filter,
  Calendar,
  Layers,
  ChevronDown,
  ChevronRight,
  User,
  Clock,
  ExternalLink,
  Lock,
  Code2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react'

interface AuditLogOrgViewProps {
  organizationId: string
  organizationName: string
  initialLogs: AuditLogRecord[]
  totalCount: number
}

export function AuditLogOrgView({
  organizationId,
  organizationName,
  initialLogs,
  totalCount,
}: AuditLogOrgViewProps) {
  const [logs] = useState<AuditLogRecord[]>(initialLogs)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedActionGroup, setSelectedActionGroup] = useState<string>('all')
  const [selectedEntity, setSelectedEntity] = useState<string>('all')
  const [dateRange, setDateRange] = useState<string>('all')
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'table' | 'json'>('table')

  // Filter groups
  const actionGroups: { label: string; value: string; actions?: string[] }[] = [
    { label: 'All Actions', value: 'all' },
    {
      label: 'Team & Roles',
      value: 'team',
      actions: ['TEAM_MEMBER_INVITED', 'TEAM_MEMBER_ROLE_UPDATED', 'TEAM_MEMBER_REMOVED', 'INVITATION_REVOKED'],
    },
    {
      label: 'Billing & Plans',
      value: 'billing',
      actions: ['CHECKOUT_SESSION_INITIATED', 'STRIPE_CHECKOUT_COMPLETED', 'STRIPE_SUBSCRIPTION_UPDATED', 'STRIPE_PAYMENT_FAILED', 'BILLING_PORTAL_OPENED'],
    },
    {
      label: 'CRM & Clients',
      value: 'crm',
      actions: ['CLIENT_CREATED', 'CLIENT_UPDATED', 'CLIENT_DELETED', 'LEAD_CREATED', 'LEAD_STATUS_CHANGED', 'LEAD_DELETED', 'CLIENT_COMMUNICATION_LOGGED'],
    },
    {
      label: 'Projects & Tasks',
      value: 'projects',
      actions: ['PROJECT_CREATED', 'PROJECT_UPDATED', 'PROJECT_STATUS_UPDATED', 'PROJECT_DELETED', 'TASK_CREATED', 'TASK_UPDATED', 'TASK_STATUS_CHANGED', 'TASK_DELETED', 'DELIVERABLE_CREATED', 'DELIVERABLE_STATUS_UPDATED', 'DELIVERABLE_DELETED'],
    },
    {
      label: 'AI & Automations',
      value: 'ai',
      actions: ['AI_FEATURE_TOGGLED', 'AI_PROVIDER_UPDATED', 'AUTOMATION_TRIGGERED', 'WEBHOOK_CONFIGURED'],
    },
    {
      label: 'Client Portal',
      value: 'portal',
      actions: ['PORTAL_SETTINGS_UPDATED', 'PORTAL_USER_INVITED', 'PORTAL_USER_REVOKED'],
    },
  ]

  // Filter logs based on user selection
  const filteredLogs = useMemo(() => {
    const now = Date.now()
    return logs.filter((log) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const match =
          log.action.toLowerCase().includes(q) ||
          (log.actor_email && log.actor_email.toLowerCase().includes(q)) ||
          (log.actor_name && log.actor_name.toLowerCase().includes(q)) ||
          (log.entity_type && log.entity_type.toLowerCase().includes(q)) ||
          (log.entity_id && log.entity_id.toLowerCase().includes(q)) ||
          JSON.stringify(log.metadata || log.details || {}).toLowerCase().includes(q)
        if (!match) return false
      }

      // 2. Action Group
      if (selectedActionGroup !== 'all') {
        const group = actionGroups.find((g) => g.value === selectedActionGroup)
        if (group?.actions && !group.actions.includes(log.action)) {
          return false
        }
      }

      // 3. Entity Type
      if (selectedEntity !== 'all') {
        const ent = (log.entity_type || log.target_type || '').toLowerCase()
        if (!ent.includes(selectedEntity.toLowerCase())) {
          return false
        }
      }

      // 4. Date Range
      if (dateRange !== 'all') {
        const logTime = new Date(log.created_at).getTime()
        if (dateRange === '24h' && now - logTime > 24 * 3600 * 1000) return false
        if (dateRange === '7d' && now - logTime > 7 * 24 * 3600 * 1000) return false
        if (dateRange === '30d' && now - logTime > 30 * 24 * 3600 * 1000) return false
      }

      return true
    })
  }, [logs, searchQuery, selectedActionGroup, selectedEntity, dateRange])

  // Unique entities list for dropdown
  const entityOptions = useMemo(() => {
    const set = new Set<string>()
    logs.forEach((l) => {
      const e = l.entity_type || l.target_type
      if (e) set.add(e)
    })
    return Array.from(set)
  }, [logs])

  // Action badge color helper
  const getActionBadge = (action: string) => {
    if (action.includes('CREATED') || action.includes('ADDED') || action.includes('RESUMED')) {
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    }
    if (action.includes('DELETED') || action.includes('REMOVED') || action.includes('SUSPENDED') || action.includes('FAILED') || action.includes('REVOKED')) {
      return 'bg-rose-500/10 text-rose-400 border-rose-500/20'
    }
    if (action.includes('ROLE') || action.includes('PERMISSION') || action.includes('SETTINGS') || action.includes('TOGGLED')) {
      return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
    }
    if (action.includes('SUPER_ADMIN')) {
      return 'bg-purple-500/10 text-purple-400 border-purple-500/20'
    }
    return 'bg-sky-500/10 text-sky-400 border-sky-500/20'
  }

  // Export CSV Handler
  const handleExportCsv = () => {
    const headers = ['Timestamp', 'Action', 'Actor Email', 'Actor Name', 'Entity Type', 'Entity ID', 'Details JSON']
    const rows = filteredLogs.map((l) => [
      `"${l.created_at}"`,
      `"${l.action}"`,
      `"${l.actor_email || ''}"`,
      `"${l.actor_name || ''}"`,
      `"${l.entity_type || l.target_type || ''}"`,
      `"${l.entity_id || l.target_id || ''}"`,
      `"${JSON.stringify(l.metadata || l.details || {}).replace(/"/g, '""')}"`,
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `audit_log_${organizationName.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Audit Events</span>
            <div className="rounded-xl bg-sky-500/10 p-2 text-sky-400 border border-sky-500/20">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight text-white">{totalCount}</span>
            <span className="text-xs text-slate-400">events recorded</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Log Immutability</span>
            <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-400 border border-emerald-500/20">
              <Lock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-sm font-bold text-emerald-400">Append-Only RLS</span>
            <span className="text-xs text-slate-500">• Tamper Proof</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Retention Policy</span>
            <div className="rounded-xl bg-purple-500/10 p-2 text-purple-400 border border-purple-500/20">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-sm font-bold text-purple-300">365-Day Archive</span>
            <span className="text-xs text-slate-500">• SOC 2 / GDPR</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Showing Filtered</span>
            <div className="rounded-xl bg-amber-500/10 p-2 text-amber-400 border border-amber-500/20">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight text-white">{filteredLogs.length}</span>
            <span className="text-xs text-slate-400">of {logs.length} loaded</span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search actions, actors, entity IDs, metadata..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950/70 py-2 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          {/* Action Group Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <select
                value={selectedActionGroup}
                onChange={(e) => setSelectedActionGroup(e.target.value)}
                className="appearance-none rounded-xl border border-slate-800 bg-slate-950/70 py-2 pl-3 pr-8 text-xs font-medium text-slate-300 focus:border-sky-500 focus:outline-none"
              >
                {actionGroups.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
            </div>

            {/* Entity Filter */}
            {entityOptions.length > 0 && (
              <div className="relative">
                <select
                  value={selectedEntity}
                  onChange={(e) => setSelectedEntity(e.target.value)}
                  className="appearance-none rounded-xl border border-slate-800 bg-slate-950/70 py-2 pl-3 pr-8 text-xs font-medium text-slate-300 focus:border-sky-500 focus:outline-none"
                >
                  <option value="all">All Entities</option>
                  {entityOptions.map((e) => (
                    <option key={e} value={e}>
                      Entity: {e}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
              </div>
            )}

            {/* Date Range Selector */}
            <div className="relative">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="appearance-none rounded-xl border border-slate-800 bg-slate-950/70 py-2 pl-3 pr-8 text-xs font-medium text-slate-300 focus:border-sky-500 focus:outline-none"
              >
                <option value="all">All Time</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
            </div>

            {/* Export CSV Button */}
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 shadow-sm overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800/60 text-slate-500">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-sm font-bold text-white">No audit events found</h3>
            <p className="mt-1 text-xs text-slate-400">
              Try adjusting your search query or action category filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4 w-8"></th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Details Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs text-slate-300">
                {filteredLogs.map((log) => {
                  const isExpanded = expandedLogId === log.id
                  const detailsObj = log.metadata || log.details || {}
                  const detailsSummary = Object.entries(detailsObj)
                    .slice(0, 3)
                    .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
                    .join(' • ')

                  return (
                    <tr
                      key={log.id}
                      className={`group transition-colors hover:bg-slate-800/30 ${
                        isExpanded ? 'bg-slate-800/20' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <button
                          onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                          className="text-slate-500 hover:text-slate-200 transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                        <div>{new Date(log.created_at).toLocaleDateString()}</div>
                        <div className="text-[10px] text-slate-500">
                          {new Date(log.created_at).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-[11px] font-bold font-mono tracking-tight ${getActionBadge(
                            log.action
                          )}`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-[10px] font-bold text-slate-300 border border-slate-700">
                            {log.actor_name?.[0] || log.actor_email?.[0] || 'U'}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-200">
                              {log.actor_name || log.actor_email?.split('@')[0] || 'System Operator'}
                            </div>
                            {log.actor_email && (
                              <div className="text-[10px] text-slate-500 font-mono">
                                {log.actor_email}
                              </div>
                            )}
                          </div>
                          {log.actor_is_super_admin && (
                            <span className="rounded bg-purple-950/80 px-1.5 py-0.5 text-[9px] font-bold text-purple-300 border border-purple-800/60">
                              SUPER ADMIN
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-slate-400">
                        {log.entity_type || log.target_type ? (
                          <span className="rounded bg-slate-800/80 px-2 py-0.5 border border-slate-700/60">
                            {log.entity_type || log.target_type}
                            {log.entity_id || log.target_id
                              ? `:${String(log.entity_id || log.target_id).slice(0, 8)}...`
                              : ''}
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-400 truncate max-w-xs text-[11px]">
                        {detailsSummary || <span className="text-slate-600 italic">No extra metadata</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Expanded Log Drawer Modal / View */}
      {expandedLogId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            {(() => {
              const log = logs.find((l) => l.id === expandedLogId)
              if (!log) return null

              return (
                <>
                  <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-bold font-mono ${getActionBadge(
                            log.action
                          )}`}
                        >
                          {log.action}
                        </span>
                        {log.actor_is_super_admin && (
                          <span className="rounded bg-purple-950/80 px-2 py-0.5 text-xs font-bold text-purple-300 border border-purple-800/60">
                            SUPER ADMIN ACTION
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-slate-400 font-mono">
                        Event ID: {log.id} • {new Date(log.created_at).toISOString()}
                      </p>
                    </div>
                    <button
                      onClick={() => setExpandedLogId(null)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950/50 p-3 rounded-xl border border-slate-800/60">
                    <div>
                      <span className="text-slate-500 font-medium">Actor:</span>
                      <p className="text-white font-semibold">
                        {log.actor_name || 'System Operator'} ({log.actor_email || 'N/A'})
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium">Target Entity:</span>
                      <p className="text-white font-mono">
                        {log.entity_type || log.target_type || 'N/A'}:{' '}
                        {log.entity_id || log.target_id || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium">IP Address:</span>
                      <p className="text-white font-mono">{log.ip_address || '127.0.0.1 (Local)'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium">Immutability:</span>
                      <p className="text-emerald-400 font-medium">Protected (Append-only)</p>
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-slate-300">Payload Metadata (JSON)</span>
                    <pre className="mt-2 max-h-60 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950 p-4 text-[11px] font-mono text-emerald-400">
                      {JSON.stringify(log.metadata || log.details || {}, null, 2)}
                    </pre>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => setExpandedLogId(null)}
                      className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700"
                    >
                      Close Inspector
                    </button>
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )
}
