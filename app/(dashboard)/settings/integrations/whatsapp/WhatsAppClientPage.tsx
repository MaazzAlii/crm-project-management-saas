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
  Phone,
  ShieldCheck,
  RefreshCw,
  MessageCircle
} from 'lucide-react'
import {
  WhatsAppChannelConfig,
  saveWhatsAppIntegrationAction,
  disconnectWhatsAppIntegrationAction,
  testWhatsAppConnectionAction
} from './actions'

interface Props {
  initialChannel: WhatsAppChannelConfig | null
  appBaseUrl: string
}

export default function WhatsAppClientPage({ initialChannel, appBaseUrl }: Props) {
  const [channel, setChannel] = useState<WhatsAppChannelConfig | null>(initialChannel)
  const [isPending, startTransition] = useTransition()
  const [testing, setTesting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [testNumber, setTestNumber] = useState('')
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const webhookUrl = `${appBaseUrl}/api/webhooks/whatsapp`

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
      const res = await saveWhatsAppIntegrationAction(formData)
      if (res.error) {
        setFeedback({ type: 'error', message: res.error })
      } else {
        setFeedback({ type: 'success', message: 'WhatsApp Business integration saved successfully!' })
        window.location.reload()
      }
    })
  }

  const handleDisconnect = () => {
    if (!channel?.id) return
    if (!confirm('Are you sure you want to disconnect WhatsApp? Inbound webhooks will no longer be processed.')) return

    setFeedback(null)
    startTransition(async () => {
      const res = await disconnectWhatsAppIntegrationAction(channel.id!)
      if (res.error) {
        setFeedback({ type: 'error', message: res.error })
      } else {
        setFeedback({ type: 'success', message: 'WhatsApp channel disconnected.' })
        setChannel((prev) => (prev ? { ...prev, status: 'disconnected' } : null))
      }
    })
  }

  const handleTest = async () => {
    if (!channel?.id) {
      setFeedback({ type: 'error', message: 'Please save your WhatsApp channel configuration first.' })
      return
    }
    setTesting(true)
    setFeedback(null)
    try {
      const res = await testWhatsAppConnectionAction(channel.id, testNumber || undefined)
      if (res.error) {
        setFeedback({ type: 'error', message: res.error })
      } else {
        setFeedback({ type: 'success', message: res.message || 'WhatsApp test message dispatched successfully!' })
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
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold"> {/* intentional: connected status badge */}
              <CheckCircle2 className="h-3.5 w-3.5" />
              Connected
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-semibold"> {/* intentional: disconnected status badge */}
              <AlertCircle className="h-3.5 w-3.5" />
              Not Connected
            </span>
          )}
        </div>
      </div>

      {/* Main Title Card */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm flex items-start gap-5">
        <div className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-primary shadow-sm">
          <MessageCircle className="h-7 w-7" />
        </div>
        <div className="space-y-1">
          <h1 className="text-xl font-extrabold text-card-foreground flex items-center gap-2">
            WhatsApp Business API Integration
          </h1>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
            Connect your Twilio WhatsApp Business number to receive incoming client messages and send direct replies directly inside your Unified Inbox.
          </p>
        </div>
      </div>

      {/* Feedback Alert Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border text-xs font-medium flex items-center gap-3 ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' /* intentional: feedback success alert */
              : 'bg-destructive/10 border-destructive/20 text-destructive'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" /> /* intentional: success icon */
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Webhook Endpoint Box */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-card-foreground uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            WhatsApp Webhook URL (Twilio Sandbox / Messaging Service)
          </h3>
          <span className="text-[11px] text-muted-foreground">Paste in Twilio Console &gt; Webhook Configuration</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Set this HTTP endpoint as your HTTP POST webhook for incoming WhatsApp messages in Twilio Console or Meta Cloud API.
        </p>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="text"
            readOnly
            value={webhookUrl}
            className="flex-1 bg-background border border-input rounded-xl px-4 py-2.5 text-xs text-foreground font-mono focus:border-ring focus:outline-none select-all"
          />
          <button
            type="button"
            onClick={handleCopyWebhook}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-border bg-muted/60 hover:bg-muted text-foreground text-xs font-semibold transition-all shrink-0"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" /> Copied! {/* intentional: copied success indicator */}
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
      <form onSubmit={handleSave} className="rounded-2xl border border-border bg-card p-6 space-y-6 shadow-sm">
        <div className="border-b border-border pb-4">
          <h3 className="text-sm font-bold text-card-foreground flex items-center gap-2">
            <Key className="h-4 w-4 text-primary" />
            Twilio API Credentials &amp; Number
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Credentials are encrypted at rest with AES-256-GCM.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Channel Display Label */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              Channel Display Name
            </label>
            <input
              type="text"
              name="channel_name"
              defaultValue={channel?.channel_name || 'WhatsApp Business (+1 555-019-2831)'}
              placeholder="e.g. Agency Support WhatsApp"
              required
              className="w-full bg-background border border-input rounded-xl px-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring"
            />
            <p className="text-[11px] text-muted-foreground">Display label inside the unified inbox.</p>
          </div>

          {/* WhatsApp Phone Number */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-muted-foreground" />
              WhatsApp Sender Phone Number (E.164)
            </label>
            <input
              type="text"
              name="external_account_id"
              defaultValue={channel?.external_account_id || ''}
              placeholder="e.g. +15550192831"
              required
              className="w-full bg-background border border-input rounded-xl px-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring font-mono"
            />
            <p className="text-[11px] text-muted-foreground">Twilio WhatsApp enabled number with country code.</p>
          </div>

          {/* Twilio Account SID */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground">
              Twilio Account SID (`AC...`)
            </label>
            <input
              type="password"
              name="account_sid"
              placeholder={channel?.account_sid_masked ? `Current: ${channel.account_sid_masked}` : 'AC1234567890abcdef...'}
              className="w-full bg-background border border-input rounded-xl px-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring font-mono"
            />
            <p className="text-[11px] text-muted-foreground">
              {channel?.account_sid_masked ? 'Leave blank to keep existing encrypted Account SID.' : 'Twilio Console > Account Info > Account SID'}
            </p>
          </div>

          {/* Twilio Auth Token */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground">
              Twilio Auth Token
            </label>
            <input
              type="password"
              name="auth_token"
              placeholder={channel?.auth_token_masked ? `Current: ${channel.auth_token_masked}` : '32-character Auth Token'}
              className="w-full bg-background border border-input rounded-xl px-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring font-mono"
            />
            <p className="text-[11px] text-muted-foreground">
              {channel?.auth_token_masked ? 'Leave blank to keep existing encrypted Auth Token.' : 'Twilio Console > Account Info > Auth Token'}
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
                'Save WhatsApp Integration'
              )}
            </button>

            {isConnected && (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Test recipient phone (+1555...)"
                  value={testNumber}
                  onChange={(e) => setTestNumber(e.target.value)}
                  className="bg-background border border-input rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring font-mono w-48"
                />
                <button
                  type="button"
                  onClick={handleTest}
                  disabled={testing}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-muted/60 hover:bg-muted text-foreground font-semibold text-xs transition-colors disabled:opacity-50"
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
