'use client'

import { useState } from 'react'
import { Send, Paperclip, Sparkles, MessageSquare, Mail, PhoneCall, CheckCircle2 } from 'lucide-react'
import { sendOutboundMessageAction } from '@/app/(dashboard)/inbox/actions'
import { InboxMessageRecord } from '@/lib/inbox/query'

interface ComposeBoxProps {
  activeChannelId: string
  activeProvider: string
  clientId?: string | null
  recipientIdentifier?: string | null
  onMessageSent: (newMessage: InboxMessageRecord) => void
}

const TEMPLATES = [
  'Thanks for reaching out! We are looking into this and will get back to you shortly.',
  'Could you please share your availability for a brief 15-minute call tomorrow?',
  'The latest deliverable preview has been uploaded to your client portal for review.'
]

export function ComposeBox({
  activeChannelId,
  activeProvider,
  clientId,
  recipientIdentifier,
  onMessageSent
}: ComposeBoxProps) {
  const [body, setBody] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)

  const handleSend = async () => {
    if (!body.trim() || isSending) return

    setIsSending(true)

    try {
      const formData = new FormData()
      formData.set('channel_id', activeChannelId)
      formData.set('body', body.trim())
      if (clientId) formData.set('client_id', clientId)
      if (recipientIdentifier) formData.set('recipient_identifier', recipientIdentifier)

      const res = await sendOutboundMessageAction(formData)

      if (res.success && res.newMessage) {
        onMessageSent(res.newMessage as any)
        setBody('')
      } else if (res.error) {
        alert(res.error)
      }
    } catch (err: any) {
      alert(err.message || 'Failed to send message')
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSend()
    }
  }

  const getProviderBadge = (prov: string) => {
    switch (prov.toLowerCase()) {
      case 'slack':
        return { label: 'Reply via Slack', style: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' }
      case 'whatsapp':
        return { label: 'Reply via WhatsApp', style: 'bg-green-500/10 text-green-500 border-green-500/20' }
      case 'email':
        return { label: 'Reply via Email', style: 'bg-blue-500/10 text-blue-500 border-blue-500/20' }
      case 'upwork':
        return { label: 'Reply via Upwork', style: 'bg-amber-500/10 text-amber-500 border-amber-500/20' }
      default:
        return { label: `Reply via ${prov}`, style: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' }
    }
  }

  const badge = getProviderBadge(activeProvider)

  return (
    <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4 space-y-3">
      {/* Templates Row */}
      {showTemplates && (
        <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Quick Templates
            </span>
            <button
              type="button"
              onClick={() => setShowTemplates(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              Close
            </button>
          </div>
          <div className="space-y-1.5">
            {TEMPLATES.map((tmpl, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setBody(tmpl)
                  setShowTemplates(false)
                }}
                className="w-full text-left p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 hover:border-indigo-500 dark:hover:border-indigo-500 transition line-clamp-1"
              >
                {tmpl}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Compose Controls */}
      <div className="flex items-center justify-between">
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${badge.style}`}>
          <MessageSquare className="w-3 h-3" />
          {badge.label}
        </span>

        <button
          type="button"
          onClick={() => setShowTemplates(!showTemplates)}
          className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Templates
        </button>
      </div>

      <div className="relative">
        <textarea
          rows={3}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Type your reply... (Press ${typeof window !== 'undefined' && window.navigator.platform.includes('Mac') ? 'Cmd' : 'Ctrl'} + Enter to send)`}
          className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition resize-none"
        />
      </div>

      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Paperclip className="w-4 h-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer" />
          <span>Attachments supported</span>
        </div>

        <button
          type="button"
          onClick={handleSend}
          disabled={!body.trim() || isSending}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-semibold text-xs transition shadow-sm"
        >
          <Send className="w-3.5 h-3.5" />
          {isSending ? 'Sending...' : 'Send Message'}
        </button>
      </div>
    </div>
  )
}
