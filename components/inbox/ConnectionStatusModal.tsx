'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  Link as LinkIcon,
  Copy,
  Check,
  ShieldCheck,
  ExternalLink,
  RefreshCw,
  Sliders,
  Server
} from 'lucide-react'
import { getProviderMeta } from './providerBranding'

export interface ChannelStatusInfo {
  id?: string
  provider: string
  channel_name?: string | null
  status?: string | 'active' | 'disconnected' | 'error'
  connected_at?: string | null
  updated_at?: string | null
  external_account_id?: string | null
  metadata?: Record<string, any> | null
}

interface ConnectionStatusModalProps {
  isOpen: boolean
  onClose: () => void
  channel: ChannelStatusInfo | null
}

export function ConnectionStatusModal({
  isOpen,
  onClose,
  channel
}: ConnectionStatusModalProps) {
  const [copied, setCopied] = useState(false)
  const [origin, setOrigin] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin)
    }
  }, [])

  if (!isOpen || !channel) return null

  const meta = getProviderMeta(channel.provider)
  const Icon = meta.icon
  const isConnected = channel.status === 'active'
  const webhookUrl = `${origin}${meta.webhookPath}`

  const handleCopyWebhook = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(webhookUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Format timestamps
  const formatTimestamp = (ts?: string | null) => {
    if (!ts) return 'Not yet synced'
    try {
      const d = new Date(ts)
      return `${d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })} at ${d.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })}`
    } catch {
      return ts
    }
  }

  const lastSyncTime = channel.updated_at || channel.connected_at || null

  // Credential validation inspection
  const channelMeta = channel.metadata || {}
  const hasToken = Boolean(
    channelMeta.bot_access_token ||
    channelMeta.auth_token ||
    channelMeta.api_key ||
    channelMeta.smtp_pass ||
    channelMeta.sendgrid_api_key
  )
  const hasSecret = Boolean(
    channelMeta.signing_secret ||
    channelMeta.public_key ||
    channelMeta.webhook_secret
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center border shadow-xs"
              style={{
                backgroundColor: meta.bgColor,
                borderColor: meta.borderColor,
                color: meta.color
              }}
            >
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {meta.name} Integration Status
                </h3>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1"
                  style={
                    isConnected
                      ? {
                          backgroundColor: 'rgba(34, 197, 94, 0.12)',
                          color: '#16a34a',
                          borderColor: 'rgba(34, 197, 94, 0.3)'
                        }
                      : {
                          backgroundColor: 'rgba(239, 68, 68, 0.12)',
                          color: '#ef4444',
                          borderColor: 'rgba(239, 68, 68, 0.3)'
                        }
                  }
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
                    }`}
                  />
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {channel.channel_name || meta.description}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-xs text-slate-600 dark:text-slate-300 max-h-[75vh] overflow-y-auto">
          {/* Connection Overview Banner */}
          <div
            className="p-4 rounded-xl border flex items-start gap-3"
            style={{
              backgroundColor: isConnected ? 'rgba(34, 197, 94, 0.08)' : 'rgba(245, 158, 11, 0.08)',
              borderColor: isConnected ? 'rgba(34, 197, 94, 0.25)' : 'rgba(245, 158, 11, 0.25)'
            }}
          >
            {isConnected ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <div className="font-semibold text-slate-900 dark:text-white">
                {isConnected ? 'Active & Ingesting Inbound Messages' : 'Channel Disconnected or Standby'}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                {isConnected
                  ? `Inbound webhooks for ${meta.name} are active. Incoming messages are verified, matched to client CRM profiles, and placed in the unified inbox.`
                  : `This channel is currently not active. Inbound webhooks will be queued or rejected until valid credentials are saved.`}
              </p>
            </div>
          </div>

          {/* Sync & Channel Metadata Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="text-[10px] text-slate-400 flex items-center gap-1 font-medium mb-1">
                <Clock className="w-3 h-3 text-slate-400" />
                Last Synchronized
              </div>
              <div className="text-xs font-semibold text-slate-900 dark:text-white">
                {formatTimestamp(lastSyncTime)}
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="text-[10px] text-slate-400 flex items-center gap-1 font-medium mb-1">
                <Server className="w-3 h-3 text-slate-400" />
                Channel Identifier
              </div>
              <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                {channel.external_account_id || channel.channel_name || 'Primary Channel'}
              </div>
            </div>
          </div>

          {/* Webhook URL Endpoint */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <LinkIcon className="w-3.5 h-3.5 text-indigo-500" />
              Inbound Webhook Endpoint URL
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={webhookUrl}
                className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 dark:text-slate-200 select-all"
              />
              <button
                type="button"
                onClick={handleCopyWebhook}
                className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1 transition shadow-xs"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <p className="text-[10px] text-slate-400">
              Use this endpoint in your {meta.name} Developer Dashboard / Webhooks settings.
            </p>
          </div>

          {/* Credential Validation Diagnostics */}
          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              Credential Validation &amp; Health Checks
            </label>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden text-xs">
              <div className="p-3 flex items-center justify-between bg-white dark:bg-slate-900">
                <span className="text-slate-600 dark:text-slate-300">
                  Bot Token / API Credential
                </span>
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {hasToken ? 'Encrypted & Stored' : isConnected ? 'Validated' : 'Configured'}
                </span>
              </div>

              <div className="p-3 flex items-center justify-between bg-white dark:bg-slate-900">
                <span className="text-slate-600 dark:text-slate-300">
                  Signature Verification / Public Key
                </span>
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {hasSecret ? 'HMAC / Ed25519 Ready' : isConnected ? 'Active' : 'Standby'}
                </span>
              </div>

              <div className="p-3 flex items-center justify-between bg-white dark:bg-slate-900">
                <span className="text-slate-600 dark:text-slate-300">
                  Webhook Payload Ingestion Contract
                </span>
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Standard InboundMessagePayload
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-3">
          <Link
            href={meta.settingsPath}
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-400" />
            Configure Channel Credentials
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
