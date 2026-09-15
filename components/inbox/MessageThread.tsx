'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Building2,
  User,
  Mail,
  Phone,
  MessageSquare,
  CheckCircle2,
  Clock,
  UserPlus,
  ExternalLink,
  ChevronDown
} from 'lucide-react'
import { InboxMessageRecord } from '@/lib/inbox/query'
import { ClientSelectItem, assignMessageClientAction } from '@/app/(dashboard)/inbox/actions'
import { ComposeBox } from './ComposeBox'

interface MessageThreadProps {
  messages: InboxMessageRecord[]
  selectedSenderKey: string
  clients: ClientSelectItem[]
  onMessageSent: (newMessage: InboxMessageRecord) => void
  onClientAssigned: (messageId: string, clientId: string) => void
}

export function MessageThread({
  messages,
  selectedSenderKey,
  clients,
  onMessageSent,
  onClientAssigned
}: MessageThreadProps) {
  const [selectedClientId, setSelectedClientId] = useState('')
  const [isAssigning, setIsAssigning] = useState(false)
  const [showAssignDropdown, setShowAssignDropdown] = useState(false)

  if (!messages || messages.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-slate-50/50 dark:bg-slate-900/30">
        <MessageSquare className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
        <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Select a Conversation</h3>
        <p className="text-xs text-slate-500 max-w-sm mt-1">
          Choose a message thread from the list on the left to view full message history and reply across channels.
        </p>
      </div>
    )
  }

  const latestMessage = messages[0]
  const client = latestMessage.client
  const channel = latestMessage.channel
  const provider = channel?.provider || 'email'
  const activeChannelId = latestMessage.channel_id
  const senderName = latestMessage.sender_name || latestMessage.sender_identifier || 'Unknown Sender'
  const isUnmatched = !latestMessage.client_id

  const handleAssignClient = async (clientId: string) => {
    if (!clientId) return
    setIsAssigning(true)
    try {
      // Assign all messages in thread matching this sender_identifier
      for (const msg of messages) {
        await assignMessageClientAction(msg.id, clientId)
        onClientAssigned(msg.id, clientId)
      }
      setShowAssignDropdown(false)
    } catch (err: any) {
      alert(err.message || 'Failed to assign client')
    } finally {
      setIsAssigning(false)
    }
  }

  const getProviderBadge = (prov: string) => {
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

  const badge = getProviderBadge(provider)

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800">
      {/* Thread Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
            {senderName.charAt(0).toUpperCase()}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-slate-900 dark:text-white text-base">
                {client?.name || senderName}
              </h2>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badge.style}`}>
                {badge.label}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {client?.company_name && (
                <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                  <Building2 className="w-3 h-3 text-slate-400" />
                  {client.company_name}
                </span>
              )}
              {latestMessage.sender_identifier && (
                <span>{latestMessage.sender_identifier}</span>
              )}
            </div>
          </div>
        </div>

        {/* Right Action: Link or View Profile */}
        <div>
          {client ? (
            <Link
              href={`/clients/${client.id}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg transition"
            >
              <User className="w-3.5 h-3.5" />
              View Client Profile
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </Link>
          ) : (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowAssignDropdown(!showAssignDropdown)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border border-amber-500/20 rounded-lg transition"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Assign to Client
                <ChevronDown className="w-3 h-3" />
              </button>

              {showAssignDropdown && (
                <div className="absolute right-0 top-9 z-20 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-3 space-y-2 text-xs">
                  <div className="font-semibold text-slate-700 dark:text-slate-200">
                    Select Client Profile:
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {clients.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleAssignClient(c.id)}
                        disabled={isAssigning}
                        className="w-full text-left p-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-200 flex flex-col gap-0.5 transition"
                      >
                        <span className="font-medium text-slate-900 dark:text-white">{c.name}</span>
                        {c.company_name && (
                          <span className="text-[11px] text-slate-400">{c.company_name}</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Unmatched Triage Banner */}
      {isUnmatched && (
        <div className="px-4 py-2.5 bg-amber-500/10 border-b border-amber-500/20 text-xs text-amber-700 dark:text-amber-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Unmatched Inbound Message — Assign to an existing client profile to aggregate history.</span>
          </div>
        </div>
      )}

      {/* Message History Stream */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.slice().reverse().map((msg) => {
          const isOutbound = msg.direction === 'outbound'

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isOutbound ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1 px-1">
                <span>{msg.sender_name || (isOutbound ? 'You' : senderName)}</span>
                <span>•</span>
                <span>
                  {new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                {isOutbound && (
                  <CheckCircle2 className="w-3 h-3 text-indigo-500 ml-0.5" />
                )}
              </div>

              <div
                className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  isOutbound
                    ? 'bg-indigo-600 text-white rounded-br-xs shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-xs border border-slate-200/60 dark:border-slate-700/60'
                }`}
              >
                <div className="whitespace-pre-wrap break-words">{msg.body}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Bottom Compose Input Box */}
      <ComposeBox
        activeChannelId={activeChannelId}
        activeProvider={provider}
        clientId={latestMessage.client_id}
        recipientIdentifier={latestMessage.sender_identifier}
        onMessageSent={onMessageSent}
      />
    </div>
  )
}
