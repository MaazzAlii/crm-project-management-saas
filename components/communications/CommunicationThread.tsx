'use client'

import { useState } from 'react'
import { CommunicationItem } from '@/app/(dashboard)/clients/[id]/communications/actions'
import {
  Mail,
  MessageSquare,
  PhoneCall,
  Calendar,
  FileText,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  User,
  Zap,
  Filter,
} from 'lucide-react'
import { CHANNEL_OPTIONS } from './LogCommunicationModal'

interface CommunicationThreadProps {
  communications: CommunicationItem[]
  communicationMode?: string
}

export function CommunicationThread({
  communications,
  communicationMode = 'manual',
}: CommunicationThreadProps) {
  const [selectedChannel, setSelectedChannel] = useState<string>('all')
  const [directionFilter, setDirectionFilter] = useState<'all' | 'inbound' | 'outbound'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Filter messages
  const filteredMessages = communications.filter((msg) => {
    // Channel filter
    if (selectedChannel !== 'all' && msg.channel_type.toLowerCase() !== selectedChannel.toLowerCase()) {
      return false
    }

    // Direction filter
    if (directionFilter !== 'all' && msg.direction !== directionFilter) {
      return false
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const bodyMatch = msg.body.toLowerCase().includes(q)
      const subjectMatch = msg.subject ? msg.subject.toLowerCase().includes(q) : false
      const senderMatch = msg.sender_name ? msg.sender_name.toLowerCase().includes(q) : false
      const identifierMatch = msg.sender_identifier ? msg.sender_identifier.toLowerCase().includes(q) : false
      if (!bodyMatch && !subjectMatch && !senderMatch && !identifierMatch) {
        return false
      }
    }

    return true
  })

  return (
    <div className="space-y-6">
      {/* Mode Banner */}
      <div className={`rounded-2xl border p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
        communicationMode === 'connected'
          ? 'border-sky-500/30 bg-sky-500/5 text-sky-200'
          : 'border-amber-500/30 bg-amber-500/5 text-amber-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            communicationMode === 'connected'
              ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
          }`}>
            {communicationMode === 'connected' ? <Zap className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-white">
                {communicationMode === 'connected' ? 'Connected Hub Mode Active' : 'Manual Mode Active'}
              </h4>
              <span className={`text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full border ${
                communicationMode === 'connected'
                  ? 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}>
                {communicationMode === 'connected' ? 'Auto-Synced & Manual' : 'Manual Entry'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {communicationMode === 'connected'
                ? 'All synced messages from integrated platforms (WhatsApp, Slack, Email) and manual logs are unified below.'
                : 'Logging communications manually via calls, meetings, notes, and direct messages.'}
            </p>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search communications by keyword, subject, sender..."
            className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Channel Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-slate-400 font-medium hidden sm:inline">Channel:</span>
            <select
              value={selectedChannel}
              onChange={(e) => setSelectedChannel(e.target.value)}
              className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900 text-white">All Channels</option>
              {CHANNEL_OPTIONS.map((ch) => (
                <option key={ch.value} value={ch.value} className="bg-slate-900 text-white">
                  {ch.label}
                </option>
              ))}
            </select>
          </div>

          {/* Direction Filter */}
          <div className="flex items-center rounded-xl bg-slate-950 p-1 border border-slate-800">
            <button
              onClick={() => setDirectionFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                directionFilter === 'all'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setDirectionFilter('outbound')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                directionFilter === 'outbound'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Outbound
            </button>
            <button
              onClick={() => setDirectionFilter('inbound')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                directionFilter === 'inbound'
                  ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Inbound
            </button>
          </div>
        </div>
      </div>

      {/* Communications Timeline Thread */}
      {filteredMessages.length === 0 ? (
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/30 p-12 text-center space-y-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800/50 text-slate-500 mx-auto">
            <MessageSquare className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-white">No communications found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery || selectedChannel !== 'all' || directionFilter !== 'all'
              ? 'No messages match your search filter criteria. Try resetting filters.'
              : 'No communication records logged for this client yet. Click "Log Communication" to add your first record.'}
          </p>
        </div>
      ) : (
        <div className="relative space-y-4">
          {/* Thread vertical line */}
          <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-slate-800 hidden sm:block" />

          {filteredMessages.map((msg) => {
            const channelMeta = CHANNEL_OPTIONS.find(
              (c) => c.value === msg.channel_type.toLowerCase()
            ) || {
              label: msg.channel_type,
              icon: MessageSquare,
              color: 'text-slate-300 bg-slate-800 border-slate-700',
            }

            const Icon = channelMeta.icon
            const isOutbound = msg.direction === 'outbound'

            return (
              <div
                key={msg.id}
                className="relative flex flex-col sm:flex-row items-start gap-4 rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 sm:p-5 hover:border-slate-700/80 transition shadow-sm"
              >
                {/* Channel Icon Avatar */}
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${channelMeta.color} z-10`}>
                  <Icon className="h-5.5 w-5.5" />
                </div>

                {/* Content Card Body */}
                <div className="flex-1 min-w-0 space-y-2 w-full">
                  {/* Card Header Info */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/60 pb-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Direction badge */}
                      <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                        isOutbound
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                          : 'border-sky-500/30 bg-sky-500/10 text-sky-400'
                      }`}>
                        {isOutbound ? (
                          <>
                            <ArrowUpRight className="h-3 w-3" />
                            Outbound
                          </>
                        ) : (
                          <>
                            <ArrowDownLeft className="h-3 w-3" />
                            Inbound
                          </>
                        )}
                      </span>

                      {/* Channel Badge */}
                      <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border capitalize ${channelMeta.color}`}>
                        {channelMeta.label}
                      </span>

                      {/* Manual / Auto badge */}
                      {msg.is_manual ? (
                        <span className="text-[10px] font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">
                          Manual Log
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-sky-400 bg-sky-950/80 px-2 py-0.5 rounded-md border border-sky-800">
                          Auto-Synced
                        </span>
                      )}
                    </div>

                    {/* Timestamp */}
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <Clock className="h-3.5 w-3.5 text-slate-500" />
                      <span>{new Date(msg.sent_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    </div>
                  </div>

                  {/* Sender line & Subject */}
                  <div>
                    {msg.sender_name && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                        <User className="h-3.5 w-3.5 text-slate-500" />
                        <span className="font-semibold text-slate-300">{msg.sender_name}</span>
                        {msg.sender_identifier && (
                          <span className="text-slate-500">({msg.sender_identifier})</span>
                        )}
                      </div>
                    )}
                    {msg.subject && (
                      <h4 className="text-sm font-bold text-white mb-1.5">{msg.subject}</h4>
                    )}
                  </div>

                  {/* Message Body */}
                  <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed bg-slate-950/40 p-3 rounded-xl border border-slate-800/40">
                    {msg.body}
                  </p>

                  {/* Extra metadata if present */}
                  {msg.metadata && msg.metadata.duration_minutes && (
                    <div className="text-[11px] text-slate-400 font-medium">
                      Call duration: <span className="text-white font-bold">{msg.metadata.duration_minutes} mins</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
