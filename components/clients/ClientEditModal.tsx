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

import { TagSelect } from '@/components/clients/TagSelect'

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
  const [tags, setTags] = useState<string[]>(client.tags || [])

  if (!isOpen) return null

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    formData.set('communication_mode', commMode)
    formData.set('tags', JSON.stringify(tags))

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">Edit Client Profile</h2>
            <p className="text-xs text-muted-foreground">Update company info, payment terms, or communication mode.</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 max-h-[75vh] overflow-y-auto pr-1">
          {/* Basic Identity */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Basic Identity</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Client Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  defaultValue={client.name}
                  required
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-foreground placeholder:text-placeholder focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Company Name</label>
                <input
                  type="text"
                  name="company"
                  defaultValue={client.company || ''}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-foreground placeholder:text-placeholder focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Email Address</label>
                <input
                  type="email"
                  name="email"
                  defaultValue={client.email || ''}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-foreground placeholder:text-placeholder focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Phone Number</label>
                <input
                  type="text"
                  name="phone"
                  defaultValue={client.phone || ''}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-foreground placeholder:text-placeholder focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Communication Mode */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Communication Mode</h3>
              {client.communication_mode === 'connected' && (
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                  Permanent Mode
                </span>
              )}
            </div>

            {client.communication_mode === 'connected' && (
              <p className="text-[11px] text-amber-700 dark:text-amber-400/90 bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5 leading-relaxed">
                This client is in Connected Mode. Reverting to manual mode is blocked to preserve synced message threads and audit integrity.
              </p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                type="button"
                disabled={client.communication_mode === 'connected'}
                onClick={() => setCommMode('manual')}
                className={`p-3.5 rounded-xl border text-left transition flex items-start gap-3 ${
                  client.communication_mode === 'connected'
                    ? 'opacity-40 cursor-not-allowed border-border bg-muted/30'
                    : commMode === 'manual'
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'border-border bg-card/60 text-muted-foreground hover:border-primary/50'
                }`}
              >
                <div className="p-2 rounded-lg bg-muted text-primary">
                  <MessageSquare className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">Manual Mode</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {client.communication_mode === 'connected' ? 'Locked (Cannot revert)' : 'Log conversations manually.'}
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setCommMode('connected')}
                className={`p-3.5 rounded-xl border text-left transition flex items-start gap-3 ${
                  commMode === 'connected'
                    ? 'border-emerald-500 bg-emerald-500/10 text-foreground'
                    : 'border-border bg-card/60 text-muted-foreground hover:border-emerald-500/50'
                }`}
              >
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                  <Zap className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <span>Connected Hub</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold px-1.5 py-0.5 rounded">Auto Sync</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">Syncs directly from linked channels.</div>
                </div>
              </button>
            </div>
          </div>

          {/* Platform & Terms */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Region & Financials</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Primary Platform</label>
                <select
                  name="platform"
                  defaultValue={client.platform || 'WhatsApp'}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Slack">Slack</option>
                  <option value="Email">Email</option>
                  <option value="Telegram">Telegram</option>
                  <option value="Portal">Client Portal</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Country</label>
                <input
                  type="text"
                  name="country"
                  defaultValue={client.country || ''}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-foreground placeholder:text-placeholder focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Currency</label>
                <select
                  name="currency"
                  defaultValue={client.currency || 'USD'}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="CAD">CAD ($)</option>
                  <option value="AUD">AUD ($)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Payment Schedule</label>
                <select
                  name="payment_schedule"
                  defaultValue={client.payment_schedule || 'Per Project'}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="Per Project">Per Project</option>
                  <option value="Monthly Retainer">Monthly Retainer</option>
                  <option value="NET30">NET30</option>
                  <option value="NET60">NET60</option>
                  <option value="Milestone Based">Milestone Based</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Status</label>
                <select
                  name="status"
                  defaultValue={client.status || 'active'}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="active">Active</option>
                  <option value="lead">Lead</option>
                  <option value="churned">Churned</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tags & Categorization */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tags & Categorization</h3>
            <TagSelect selectedTags={tags} onChange={setTags} />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-accent hover:text-foreground transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50"
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
