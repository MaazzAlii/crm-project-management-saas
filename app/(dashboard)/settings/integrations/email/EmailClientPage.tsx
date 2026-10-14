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
  Mail,
  ShieldCheck,
  RefreshCw,
  AtSign,
  Inbox
} from 'lucide-react'
import {
  EmailChannelConfig,
  saveEmailIntegrationAction,
  disconnectEmailIntegrationAction,
  testEmailConnectionAction
} from './actions'

interface Props {
  initialChannel: EmailChannelConfig | null
  appBaseUrl: string
}

export default function EmailClientPage({ initialChannel, appBaseUrl }: Props) {
  const [channel, setChannel] = useState<EmailChannelConfig | null>(initialChannel)
  const [isPending, startTransition] = useTransition()
  const [testing, setTesting] = useState(false)
  const [copiedWebhook, setCopiedWebhook] = useState(false)
  const [copiedAddress, setCopiedAddress] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const webhookUrl = `${appBaseUrl}/api/webhooks/email`
  const inboundAddress = channel?.inbound_email_address || 'inbox-org@inbound.crm-platform.com'

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl)
    setCopiedWebhook(true)
    setTimeout(() => setCopiedWebhook(false), 2000)
  }

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(inboundAddress)
    setCopiedAddress(true)
    setTimeout(() => setCopiedAddress(false), 2000)
  }

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFeedback(null)
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const res = await saveEmailIntegrationAction(formData)
      if (res.error) {
        setFeedback({ type: 'error', message: res.error })
      } else {
        setFeedback({ type: 'success', message: 'Email channel integration saved successfully!' })
        window.location.reload()
      }
    })
  }

  const handleDisconnect = () => {
    if (!channel?.id) return
    if (!confirm('Are you sure you want to disconnect Email? Inbound parse emails will no longer be captured.')) return

    setFeedback(null)
    startTransition(async () => {
      const res = await disconnectEmailIntegrationAction(channel.id!)
      if (res.error) {
        setFeedback({ type: 'error', message: res.error })
      } else {
        setFeedback({ type: 'success', message: 'Email channel disconnected.' })
        setChannel((prev) => (prev ? { ...prev, status: 'disconnected' } : null))
      }
    })
  }

  const handleTest = async () => {
    if (!channel?.id) {
      setFeedback({ type: 'error', message: 'Please save your email channel configuration first.' })
      return
    }
    setTesting(true)
    setFeedback(null)
    try {
      const res = await testEmailConnectionAction(channel.id, testEmail || undefined)
      if (res.error) {
        setFeedback({ type: 'error', message: res.error })
      } else {
        setFeedback({ type: 'success', message: res.message || 'Test email signal dispatched successfully!' })
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
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Integrations
        </Link>

        <div className="flex items-center gap-2">
          {isConnected ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold"> {/* // intentional: status color for active connection */}
              <CheckCircle2 className="h-3.5 w-3.5" />
              Connected
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-semibold"> {/* // intentional: status color for disconnected warning */}
              <AlertCircle className="h-3.5 w-3.5" />
              Not Connected
            </span>
          )}
        </div>
      </div>

      {/* Main Header Card */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm flex items-start gap-5">
        <div className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-primary shadow-xs">
          <Mail className="h-7 w-7 text-primary" />
        </div>
        <div className="space-y-1">
          <h1 className="text-xl font-extrabold text-card-foreground flex items-center gap-2">
            Email Channel &amp; Inbound Parse Integration
          </h1>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
            Connect your agency support email or SendGrid Inbound Parse address to capture client email threads and send direct email replies right from your Unified Inbox.
          </p>
        </div>
      </div>

      {/* Feedback Alert Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border text-xs font-medium flex items-center gap-3 ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 dark:text-emerald-300' // intentional: success alert banner
              : 'bg-destructive/10 border-destructive/20 text-destructive'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" /> // intentional: success alert icon
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Dedicated Inbound Email Address & Webhook URL Box */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Inbound Parse Webhook URL */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Inbound Parse Webhook Endpoint
            </h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Set in SendGrid / Postmark / n8n HTTP POST settings.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              readOnly
              value={webhookUrl}
              className="flex-1 bg-background border border-input rounded-xl px-3 py-2 text-xs text-foreground font-mono focus:outline-none select-all"
            />
            <button
              type="button"
              onClick={handleCopyWebhook}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-muted/60 hover:bg-muted text-foreground text-xs font-semibold border border-border shrink-0"
            >
              {copiedWebhook ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />} {/* // intentional: copy feedback icon */}
            </button>
          </div>
        </div>

        {/* Dedicated Forwarding Address */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Inbox className="h-4 w-4 text-primary" />
              Dedicated Inbound Address
            </h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Forward emails from Gmail / Outlook to this endpoint.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              readOnly
              value={inboundAddress}
              className="flex-1 bg-background border border-input rounded-xl px-3 py-2 text-xs text-foreground font-mono focus:outline-none select-all"
            />
            <button
              type="button"
              onClick={handleCopyAddress}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-muted/60 hover:bg-muted text-foreground text-xs font-semibold border border-border shrink-0"
            >
              {copiedAddress ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />} {/* // intentional: copy feedback icon */}
            </button>
          </div>
        </div>
      </div>

      {/* Email Configuration Form */}
      <form onSubmit={handleSave} className="rounded-2xl border border-border bg-card p-6 space-y-6 shadow-sm">
        <div className="border-b border-border pb-4">
          <h3 className="text-sm font-bold text-card-foreground flex items-center gap-2">
            <Key className="h-4 w-4 text-primary" />
            Support Email &amp; SendGrid API Credentials
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            API Keys and secrets are encrypted at rest with AES-256-GCM.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Display Label */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground">
              Channel Display Name
            </label>
            <input
              type="text"
              name="channel_name"
              defaultValue={channel?.channel_name || 'Support Email (support@agency.com)'}
              placeholder="e.g. Agency Support Email"
              required
              className="w-full bg-background border border-input rounded-xl px-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring"
            />
            <p className="text-[11px] text-muted-foreground">Display label inside the unified inbox.</p>
          </div>

          {/* Support Email Address */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <AtSign className="h-3.5 w-3.5 text-primary" />
              Support / Sender Email Address
            </label>
            <input
              type="email"
              name="external_account_id"
              defaultValue={channel?.external_account_id || ''}
              placeholder="e.g. support@agency.com"
              required
              className="w-full bg-background border border-input rounded-xl px-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring font-mono"
            />
            <p className="text-[11px] text-muted-foreground">Sender email address displayed on outbound emails.</p>
          </div>

          {/* SendGrid API Key */}
          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-semibold text-foreground">
              SendGrid API Key (`SG...`)
            </label>
            <input
              type="password"
              name="sendgrid_api_key"
              placeholder={channel?.sendgrid_api_key_masked ? `Current: ${channel.sendgrid_api_key_masked}` : 'SG.xxxxxxxxxxxxxxxx...'}
              className="w-full bg-background border border-input rounded-xl px-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring font-mono"
            />
            <p className="text-[11px] text-muted-foreground">
              {channel?.sendgrid_api_key_masked ? 'Leave blank to keep existing encrypted API key.' : 'SendGrid Console > Settings > API Keys (Full Access or Mail Send)'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="pt-4 border-t border-border flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs transition-colors disabled:opacity-50 shadow-sm"
            >
              {isPending ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Saving...
                </>
              ) : (
                'Save Email Integration'
              )}
            </button>

            {isConnected && (
              <div className="flex items-center gap-2">
                <input
                  type="email"
                  placeholder="Test recipient (test@domain.com)"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="bg-background border border-input rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring font-mono w-52"
                />
                <button
                  type="button"
                  onClick={handleTest}
                  disabled={testing}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-muted/60 hover:bg-muted text-foreground font-semibold text-xs border border-border transition-colors disabled:opacity-50"
                >
                  {testing ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Testing...
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5 text-primary" /> Send Test Signal
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {isConnected && channel?.id && (
            <button
              type="button"
              onClick={handleDisconnect}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-destructive/10 hover:bg-destructive/20 text-destructive text-xs font-semibold border border-destructive/20 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" /> Disconnect Integration
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
