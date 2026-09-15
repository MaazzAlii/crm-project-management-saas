'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateClientAction } from '@/app/(dashboard)/clients/actions'
import { ClientRecord } from '@/components/clients/ClientsList'
import {
  X,
  Building2,
  Mail,
  Phone,
  Globe,
  DollarSign,
  Calendar,
  MessageSquare,
  Zap,
  Loader2,
  AlertCircle,
  Save,
} from 'lucide-react'

interface ClientEditModalProps {
  client: ClientRecord
  isOpen: boolean
  onClose: () => void
}

export function ClientEditModal({ client, isOpen, onClose }: ClientEditModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [commMode, setCommMode] = useState<'manual' | 'connected'>(
    client.communication_mode === 'connected' ? 'connected' : 'manual'
  )

  if (!isOpen) return null

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    formData.set('communication_mode', commMode)

    const res = await updateClientAction(client.id, formData)

    if (res.error) {
      setError(res.error)
      setLoading(false)
      return
    }

    setLoading(false)
    onClose()
    router.refresh()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-bold text-white">Edit Client Profile</h2>
            <p className="text-xs text-slate-400">Update company info, payment terms, or communication mode.</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 max-h-[75vh] overflow-y-auto pr-1">
          {/* Basic Identity */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Basic Identity</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Client Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  defaultValue={client.name}
                  required
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Company Name</label>
                <input
                  type="text"
                  name="company"
                  defaultValue={client.company || ''}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  name="email"
                  defaultValue={client.email || ''}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Phone Number</label>
                <input
                  type="text"
                  name="phone"
                  defaultValue={client.phone || ''}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
            </div>
          </div>

          {/* Communication Mode */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Communication Mode</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setCommMode('manual')}
                className={`p-3.5 rounded-xl border text-left transition flex items-start gap-3 ${
                  commMode === 'manual'
                    ? 'border-sky-500 bg-sky-500/10 text-white'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="p-2 rounded-lg bg-slate-800/80 text-sky-400">
                  <MessageSquare className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">Manual Mode</div>
                  <div className="text-xs text-slate-400 mt-0.5">Log conversations manually.</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setCommMode('connected')}
                className={`p-3.5 rounded-xl border text-left transition flex items-start gap-3 ${
                  commMode === 'connected'
                    ? 'border-emerald-500 bg-emerald-500/10 text-white'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                  <Zap className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white flex items-center gap-1.5">
                    <span>Connected Hub</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.5 rounded">Auto Sync</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">Syncs directly from linked channels.</div>
                </div>
              </button>
            </div>
          </div>

          {/* Platform & Terms */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Region & Financials</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Primary Platform</label>
                <select
                  name="platform"
                  defaultValue={client.platform || 'WhatsApp'}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-white focus:border-sky-500 focus:outline-none"
                >
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Slack">Slack</option>
                  <option value="Email">Email</option>
                  <option value="Telegram">Telegram</option>
                  <option value="Portal">Client Portal</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Country</label>
                <input
                  type="text"
                  name="country"
                  defaultValue={client.country || ''}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Currency</label>
                <select
                  name="currency"
                  defaultValue={client.currency || 'USD'}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-white focus:border-sky-500 focus:outline-none"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="CAD">CAD ($)</option>
                  <option value="AUD">AUD ($)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Payment Schedule</label>
                <select
                  name="payment_schedule"
                  defaultValue={client.payment_schedule || 'Per Project'}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-white focus:border-sky-500 focus:outline-none"
                >
                  <option value="Per Project">Per Project</option>
                  <option value="Monthly Retainer">Monthly Retainer</option>
                  <option value="NET30">NET30</option>
                  <option value="NET60">NET60</option>
                  <option value="Milestone Based">Milestone Based</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Status</label>
                <select
                  name="status"
                  defaultValue={client.status || 'active'}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-white focus:border-sky-500 focus:outline-none"
                >
                  <option value="active">Active</option>
                  <option value="lead">Lead</option>
                  <option value="churned">Churned</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-800 px-4 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-xl bg-sky-500 px-4 py-2 text-xs font-bold text-white hover:bg-sky-400 transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
