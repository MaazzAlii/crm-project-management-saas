'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Activity,
  Sliders,
  Sparkles
} from 'lucide-react'
import { getProviderMeta } from '@/components/inbox/providerBranding'
import { ConnectionStatusModal, ChannelStatusInfo } from '@/components/inbox/ConnectionStatusModal'

export interface IntegrationCardItem {
  id: 'slack' | 'whatsapp' | 'email' | 'discord' | 'upwork'
  name: string
  description: string
  isConnected: boolean
  channel: any | null
  href: string
}

interface IntegrationsListProps {
  integrations: IntegrationCardItem[]
}

export function IntegrationsList({ integrations }: IntegrationsListProps) {
  const [selectedChannel, setSelectedChannel] = useState<ChannelStatusInfo | null>(null)

  const handleOpenStatus = (item: IntegrationCardItem) => {
    const meta = getProviderMeta(item.id)
    setSelectedChannel({
      id: item.channel?.id,
      provider: item.id,
      channel_name: item.channel?.channel_name || meta.name,
      status: item.isConnected ? 'active' : 'disconnected',
      connected_at: item.channel?.connected_at,
      updated_at: item.channel?.updated_at || item.channel?.connected_at,
      external_account_id: item.channel?.external_account_id,
      metadata: item.channel?.metadata
    })
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {integrations.map((item) => {
          const meta = getProviderMeta(item.id)
          const Icon = meta.icon
          const isConnected = item.isConnected

          return (
            <div
              key={item.id}
              className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 flex flex-col justify-between transition-all hover:border-slate-700 shadow-lg hover:shadow-sky-500/5 relative overflow-hidden"
            >
              {/* Brand Accent Top Glow */}
              <div
                className="absolute top-0 left-0 right-0 h-1 opacity-80"
                style={{ backgroundColor: meta.color }}
              />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div
                    className="h-11 w-11 rounded-xl border flex items-center justify-center transition-transform hover:scale-105"
                    style={{
                      backgroundColor: meta.bgColor,
                      borderColor: meta.borderColor,
                      color: meta.color
                    }}
                  >
                    <Icon className="h-5.5 w-5.5" />
                  </div>

                  {/* Channel Connection Status Badge */}
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition ${
                        isConnected
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isConnected
                            ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse'
                            : 'bg-slate-500'
                        }`}
                      />
                      {isConnected ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>{item.name}</span>
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full border"
                      style={meta.badgeStyle}
                    >
                      {meta.name}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>

              {/* Action Ribbon & Modal Trigger */}
              <div className="pt-5 mt-4 border-t border-slate-800/60 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenStatus(item)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  <Activity className="h-3.5 w-3.5 text-indigo-400" />
                  Connection Status
                </button>

                <Link
                  href={item.href}
                  className="inline-flex items-center gap-1 text-xs font-semibold hover:opacity-90 transition-colors"
                  style={{ color: meta.color }}
                >
                  Manage Settings <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          )
        })}
      </div>

      {/* Connection Status Modal */}
      <ConnectionStatusModal
        isOpen={Boolean(selectedChannel)}
        onClose={() => setSelectedChannel(null)}
        channel={selectedChannel}
      />
    </>
  )
}
