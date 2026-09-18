'use client'

import { Search, MessageSquare, Sparkles } from 'lucide-react'
import { InboxMessageRecord } from '@/lib/inbox/query'
import { PROVIDER_BRANDING, getProviderMeta } from './providerBranding'
import { ChannelStatusBadge } from './ChannelStatusBadge'

interface ConversationListProps {
  conversations: {
    senderKey: string
    messages: InboxMessageRecord[]
    latestMessage: InboxMessageRecord
    hasUnread: boolean
    isUnmatched: boolean
  }[]
  selectedSenderKey: string
  onSelectConversation: (senderKey: string) => void
  searchQuery: string
  onSearchChange: (q: string) => void
  activeProvider: string
  onProviderChange: (provider: string) => void
  readFilter: 'all' | 'unread' | 'unmatched'
  onReadFilterChange: (filter: 'all' | 'unread' | 'unmatched') => void
  unreadByProvider?: Record<string, number>
}

const PROVIDERS = ['ALL', 'slack', 'whatsapp', 'email', 'discord', 'upwork']

export function ConversationList({
  conversations,
  selectedSenderKey,
  onSelectConversation,
  searchQuery,
  onSearchChange,
  activeProvider,
  onProviderChange,
  readFilter,
  onReadFilterChange,
  unreadByProvider = {}
}: ConversationListProps) {
  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString)
      const now = new Date()
      const diffHours = (now.getTime() - d.getTime()) / (1000 * 60 * 60)

      if (diffHours < 24) {
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
    } catch {
      return ''
    }
  }

  // Calculate unread count for 'ALL'
  const totalUnread = Object.values(unreadByProvider).reduce((sum, n) => sum + (n || 0), 0)

  return (
    <div className="h-full flex flex-col bg-slate-50/70 dark:bg-slate-900/60 border-r border-slate-200 dark:border-slate-800">
      {/* Search & Provider Filter Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search messages, clients, handles..."
            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition"
          />
        </div>

        {/* Read / Unmatched Status Filter Pills */}
        <div className="flex items-center gap-1 bg-slate-200/60 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => onReadFilterChange('all')}
            className={`flex-1 py-1 text-center rounded-lg transition ${
              readFilter === 'all'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => onReadFilterChange('unread')}
            className={`flex-1 py-1 text-center rounded-lg transition flex items-center justify-center gap-1 ${
              readFilter === 'unread'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <span>Unread</span>
            {totalUnread > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-indigo-600 text-white">
                {totalUnread}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => onReadFilterChange('unmatched')}
            className={`flex-1 py-1 text-center rounded-lg transition ${
              readFilter === 'unmatched'
                ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Unmatched
          </button>
        </div>

        {/* Provider Pills with Brand Styling & Unread Indicators */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          {PROVIDERS.map((prov) => {
            const isAll = prov === 'ALL'
            const isSelected = activeProvider.toLowerCase() === prov.toLowerCase()
            const meta = !isAll ? getProviderMeta(prov) : null
            const unreadCount = isAll ? totalUnread : unreadByProvider[prov.toLowerCase()] || 0

            return (
              <button
                key={prov}
                type="button"
                onClick={() => onProviderChange(prov)}
                className={`px-2.5 py-1 rounded-full font-semibold border transition shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? isAll
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
                style={
                  isSelected && meta
                    ? meta.activeTabStyle
                    : undefined
                }
              >
                {!isAll && meta && (
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: isSelected ? '#ffffff' : meta.color }}
                  />
                )}
                <span className="capitalize">{prov}</span>

                {/* Unread message indicator per channel */}
                {unreadCount > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[9px] font-extrabold leading-none ${
                      isSelected
                        ? 'bg-white text-slate-900'
                        : 'bg-indigo-600 text-white shadow-xs'
                    }`}
                  >
                    {unreadCount}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Conversations Scroll Area */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-200/60 dark:divide-slate-800/60">
        {conversations.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            <MessageSquare className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
            No conversations match your filters
          </div>
        ) : (
          conversations.map((conv) => {
            const isSelected = selectedSenderKey === conv.senderKey
            const latest = conv.latestMessage
            const prov = latest.channel?.provider || 'email'
            const channelStatus = latest.channel?.status || 'active'
            const title = latest.client?.name || latest.sender_name || latest.sender_identifier || 'Unknown Sender'

            return (
              <button
                key={conv.senderKey}
                type="button"
                onClick={() => onSelectConversation(conv.senderKey)}
                className={`w-full text-left p-3.5 transition flex items-start gap-3 relative ${
                  isSelected
                    ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-l-4 border-l-indigo-600'
                    : 'hover:bg-slate-100/60 dark:hover:bg-slate-800/40'
                }`}
              >
                {/* Avatar / Initials */}
                <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-200 shrink-0 relative">
                  {title.charAt(0).toUpperCase()}
                  {conv.hasUnread && (
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-indigo-600 border-2 border-white dark:border-slate-900 shadow-[0_0_8px_rgba(79,70,229,0.9)]" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <div className="font-semibold text-xs text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                      <span className="truncate">{title}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {formatTime(latest.sent_at)}
                    </span>
                  </div>

                  {/* Channel Status Badges & Provider Pill */}
                  <div className="flex items-center gap-1.5 mt-1">
                    <ChannelStatusBadge
                      provider={prov}
                      channelName={latest.channel?.channel_name}
                      status={channelStatus as any}
                      showStatusDot={true}
                      size="sm"
                      allowModal={true}
                      channelInfo={latest.channel as any}
                    />

                    {conv.isUnmatched && (
                      <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
                        Unmatched
                      </span>
                    )}

                    {latest.client?.company_name && (
                      <span className="text-[10px] text-slate-400 truncate">
                        {latest.client.company_name}
                      </span>
                    )}
                  </div>

                  <p className={`text-xs line-clamp-1 mt-1 font-normal ${
                    conv.hasUnread
                      ? 'text-slate-900 dark:text-white font-medium'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}>
                    {latest.body}
                  </p>
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
