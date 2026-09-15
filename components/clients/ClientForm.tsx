'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClientAction } from '@/app/(dashboard)/clients/actions'
import { TagSelect } from './TagSelect'
import { Pencil, Zap, ArrowLeft, Loader2, AlertCircle, CheckCircle2, Tag as TagIcon } from 'lucide-react'

export interface ClientFormValues {
  name: string
  company: string
  email: string
  phone: string
  platform: string
  country: string
  currency: string
  payment_schedule: string
  status: string
  communication_mode: 'manual' | 'connected'
  notes: string
  tags: string[]
}

export function ClientForm() {
  const router = useRouter()

  const [formData, setFormData] = useState<ClientFormValues>({
    name: '',
    company: '',
    email: '',
    phone: '',
    platform: 'WhatsApp',
    country: '',
    currency: 'USD',
    payment_schedule: 'Per Project',
    status: 'active',
    communication_mode: 'manual',
    notes: '',
    tags: [],
  })

  const [errors, setErrors] = useState<Partial<Record<keyof ClientFormValues, string>>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof ClientFormValues, string>> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Client name is required'
    }

    if (formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = 'Please enter a valid email address'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name as keyof ClientFormValues]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setServerError(null)

    if (!validate()) {
      return
    }

    setIsSubmitting(true)

    try {
      const payload = new FormData()
      Object.entries(formData).forEach(([key, val]) => {
        if (key === 'tags') {
          payload.append('tags', JSON.stringify(val))
        } else {
          payload.append(key, val as string)
        }
      })

      const res = await createClientAction(payload)

      if (res?.error) {
        setServerError(res.error)
        setIsSubmitting(false)
        return
      }

      if (res?.success) {
        router.push('/clients')
        router.refresh()
      }
    } catch (err: any) {
      setServerError(err.message || 'An unexpected error occurred while saving client.')
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Top Banner Error if any */}
      {serverError && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-white mb-0.5">Failed to create client</p>
            <p className="text-red-300/90 text-xs leading-relaxed">{serverError}</p>
          </div>
        </div>
      )}

      {/* Section 1: Basic Client Identity */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider text-sky-400 flex items-center gap-2">
          Basic Identity
        </h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Name Field */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Client Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. John Doe or Acme Corp"
              className={`w-full rounded-xl border bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition ${
                errors.name
                  ? 'border-red-500 focus:border-red-500 ring-1 ring-red-500'
                  : 'border-slate-800 focus:border-sky-500'
              }`}
            />
            {errors.name && <p className="mt-1 text-[11px] text-red-400">{errors.name}</p>}
          </div>

          {/* Company Field */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Company Name</label>
            <input
              type="text"
              name="company"
              value={formData.company}
              onChange={handleChange}
              placeholder="e.g. Acme Innovations LLC"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none transition"
            />
          </div>

          {/* Email Field */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="e.g. client@example.com"
              className={`w-full rounded-xl border bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition ${
                errors.email
                  ? 'border-red-500 focus:border-red-500 ring-1 ring-red-500'
                  : 'border-slate-800 focus:border-sky-500'
              }`}
            />
            {errors.email && <p className="mt-1 text-[11px] text-red-400">{errors.email}</p>}
          </div>

          {/* Phone Field */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Phone Number</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="e.g. +1 (555) 000-1234"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none transition"
            />
          </div>
        </div>
      </div>

      {/* Section 2: V2 Communication Mode Selector (CRITICAL REQUIREMENT) */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider text-sky-400 flex items-center gap-2">
            Communication Mode
          </h3>
          <span className="rounded-full bg-sky-500/10 border border-sky-500/20 px-2.5 py-0.5 text-[10px] font-bold text-sky-400">
            V2 Feature
          </span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Select how communication logs and messages will be synced for this client across your agency workspace.
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Radio Option 1: Manual */}
          <label
            onClick={() => setFormData((prev) => ({ ...prev, communication_mode: 'manual' }))}
            className={`relative flex cursor-pointer rounded-2xl border p-4 transition-all ${
              formData.communication_mode === 'manual'
                ? 'border-sky-500 bg-sky-500/10 shadow-lg shadow-sky-500/10'
                : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
            }`}
          >
            <input
              type="radio"
              name="communication_mode"
              value="manual"
              checked={formData.communication_mode === 'manual'}
              onChange={() => {}}
              className="sr-only"
            />
            <div className="flex gap-3">
              <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                formData.communication_mode === 'manual'
                  ? 'bg-sky-500 text-white shadow-md'
                  : 'bg-slate-800 text-slate-400'
              }`}>
                <Pencil className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white">Manual Mode</span>
                  {formData.communication_mode === 'manual' && (
                    <CheckCircle2 className="h-4 w-4 text-sky-400" />
                  )}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Team logs conversations by hand. Best for legacy/existing clients and off-platform communications.
                </p>
              </div>
            </div>
          </label>

          {/* Radio Option 2: Connected */}
          <label
            onClick={() => setFormData((prev) => ({ ...prev, communication_mode: 'connected' }))}
            className={`relative flex cursor-pointer rounded-2xl border p-4 transition-all ${
              formData.communication_mode === 'connected'
                ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/10'
                : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
            }`}
          >
            <input
              type="radio"
              name="communication_mode"
              value="connected"
              checked={formData.communication_mode === 'connected'}
              onChange={() => {}}
              className="sr-only"
            />
            <div className="flex gap-3">
              <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                formData.communication_mode === 'connected'
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'bg-slate-800 text-slate-400'
              }`}>
                <Zap className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white">Connected Hub</span>
                  {formData.communication_mode === 'connected' && (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  )}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Auto-syncs from linked channels once integration is set up (Task 41+). Best for new & automated clients.
                </p>
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Section 3: Regional & Billing Settings */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider text-sky-400 flex items-center gap-2">
          Platform & Region
        </h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {/* Platform */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Primary Platform</label>
            <select
              name="platform"
              value={formData.platform}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-sky-500 focus:outline-none transition"
            >
              <option value="WhatsApp">WhatsApp</option>
              <option value="Slack">Slack</option>
              <option value="Upwork">Upwork</option>
              <option value="Discord">Discord</option>
              <option value="Email">Email</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Country */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Country</label>
            <input
              type="text"
              name="country"
              value={formData.country}
              onChange={handleChange}
              placeholder="e.g. United States"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none transition"
            />
          </div>

          {/* Currency */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Currency</label>
            <input
              type="text"
              name="currency"
              value={formData.currency}
              onChange={handleChange}
              placeholder="USD"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none transition uppercase"
            />
          </div>

          {/* Payment Schedule */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Payment Schedule</label>
            <select
              name="payment_schedule"
              value={formData.payment_schedule}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-sky-500 focus:outline-none transition"
            >
              <option value="Per Project">Per Project</option>
              <option value="Monthly">Monthly</option>
              <option value="Weekly">Weekly</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Initial Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-sky-500 focus:outline-none transition"
            >
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">Notes & Context</label>
          <textarea
            name="notes"
            rows={3}
            value={formData.notes}
            onChange={handleChange}
            placeholder="Add internal notes about client preferences, contracts, or background..."
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none transition"
          />
        </div>
      </div>

      {/* Section 4: Tags & Categorization */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider text-sky-400 flex items-center gap-2">
          <TagIcon className="h-4 w-4" />
          Tags & Categorization
        </h3>

        <TagSelect
          selectedTags={formData.tags}
          onChange={(tags) => setFormData((prev) => ({ ...prev, tags }))}
        />
      </div>

      {/* Form Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Link
          href="/clients"
          className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-sky-600/25 hover:from-sky-400 hover:to-blue-500 transition-all disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Saving Client...</span>
            </>
          ) : (
            <span>Save Client</span>
          )}
        </button>
      </div>
    </form>
  )
}
