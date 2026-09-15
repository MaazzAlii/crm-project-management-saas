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

import { ClientCommunicationsView } from '@/components/communications/ClientCommunicationsView'
import { CommunicationItem } from '@/app/(dashboard)/clients/[id]/communications/actions'

interface ClientDetailTabsProps {
  client: ClientRecord
  projects?: any[]
  auditLogs?: AuditItem[]
  initialCommunications?: CommunicationItem[]
}

type TabType = 'overview' | 'projects' | 'communication' | 'activity'

export function ClientDetailTabs({
  client,
  projects = [],
  auditLogs = [],
  initialCommunications = [],
}: ClientDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview')

  const tabs = [
    { id: 'overview', label: 'Overview & Notes', icon: LayoutDashboard },
    { id: 'projects', label: `Projects (${projects.length})`, icon: FolderGit2 },
    {
      id: 'communication',
      label: `Communications (${initialCommunications.length})`,
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
          <ClientCommunicationsView
            client={client}
            initialCommunications={initialCommunications}
            showBackLink={false}
          />
        )}
        {activeTab === 'activity' && <ClientActivityLogTab logs={auditLogs} />}
      </div>
    </div>
  )
}
