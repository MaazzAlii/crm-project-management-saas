'use client'

import { useState, useMemo } from 'react'
import type { AuditLogRecord } from '@/lib/audit/log'
import {
  ShieldAlert,
  Search,
  Download,
  Building2,
  Lock,
  Clock,
  Layers,
  ChevronDown,
  ChevronRight,
  UserCheck,
  Eye,
  Sliders,
  Sparkles,
} from 'lucide-react'

interface AuditLogAdminViewProps {
  initialLogs: AuditLogRecord[]
  totalCount: number
  organizations: { id: string; name: string }[]
}

export function AuditLogAdminView({
  initialLogs,
  totalCount,
  organizations,
}: AuditLogAdminViewProps) {
  const [logs] = useState<AuditLogRecord[]>(initialLogs)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedOrg, setSelectedOrg] = useState<string>('all')
  const [superAdminOnly, setSuperAdminOnly] = useState<boolean>(false)
  const [selectedActionGroup, setSelectedActionGroup] = useState<string>('all')
  const [dateRange, setDateRange] = useState<string>('all')
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null)

  const actionGroups = [
    { label: 'All Actions', value: 'all' },
    {
      label: 'Super Admin Operations',
      value: 'super_admin',
      actions: [
        'SUPER_ADMIN_IMPERSONATION_START',
        'SUPER_ADMIN_IMPERSONATION_END',
        'SUPER_ADMIN_SETTINGS_UPDATED',
        'ORGANIZATION_SUSPENDED',
        'ORGANIZATION_RESUMED',
        'ORGANIZATION_PLAN_OVERRIDDEN',
      ],
    },
    {
      label: 'Billing & Subscriptions',
      value: 'billing',
      actions: [
        'CHECKOUT_SESSION_INITIATED',
        'STRIPE_CHECKOUT_COMPLETED',
        'STRIPE_SUBSCRIPTION_UPDATED',
        'STRIPE_PAYMENT_FAILED',
        'ORGANIZATION_PLAN_OVERRIDDEN',
      ],
    },
    {
      label: 'Team & Access Control',
      value: 'team',
      actions: [
        'TEAM_MEMBER_INVITED',
        'TEAM_MEMBER_ROLE_UPDATED',
        'TEAM_MEMBER_REMOVED',
        'PORTAL_USER_INVITED',
        'PORTAL_USER_REVOKED',
      ],
    },
  ]

  // Filter logs based on selection
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
          (log.organization_id && log.organization_id.toLowerCase().includes(q)) ||
          (log.entity_type && log.entity_type.toLowerCase().includes(q)) ||
          (log.entity_id && log.entity_id.toLowerCase().includes(q)) ||
          JSON.stringify(log.metadata || log.details || {}).toLowerCase().includes(q)
        if (!match) return false
      }

      // 2. Org Filter
      if (selectedOrg !== 'all') {
        if (selectedOrg === 'global' && log.organization_id !== null) return false
        if (selectedOrg !== 'global' && log.organization_id !== selectedOrg) return false
      }

      // 3. Super Admin Only
      if (superAdminOnly && !log.actor_is_super_admin && !log.action.startsWith('SUPER_ADMIN')) {
        return false
      }

      // 4. Action Group
      if (selectedActionGroup !== 'all') {
        const group = actionGroups.find((g) => g.value === selectedActionGroup)
        if (group?.actions && !group.actions.includes(log.action)) {
          return false
        }
      }

      // 5. Date Range
      if (dateRange !== 'all') {
        const logTime = new Date(log.created_at).getTime()
        if (dateRange === '24h' && now - logTime > 24 * 3600 * 1000) return false
        if (dateRange === '7d' && now - logTime > 7 * 24 * 3600 * 1000) return false
        if (dateRange === '30d' && now - logTime > 30 * 24 * 3600 * 1000) return false
      }

      return true
    })
  }, [logs, searchQuery, selectedOrg, superAdminOnly, selectedActionGroup, dateRange])

  // Org Name map
  const orgMap = useMemo(() => {
    const map = new Map<string, string>()
    organizations.forEach((o) => map.set(o.id, o.name))
    return map
  }, [organizations])

  // Badge styling helper
  const getActionBadge = (action: string, isSuperAdmin: boolean) => {
    if (isSuperAdmin || action.startsWith('SUPER_ADMIN')) {
      return 'bg-purple-500/10 text-purple-400 border-purple-500/30'
    }
    if (action.includes('SUSPENDED') || action.includes('DELETED') || action.includes('FAILED')) {
      return 'bg-rose-500/10 text-rose-400 border-rose-500/30'
    }
    if (action.includes('RESUMED') || action.includes('CREATED') || action.includes('COMPLETED')) {
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
    }
    return 'bg-sky-500/10 text-sky-400 border-sky-500/30'
  }

  // Export CSV Handler
  const handleExportCsv = () => {
    const headers = [
      'Timestamp',
      'Action',
      'Super Admin',
      'Organization ID',
      'Organization Name',
      'Actor Email',
      'Actor Name',
      'Entity Type',
      'Entity ID',
      'IP Address',
      'Details JSON',
    ]
    const rows = filteredLogs.map((l) => [
      `"${l.created_at}"`,
      `"${l.action}"`,
      l.actor_is_super_admin ? 'TRUE' : 'FALSE',
      `"${l.organization_id || 'GLOBAL'}"`,
      `"${l.organization_id ? orgMap.get(l.organization_id) || l.organization_id : 'Platform Global'}"`,
      `"${l.actor_email || ''}"`,
      `"${l.actor_name || ''}"`,
      `"${l.entity_type || l.target_type || ''}"`,
      `"${l.entity_id || l.target_id || ''}"`,
      `"${l.ip_address || ''}"`,
      `"${JSON.stringify(l.metadata || l.details || {}).replace(/"/g, '""')}"`,
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `platform_audit_logs_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-purple-900/30 bg-slate-900/60 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-300">Platform Events</span>
            <div className="rounded-xl bg-purple-500/10 p-2 text-purple-400 border border-purple-500/20">
              <ShieldAlert className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight text-white">{totalCount}</span>
            <span className="text-xs text-slate-400">total across tenants</span>
          </div>
        </div>

        <div className="rounded-2xl border border-purple-900/30 bg-slate-900/60 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Super Admin Actions</span>
            <div className="rounded-xl bg-indigo-500/10 p-2 text-indigo-400 border border-indigo-500/20">
              <UserCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight text-indigo-300">
              {logs.filter((l) => l.actor_is_super_admin).length}
            </span>
            <span className="text-xs text-slate-400">elevated events</span>
          </div>
        </div>

        <div className="rounded-2xl border border-purple-900/30 bg-slate-900/60 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Tamper-Proof Storage</span>
            <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-400 border border-emerald-500/20">
              <Lock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-sm font-bold text-emerald-400">Zero Mutability</span>
            <span className="text-xs text-slate-500">• Immutable RLS</span>
          </div>
        </div>

        <div className="rounded-2xl border border-purple-900/30 bg-slate-900/60 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Showing Entries</span>
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
      <div className="rounded-2xl border border-purple-900/30 bg-slate-900/60 p-4 space-y-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search across all tenants, super admin operators, entity IDs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          {/* Org & Category Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Org Selector */}
            <div className="relative">
              <select
                value={selectedOrg}
                onChange={(e) => setSelectedOrg(e.target.value)}
                className="appearance-none rounded-xl border border-slate-800 bg-slate-950/80 py-2 pl-3 pr-8 text-xs font-medium text-slate-300 focus:border-purple-500 focus:outline-none"
              >
                <option value="all">All Organizations</option>
                <option value="global">Platform Global Events</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
            </div>

            {/* Action Group Selector */}
            <div className="relative">
              <select
                value={selectedActionGroup}
                onChange={(e) => setSelectedActionGroup(e.target.value)}
                className="appearance-none rounded-xl border border-slate-800 bg-slate-950/80 py-2 pl-3 pr-8 text-xs font-medium text-slate-300 focus:border-purple-500 focus:outline-none"
              >
                {actionGroups.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
            </div>

            {/* Date Range Selector */}
            <div className="relative">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="appearance-none rounded-xl border border-slate-800 bg-slate-950/80 py-2 pl-3 pr-8 text-xs font-medium text-slate-300 focus:border-purple-500 focus:outline-none"
              >
                <option value="all">All Time</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
            </div>

            {/* Super Admin Only Filter Toggle */}
            <button
              onClick={() => setSuperAdminOnly(!superAdminOnly)}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
                superAdminOnly
                  ? 'border-purple-500/50 bg-purple-950/80 text-purple-300 shadow-sm'
                  : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserCheck className="h-3.5 w-3.5" />
              <span>Super Admin Only</span>
            </button>

            {/* Export CSV Button */}
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 rounded-xl border border-purple-800/40 bg-purple-950/60 px-3 py-2 text-xs font-semibold text-purple-200 hover:bg-purple-900/60 hover:text-white transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-2xl border border-purple-900/30 bg-slate-900/60 shadow-sm overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800/60 text-slate-500">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-sm font-bold text-white">No platform audit events found</h3>
            <p className="mt-1 text-xs text-slate-400">
              Try adjusting your search query, organization, or action category filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-purple-900/40 bg-slate-950/60 text-[11px] font-bold uppercase tracking-wider text-purple-300/80">
                  <th className="py-3 px-4 w-8"></th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Organization</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-900/20 text-xs text-slate-300">
                {filteredLogs.map((log) => {
                  const isExpanded = expandedLogId === log.id
                  const orgName = log.organization_id
                    ? orgMap.get(log.organization_id) || log.organization_id
                    : 'Platform Global'

                  return (
                    <tr
                      key={log.id}
                      className={`group transition-colors hover:bg-slate-800/40 ${
                        isExpanded ? 'bg-purple-950/20' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <button
                          onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                          className="text-slate-500 hover:text-slate-200 transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-purple-400" />
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
                            log.action,
                            log.actor_is_super_admin
                          )}`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-medium text-slate-200">
                          <Building2 className="h-3.5 w-3.5 text-slate-500" />
                          <span>{orgName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="font-semibold text-slate-200">
                              {log.actor_name || log.actor_email?.split('@')[0] || 'System'}
                            </div>
                            {log.actor_email && (
                              <div className="text-[10px] text-slate-500 font-mono">
                                {log.actor_email}
                              </div>
                            )}
                          </div>
                          {log.actor_is_super_admin && (
                            <span className="rounded bg-purple-950/90 px-1.5 py-0.5 text-[9px] font-extrabold text-purple-300 border border-purple-700/60 shadow-sm">
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
                              ? `:${String(log.entity_id || log.target_id).slice(0, 8)}`
                              : ''}
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-slate-500">
                        {log.ip_address || '127.0.0.1'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Expanded Modal */}
      {expandedLogId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-2xl rounded-2xl border border-purple-900/40 bg-slate-900 p-6 shadow-2xl space-y-4">
            {(() => {
              const log = logs.find((l) => l.id === expandedLogId)
              if (!log) return null

              return (
                <>
                  <div className="flex items-start justify-between border-b border-purple-900/40 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-bold font-mono ${getActionBadge(
                            log.action,
                            log.actor_is_super_admin
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
                        Log ID: {log.id} • {new Date(log.created_at).toISOString()}
                      </p>
                    </div>
                    <button
                      onClick={() => setExpandedLogId(null)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950/60 p-3.5 rounded-xl border border-purple-900/30">
                    <div>
                      <span className="text-slate-500 font-medium">Organization:</span>
                      <p className="text-white font-semibold">
                        {log.organization_id ? orgMap.get(log.organization_id) || log.organization_id : 'Platform Global'}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium">Actor:</span>
                      <p className="text-white font-semibold">
                        {log.actor_name || 'System'} ({log.actor_email || 'N/A'})
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
                      <span className="text-slate-500 font-medium">IP Address & Agent:</span>
                      <p className="text-slate-300 font-mono truncate">
                        {log.ip_address || '127.0.0.1'} ({log.user_agent || 'Client Browser'})
                      </p>
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-purple-200">Event Metadata Payload (JSON)</span>
                    <pre className="mt-2 max-h-60 overflow-y-auto rounded-xl border border-purple-900/30 bg-slate-950 p-4 text-[11px] font-mono text-purple-300">
                      {JSON.stringify(log.metadata || log.details || {}, null, 2)}
                    </pre>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => setExpandedLogId(null)}
                      className="rounded-xl border border-purple-800/40 bg-purple-950/80 px-4 py-2 text-xs font-semibold text-purple-200 hover:bg-purple-900"
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
