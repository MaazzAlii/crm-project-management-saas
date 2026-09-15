'use client'

import { useState } from 'react'
import { ClientRecord } from '@/components/clients/ClientsList'
import { ClientOverviewTab } from '@/components/clients/ClientOverviewTab'
import { ClientProjectsTab } from '@/components/clients/ClientProjectsTab'
import { ClientActivityLogTab, AuditItem } from '@/components/clients/ClientActivityLogTab'
import {
  LayoutDashboard,
  FolderGit2,
  MessageSquare,
  Activity,
  Zap,
} from 'lucide-react'

interface ClientDetailTabsProps {
  client: ClientRecord
  projects?: any[]
  auditLogs?: AuditItem[]
}

type TabType = 'overview' | 'projects' | 'communication' | 'activity'

export function ClientDetailTabs({ client, projects = [], auditLogs = [] }: ClientDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview')

  const tabs = [
    { id: 'overview', label: 'Overview & Notes', icon: LayoutDashboard },
    { id: 'projects', label: `Projects (${projects.length})`, icon: FolderGit2 },
    {
      id: 'communication',
      label: 'Communication History',
      icon: client.communication_mode === 'connected' ? Zap : MessageSquare,
    },
    { id: 'activity', label: 'Activity Log', icon: Activity },
  ]

  return (
    <div className="space-y-6">
      {/* Desktop Tabs & Mobile Select */}
      <div className="border-b border-slate-800">
        {/* Mobile Select dropdown */}
        <div className="md:hidden pb-3">
          <select
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value as TabType)}
            className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-xs font-semibold text-white focus:outline-none"
          >
            {tabs.map((tab) => (
              <option key={tab.id} value={tab.id}>
                {tab.label}
              </option>
            ))}
          </select>
        </div>

        {/* Desktop Tab Bar */}
        <div className="hidden md:flex items-center gap-6">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 py-3.5 text-xs font-bold transition border-b-2 -mb-px ${
                  isActive
                    ? 'border-sky-500 text-sky-400'
                    : 'border-transparent text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'overview' && <ClientOverviewTab client={client} />}
        {activeTab === 'projects' && <ClientProjectsTab projects={projects} />}
        {activeTab === 'communication' && (
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-10 text-center space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 mx-auto">
              {client.communication_mode === 'connected' ? <Zap className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
            </div>
            <h3 className="text-base font-bold text-white">Communication Logs & Sync</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              {client.communication_mode === 'connected'
                ? 'Connected Hub mode is active. Message history and automated channel updates will auto-sync here once channel integration is linked (Task 41).'
                : 'Manual Mode is active. Log custom client calls, off-platform meetings, and manual notes.'}
            </p>
          </div>
        )}
        {activeTab === 'activity' && <ClientActivityLogTab logs={auditLogs} />}
      </div>
    </div>
  )
}
