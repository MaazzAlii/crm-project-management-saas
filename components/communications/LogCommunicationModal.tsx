'use client'

import { useState } from 'react'
import { logCommunicationAction } from '@/app/(dashboard)/clients/[id]/communications/actions'
import {
  X,
  MessageSquare,
  Mail,
  PhoneCall,
  Calendar,
  FileText,
  Send,
  Loader2,
  Clock,
  User,
} from 'lucide-react'

interface LogCommunicationModalProps {
  clientId: string
  clientName: string
  clientEmail?: string | null
  clientPhone?: string | null
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export const CHANNEL_OPTIONS = [
  { value: 'email', label: 'Email', icon: Mail, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  { value: 'whatsapp', label: 'WhatsApp', icon: MessageSquare, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  { value: 'call', label: 'Phone Call', icon: PhoneCall, color: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
  { value: 'meeting', label: 'Meeting / Call Log', icon: Calendar, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
  { value: 'sms', label: 'SMS', icon: MessageSquare, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  { value: 'note', label: 'Internal Note', icon: FileText, color: 'text-slate-300 bg-slate-800 border-slate-700' },
  { value: 'slack', label: 'Slack', icon: MessageSquare, color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
]

export function LogCommunicationModal({
  clientId,
  clientName,
  clientEmail,
  clientPhone,
  isOpen,
  onClose,
  onSuccess,
}: LogCommunicationModalProps) {
  const [channelType, setChannelType] = useState('email')
  const [direction, setDirection] = useState<'inbound' | 'outbound'>('outbound')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [senderName, setSenderName] = useState('')
  const [senderIdentifier, setSenderIdentifier] = useState(clientEmail || clientPhone || '')
  const [sentAt, setSentAt] = useState(new Date().toISOString().slice(0, 16))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData()
    formData.append('client_id', clientId)
    formData.append('channel_type', channelType)
    formData.append('direction', direction)
    formData.append('subject', subject)
    formData.append('body', body)
    formData.append('sender_name', senderName)
    formData.append('sender_identifier', senderIdentifier)
    formData.append('sent_at', sentAt)

    const res = await logCommunicationAction(formData)

    setLoading(false)

    if (res.error) {
      setError(res.error)
    } else {
      setSubject('')
      setBody('')
      onClose()
      if (onSuccess) onSuccess()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
              <Send className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Log Communication</h2>
              <p className="text-xs text-slate-400">Record call, email, or message entry for <span className="font-semibold text-slate-200">{clientName}</span></p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3.5 text-xs text-rose-300 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Channel Selector */}
          <div>
            <label className="block text-slate-400 font-medium mb-1.5">Communication Channel</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CHANNEL_OPTIONS.map((opt) => {
                const Icon = opt.icon
                const isSelected = channelType === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setChannelType(opt.value)
                      if (opt.value === 'email' && clientEmail) setSenderIdentifier(clientEmail)
                      else if (opt.value === 'whatsapp' || opt.value === 'call' || opt.value === 'sms') {
                        if (clientPhone) setSenderIdentifier(clientPhone)
                      }
                    }}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-left font-semibold transition ${
                      isSelected
                        ? 'border-sky-500 bg-sky-500/10 text-white'
                        : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{opt.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Direction Toggle */}
          <div>
            <label className="block text-slate-400 font-medium mb-1.5">Direction</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDirection('outbound')}
                className={`py-2 px-3 rounded-xl border font-bold text-center transition ${
                  direction === 'outbound'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                    : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700'
                }`}
              >
                Outbound (Sent to Client)
              </button>
              <button
                type="button"
                onClick={() => setDirection('inbound')}
                className={`py-2 px-3 rounded-xl border font-bold text-center transition ${
                  direction === 'inbound'
                    ? 'border-sky-500 bg-sky-500/10 text-sky-400'
                    : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700'
                }`}
              >
                Inbound (Received from Client)
              </button>
            </div>
          </div>

          {/* Subject Line */}
          <div>
            <label className="block text-slate-400 font-medium mb-1.5">Subject / Title (Optional)</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Discovery Call Notes, Weekly Update, Contract Review"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-white placeholder-slate-600 focus:border-sky-500 focus:outline-none"
            />
          </div>

          {/* Sender Details & Timestamp Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-medium mb-1.5">Sender / Contact Name</label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-500" />
                <input
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder={direction === 'inbound' ? clientName : 'Your / Agency Member Name'}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-9 pr-3.5 py-2.5 text-white placeholder-slate-600 focus:border-sky-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1.5">Timestamp (Sent At)</label>
              <div className="relative">
                <Clock className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-500" />
                <input
                  type="datetime-local"
                  value={sentAt}
                  onChange={(e) => setSentAt(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-9 pr-3.5 py-2.5 text-white focus:border-sky-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Message Body / Log Notes */}
          <div>
            <label className="block text-slate-400 font-medium mb-1.5">Communication Content / Notes *</label>
            <textarea
              required
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Record details of the discussion, client feedback, action items..."
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-white placeholder-slate-600 focus:border-sky-500 focus:outline-none leading-relaxed"
            />
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-400 font-semibold hover:bg-slate-800 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold shadow-lg shadow-sky-500/20 transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Communication Entry'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
