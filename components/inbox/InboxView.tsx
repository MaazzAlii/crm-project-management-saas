'use client'

import { useState } from 'react'
import {
  Inbox,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Mail,
  Phone,
  RefreshCw,
  CheckCheck
} from 'lucide-react'
import { InboxMessageRecord, InboxSummary } from '@/lib/inbox/query'
import { ClientSelectItem, markAllReadAction, markMessageReadAction } from '@/app/(dashboard)/inbox/actions'
import { ConversationList } from './ConversationList'
import { MessageThread } from './MessageThread'

interface InboxViewProps {
  initialMessages: InboxMessageRecord[]
  initialSummary: InboxSummary
  clients: ClientSelectItem[]
  channels: { id: string; provider: string; channel_name?: string | null }[]
}

export function InboxView({
  initialMessages,
  initialSummary,
  clients,
  channels
}: InboxViewProps) {
  const [messages, setMessages] = useState<InboxMessageRecord[]>(initialMessages)
  const [summary, setSummary] = useState<InboxSummary>(initialSummary)
  const [selectedSenderKey, setSelectedSenderKey] = useState<string>(() => {
    if (initialMessages.length > 0) {
      return initialMessages[0].client_id || initialMessages[0].sender_identifier || 'default'
    }
    return ''
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [activeProvider, setActiveProvider] = useState('ALL')
  const [readFilter, setReadFilter] = useState<'all' | 'unread' | 'unmatched'>('all')
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false)

  // Group messages into distinct conversation threads by sender key (client_id || sender_identifier)
  const conversationMap = new Map<
    string,
    {
      senderKey: string
      messages: InboxMessageRecord[]
      latestMessage: InboxMessageRecord
      hasUnread: boolean
      isUnmatched: boolean
    }
  >()

  messages.forEach((msg) => {
    const key = msg.client_id || msg.sender_identifier || msg.id
    if (!conversationMap.has(key)) {
      conversationMap.set(key, {
        senderKey: key,
        messages: [],
        latestMessage: msg,
        hasUnread: false,
        isUnmatched: !msg.client_id
      })
    }
    const conv = conversationMap.get(key)!
    conv.messages.push(msg)
    if (!msg.read_at && msg.direction === 'inbound') {
      conv.hasUnread = true
    }
  })

  let conversations = Array.from(conversationMap.values())

  // Apply Filters
  if (activeProvider !== 'ALL') {
    conversations = conversations.filter(
      (c) => c.latestMessage.channel?.provider === activeProvider.toLowerCase()
    )
  }

  if (readFilter === 'unread') {
    conversations = conversations.filter((c) => c.hasUnread)
  } else if (readFilter === 'unmatched') {
    conversations = conversations.filter((c) => c.isUnmatched)
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase()
    conversations = conversations.filter(
      (c) =>
        c.latestMessage.body.toLowerCase().includes(q) ||
        (c.latestMessage.sender_name && c.latestMessage.sender_name.toLowerCase().includes(q)) ||
        (c.latestMessage.sender_identifier && c.latestMessage.sender_identifier.toLowerCase().includes(q))
    )
  }

  // Active selected thread messages
  const activeConv = conversationMap.get(selectedSenderKey) || (conversations.length > 0 ? conversations[0] : null)
  const activeMessages = activeConv ? activeConv.messages : []

  // Mark message as read when selected
  const handleSelectConversation = async (key: string) => {
    setSelectedSenderKey(key)
    const targetConv = conversationMap.get(key)
    if (targetConv && targetConv.hasUnread) {
      // Optimistically update read status
      setMessages((prev) =>
        prev.map((m) => {
          if ((m.client_id || m.sender_identifier) === key && !m.read_at) {
            return { ...m, read_at: new Date().toISOString() }
          }
          return m
        })
      )

      // Fire server action to mark as read
      targetConv.messages.forEach((m) => {
        if (!m.read_at && m.direction === 'inbound') {
          markMessageReadAction(m.id)
        }
      })
    }
  }

  const handleMarkAllRead = async () => {
    setIsMarkingAllRead(true)
    try {
      await markAllReadAction()
      setMessages((prev) =>
        prev.map((m) => ({ ...m, read_at: m.read_at || new Date().toISOString() }))
      )
      setSummary((prev) => ({ ...prev, unreadCount: 0 }))
    } catch (err: any) {
      alert(err.message || 'Error marking all read')
    } finally {
      setIsMarkingAllRead(false)
    }
  }

  const handleMessageSent = (newMsg: InboxMessageRecord) => {
    setMessages((prev) => [newMsg, ...prev])
  }

  const handleClientAssigned = (messageId: string, clientId: string) => {
    const targetClient = clients.find((c) => c.id === clientId)
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === messageId) {
          return {
            ...m,
            client_id: clientId,
            client: targetClient
              ? { id: targetClient.id, name: targetClient.name, company_name: targetClient.company_name, email: targetClient.email }
              : m.client
          }
        }
        return m
      })
    )
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col -m-4 md:-m-6">
      {/* Top Header & Metrics Strip */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Inbox className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Communication Hub — Unified Inbox
            </h1>
            <span className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 text-xs font-semibold px-2.5 py-0.5 rounded-full">
              {summary.totalMessages} Messages
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time multi-channel communication across Slack, WhatsApp, Email, Discord, and Upwork.
          </p>
        </div>

        {/* Quick KPI Badges & Mark All Read */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900 rounded-lg font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              {summary.unreadCount} Unread
            </span>

            <span className="px-3 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900 rounded-lg font-semibold flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              {summary.unmatchedCount} Unmatched
            </span>
          </div>

          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={isMarkingAllRead || summary.unreadCount === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold disabled:opacity-50 transition"
          >
            <CheckCheck className="w-3.5 h-3.5 text-slate-500" />
            Mark All Read
          </button>
        </div>
      </div>

      {/* Main 2-Pane Split Container */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0 overflow-hidden">
        {/* Left Pane: Conversation List (4 columns) */}
        <div className="md:col-span-4 h-full min-h-0">
          <ConversationList
            conversations={conversations}
            selectedSenderKey={selectedSenderKey}
            onSelectConversation={handleSelectConversation}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            activeProvider={activeProvider}
            onProviderChange={setActiveProvider}
            readFilter={readFilter}
            onReadFilterChange={setReadFilter}
          />
        </div>

        {/* Right Pane: Message Thread View & Compose (8 columns) */}
        <div className="md:col-span-8 h-full min-h-0">
          <MessageThread
            messages={activeMessages}
            selectedSenderKey={selectedSenderKey}
            clients={clients}
            onMessageSent={handleMessageSent}
            onClientAssigned={handleClientAssigned}
          />
        </div>
      </div>
    </div>
  )
}
