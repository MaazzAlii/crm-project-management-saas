'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Send,
  Trash2,
  Key,
  Briefcase,
  ShieldCheck,
  RefreshCw,
  FileText
} from 'lucide-react'
import {
  UpworkChannelConfig,
  saveUpworkIntegrationAction,
  disconnectUpworkIntegrationAction,
  testUpworkConnectionAction
} from './actions'

interface Props {
  initialChannel: UpworkChannelConfig | null
  appBaseUrl: string
}

export default function UpworkClientPage({ initialChannel, appBaseUrl }: Props) {
  const [channel, setChannel] = useState<UpworkChannelConfig | null>(initialChannel)
  const [isPending, startTransition] = useTransition()
  const [testing, setTesting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const webhookUrl = `${appBaseUrl}/api/webhooks/upwork`

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFeedback(null)
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const res = await saveUpworkIntegrationAction(formData)
      if (res.error) {
        setFeedback({ type: 'error', message: res.error })
      } else {
        setFeedback({ type: 'success', message: 'Upwork contract integration saved successfully!' })
        window.location.reload()
      }
    })
  }

  const handleDisconnect = () => {
    if (!channel?.id) return
    if (!confirm('Are you sure you want to disconnect Upwork? Webhook notifications will no longer be captured.')) return

    setFeedback(null)
    startTransition(async () => {
      const res = await disconnectUpworkIntegrationAction(channel.id!)
      if (res.error) {
        setFeedback({ type: 'error', message: res.error })
      } else {
        setFeedback({ type: 'success', message: 'Upwork channel disconnected.' })
        setChannel((prev) => (prev ? { ...prev, status: 'disconnected' } : null))
      }
    })
  }

  const handleTest = async () => {
    if (!channel?.id) {
      setFeedback({ type: 'error', message: 'Please save your Upwork contract configuration first.' })
      return
    }
    setTesting(true)
    setFeedback(null)
    try {
      const res = await testUpworkConnectionAction(channel.id)
      if (res.error) {
        setFeedback({ type: 'error', message: res.error })
      } else {
        setFeedback({ type: 'success', message: res.message || 'Upwork contract message logged successfully!' })
      }
    } finally {
      setTesting(false)
    }
  }

  const isConnected = channel?.status === 'active'

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/settings/integrations"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Integrations
        </Link>

        <div className="flex items-center gap-2">
          {isConnected ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Connected
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-semibold">
              <AlertCircle className="h-3.5 w-3.5" />
              Not Connected
            </span>
          )}
        </div>
      </div>

      {/* Main Header Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl flex items-start gap-5">
        <div className="h-14 w-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-emerald-400 shadow-md">
          <Briefcase className="h-7 w-7 text-emerald-400" />
        </div>
        <div className="space-y-1">
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            Upwork Direct Contracts Integration
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
            Sync buyer messages and contract proposal updates from Upwork into your Unified Inbox, or log contract updates manually.
          </p>
        </div>
      </div>

      {/* Feedback Alert Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border text-xs font-medium flex items-center gap-3 ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Webhook Endpoint Box */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            Upwork Webhook Endpoint
          </h3>
          <span className="text-[11px] text-slate-500">Post contract updates or Zapier / n8n triggers</span>
        </div>
        <p className="text-xs text-slate-400">
          Use this HTTP POST endpoint for webhooks or automated contract message forwarders.
        </p>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="text"
            readOnly
            value={webhookUrl}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 font-mono focus:outline-none select-all"
          />
          <button
            type="button"
            onClick={handleCopyWebhook}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all shrink-0"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" /> Copied!
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" /> Copy URL
              </>
            )}
          </button>
        </div>
      </div>

      {/* Configuration Form */}
      <form onSubmit={handleSave} className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 space-y-6 shadow-xl">
        <div className="border-b border-slate-800 pb-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Key className="h-4 w-4 text-emerald-400" />
            Contract Credentials &amp; Room Details
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            API Keys are encrypted at rest using AES-256-GCM.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Display Label */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-slate-400" />
              Channel Display Name
            </label>
            <input
              type="text"
              name="channel_name"
              defaultValue={channel?.channel_name || 'Upwork Direct Contracts'}
              placeholder="e.g. Upwork Enterprise Client"
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
            />
            <p className="text-[11px] text-slate-500">Label displayed inside the unified inbox.</p>
          </div>

          {/* Contract ID */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-slate-400" />
              Upwork Contract / Room ID
            </label>
            <input
              type="text"
              name="external_account_id"
              defaultValue={channel?.external_account_id || ''}
              placeholder="e.g. ~0123456789abcdef"
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
            />
            <p className="text-[11px] text-slate-500">Found in Upwork contract URL or room details.</p>
          </div>

          {/* Optional API Key */}
          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-semibold text-slate-300">
              Upwork OAuth API Key (Optional)
            </label>
            <input
              type="password"
              name="api_key"
              placeholder={channel?.api_key_masked ? `Current: ${channel.api_key_masked}` : 'Upwork API OAuth Key...'}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
            />
            <p className="text-[11px] text-slate-500">
              {channel?.api_key_masked ? 'Leave blank to keep existing encrypted API key.' : 'Leave blank if using manual logging or webhook forwarders.'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors disabled:opacity-50 shadow-lg shadow-emerald-600/20"
            >
              {isPending ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Saving...
                </>
              ) : (
                'Save Upwork Integration'
              )}
            </button>

            {isConnected && (
              <button
                type="button"
                onClick={handleTest}
                disabled={testing}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-colors disabled:opacity-50"
              >
                {testing ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Log Test Message...
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5 text-emerald-400" /> Log Test Signal
                  </>
                )}
              </button>
            )}
          </div>

          {isConnected && channel?.id && (
            <button
              type="button"
              onClick={handleDisconnect}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold border border-rose-500/20 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" /> Disconnect Integration
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
