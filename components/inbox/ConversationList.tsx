'use client'

import { Search, Filter, MessageSquare, AlertCircle } from 'lucide-react'
import { InboxMessageRecord } from '@/lib/inbox/query'

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
}

const PROVIDERS = ['ALL', 'slack', 'whatsapp', 'email', 'upwork']

export function ConversationList({
  conversations,
  selectedSenderKey,
  onSelectConversation,
  searchQuery,
  onSearchChange,
  activeProvider,
  onProviderChange,
  readFilter,
  onReadFilterChange
}: ConversationListProps) {
  const getProviderPill = (prov: string) => {
    switch (prov.toLowerCase()) {
      case 'slack':
        return { label: 'Slack', style: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' }
      case 'whatsapp':
        return { label: 'WhatsApp', style: 'bg-green-500/10 text-green-500 border-green-500/20' }
      case 'email':
        return { label: 'Email', style: 'bg-blue-500/10 text-blue-500 border-blue-500/20' }
      case 'upwork':
        return { label: 'Upwork', style: 'bg-amber-500/10 text-amber-500 border-amber-500/20' }
      default:
        return { label: prov, style: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' }
    }
  }

  const formatTime = (isoString: string) => {
    const d = new Date(isoString)
    const now = new Date()
    const diffHours = (now.getTime() - d.getTime()) / (1000 * 60 * 60)

    if (diffHours < 24) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

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
            placeholder="Search conversations..."
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
            className={`flex-1 py-1 text-center rounded-lg transition ${
              readFilter === 'unread'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Unread
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

        {/* Provider Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          {PROVIDERS.map((prov) => (
            <button
              key={prov}
              type="button"
              onClick={() => onProviderChange(prov)}
              className={`px-2.5 py-1 rounded-full font-semibold border transition shrink-0 capitalize ${
                activeProvider === prov
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              {prov}
            </button>
          ))}
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
            const badge = getProviderPill(prov)
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
                <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-200 shrink-0">
                  {title.charAt(0).toUpperCase()}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <div className="font-semibold text-xs text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                      <span className="truncate">{title}</span>
                      {conv.hasUnread && (
                        <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {formatTime(latest.sent_at)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`text-[9px] font-semibold px-1.5 py-0.2 rounded border ${badge.style}`}>
                      {badge.label}
                    </span>
                    {conv.isUnmatched && (
                      <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20">
                        Unmatched
                      </span>
                    )}
                    {latest.client?.company_name && (
                      <span className="text-[10px] text-slate-400 truncate">
                        {latest.client.company_name}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-1 font-normal">
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
