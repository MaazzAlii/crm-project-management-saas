'use client'

import { useState } from 'react'
import { ClientRecord } from '@/components/clients/ClientsList'
import { updateClientNotesAction } from '@/app/(dashboard)/clients/actions'
import { CommunicationModeSwitchModal } from './CommunicationModeSwitchModal'
import {
  Building2,
  Mail,
  Phone,
  Globe,
  DollarSign,
  MessageSquare,
  Zap,
  Save,
  CheckCircle2,
  Loader2,
  FileText,
  Lock,
} from 'lucide-react'

interface ClientOverviewTabProps {
  client: ClientRecord
}

export function ClientOverviewTab({ client }: ClientOverviewTabProps) {
  const [notes, setNotes] = useState(client.notes || '')
  const [savingNotes, setSavingNotes] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [currentMode, setCurrentMode] = useState(client.communication_mode || 'manual')
  const [isSwitchModalOpen, setIsSwitchModalOpen] = useState(false)

  async function handleSaveNotes() {
    setSavingNotes(true)
    setSaveSuccess(false)

    await updateClientNotesAction(client.id, notes)

    setSavingNotes(false)
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 3000)
  }

  const isConnected = currentMode === 'connected'

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Metadata Cards Grid (2 cols) */}
      <div className="lg:col-span-2 space-y-6">
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-6 space-y-6">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Client Specifications</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                <Building2 className="h-4 w-4 text-sky-400" />
                <span>Company / Org</span>
              </div>
              <div className="text-sm font-bold text-white">{client.company || 'Not Specified'}</div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                <Mail className="h-4 w-4 text-sky-400" />
                <span>Contact Email</span>
              </div>
              <div className="text-sm font-bold text-white truncate">{client.email || 'Not Specified'}</div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                <Phone className="h-4 w-4 text-sky-400" />
                <span>Phone Number</span>
              </div>
              <div className="text-sm font-bold text-white">{client.phone || 'Not Specified'}</div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                <Globe className="h-4 w-4 text-sky-400" />
                <span>Country / Region</span>
              </div>
              <div className="text-sm font-bold text-white">{client.country || 'Not Specified'}</div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                <DollarSign className="h-4 w-4 text-emerald-400" />
                <span>Currency &amp; Payment Schedule</span>
              </div>
              <div className="text-sm font-bold text-white">
                {client.currency || 'USD'} — {client.payment_schedule || 'Per Project'}
              </div>
            </div>

            {/* Communication Mode Specification Card */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                    {isConnected ? (
                      <Zap className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <MessageSquare className="h-4 w-4 text-sky-400" />
                    )}
                    <span>Communication Mode</span>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      isConnected
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-sky-400'
                      }`}
                    />
                    {isConnected ? 'Connected Hub' : 'Manual Mode'}
                  </span>
                </div>

                <div className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  {isConnected ? (
                    <span className="text-slate-300">
                      Inbound &amp; outbound messages across WhatsApp, Slack, Email, Discord, and Upwork are automatically synced to the Unified Inbox.
                    </span>
                  ) : (
                    <span>
                      Logging by hand. Inbound channel messages are not automatically attributed to this client profile.
                    </span>
                  )}
                </div>
              </div>

              {/* Mode Action Button / Status Lock */}
              <div className="pt-2">
                {!isConnected ? (
                  <button
                    type="button"
                    onClick={() => setIsSwitchModalOpen(true)}
                    className="inline-flex items-center justify-center gap-1.5 w-full px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    <Zap className="h-3.5 w-3.5" />
                    <span>Switch to Connected Mode</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
                    <Lock className="h-3.5 w-3.5 shrink-0" />
                    <span>Connected Mode Active (Permanent)</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Editable Notes Section */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-sky-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Internal Notes &amp; Context</h2>
            </div>
            {saveSuccess && (
              <span className="flex items-center gap-1 text-xs text-emerald-400 font-semibold animate-in fade-in">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Saved successfully</span>
              </span>
            )}
          </div>

          <textarea
            rows={5}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add internal client notes, preferences, meeting context, or contract details..."
            className="w-full rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-200 placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 leading-relaxed"
          />

          <div className="flex justify-end">
            <button
              onClick={handleSaveNotes}
              disabled={savingNotes}
              className="inline-flex items-center gap-1.5 rounded-xl bg-sky-500 px-4 py-2 text-xs font-bold text-white hover:bg-sky-400 transition disabled:opacity-50"
            >
              {savingNotes ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save Notes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Side Column Quick Info */}
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-6 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Record Summary</h2>
          
          <div className="space-y-3 text-xs text-slate-400">
            <div className="flex justify-between py-2 border-b border-slate-800/60">
              <span>Primary Platform</span>
              <span className="font-semibold text-white">{client.platform}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800/60">
              <span>Client Status</span>
              <span className="font-semibold text-white capitalize">{client.status}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800/60">
              <span>Created Date</span>
              <span className="font-semibold text-white">
                {new Date(client.created_at).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span>Last Modified</span>
              <span className="font-semibold text-white">
                {new Date(client.updated_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Switch Mode Confirmation Dialog */}
      <CommunicationModeSwitchModal
        isOpen={isSwitchModalOpen}
        onClose={() => setIsSwitchModalOpen(false)}
        clientId={client.id}
        clientName={client.name}
        clientEmail={client.email}
        clientPhone={client.phone}
        onSuccess={() => setCurrentMode('connected')}
      />
    </div>
  )
}
