'use client'

import { useState } from 'react'
import { Building2, Save, Lock, Globe, ImageIcon, Briefcase, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { updateOrganizationProfile } from '@/lib/team/actions'

interface OrgData {
  id: string
  name: string
  industry_type: string | null
  logo_url: string | null
  timezone: string | null
  slug: string
  plan_tier: string
  billing_status: string
}

interface OrgProfileFormProps {
  org: OrgData
  canEdit: boolean
}

const COMMON_TIMEZONES = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'EST / EDT (Eastern Time - New York)' },
  { value: 'America/Chicago', label: 'CST / CDT (Central Time - Chicago)' },
  { value: 'America/Denver', label: 'MST / MDT (Mountain Time - Denver)' },
  { value: 'America/Los_Angeles', label: 'PST / PDT (Pacific Time - Los Angeles)' },
  { value: 'Europe/London', label: 'GMT / BST (London)' },
  { value: 'Europe/Paris', label: 'CET / CEST (Paris, Berlin, Rome)' },
  { value: 'Asia/Kolkata', label: 'IST (India Standard Time - Kolkata)' },
  { value: 'Asia/Tokyo', label: 'JST (Japan Standard Time - Tokyo)' },
  { value: 'Australia/Sydney', label: 'AEST / AEDT (Sydney)' },
]

export function OrgProfileForm({ org, canEdit }: OrgProfileFormProps) {
  const [name, setName] = useState(org.name || '')
  const [industryType, setIndustryType] = useState(org.industry_type || 'General Agency')
  const [logoUrl, setLogoUrl] = useState(org.logo_url || '')
  const [timezone, setTimezone] = useState(org.timezone || 'UTC')

  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canEdit) return

    setSaving(true)
    setMessage(null)

    try {
      const res = await updateOrganizationProfile({
        organizationId: org.id,
        name,
        industryType,
        logoUrl,
        timezone,
      })

      if (res.success) {
        setMessage({ type: 'success', text: 'Organization profile updated successfully!' })
      } else {
        setMessage({ type: 'error', text: res.error || 'Failed to update organization profile.' })
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'An unexpected error occurred.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Non-admin Warning Banner */}
      {!canEdit && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-300"> {/* intentional: warning alert banner */}
          <Lock className="h-5 w-5 text-amber-400 shrink-0" />
          <div>
            <p className="font-bold">Read-Only Mode</p>
            <p className="text-amber-300/80">
              Only organization owners and admins can edit organization settings.
            </p>
          </div>
        </div>
      )}

      {/* Success / Error Feedback Banner */}
      {message && (
        <div
          className={`flex items-center gap-3 rounded-xl border p-4 text-xs font-semibold ${
            message.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' // intentional: success feedback banner
              : 'border-rose-500/30 bg-rose-500/10 text-rose-300' // intentional: error feedback banner
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Workspace Details Card */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-xl space-y-5">
          <div className="border-b border-border pb-4">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              General Organization Profile
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Basic metadata and branding identifiers for your organization.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {/* Organization Name */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-foreground">Organization Name</label>
              <input
                type="text"
                required
                disabled={!canEdit}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Acme Creative Agency"
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none disabled:opacity-60"
              />
            </div>

            {/* Industry Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                Industry Type
              </label>
              <select
                disabled={!canEdit}
                value={industryType}
                onChange={(e) => setIndustryType(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground focus:border-primary focus:outline-none disabled:opacity-60"
              >
                <option value="General Agency">General Agency</option>
                <option value="Digital Marketing">Digital Marketing</option>
                <option value="Software Development">Software Development</option>
                <option value="Design & Creative">Design & Creative</option>
                <option value="Consulting">Consulting</option>
                <option value="E-Commerce Management">E-Commerce Management</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Default Timezone */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                Default Timezone
              </label>
              <select
                disabled={!canEdit}
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground focus:border-primary focus:outline-none disabled:opacity-60"
              >
                {COMMON_TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Logo URL */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
                Logo Asset URL (Optional)
              </label>
              <input
                type="url"
                disabled={!canEdit}
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://example.com/assets/logo.png"
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none disabled:opacity-60 font-mono"
              />
              <p className="text-[11px] text-muted-foreground">
                URL to a high-resolution PNG or SVG logo used for client portal branding.
              </p>
            </div>
          </div>
        </div>

        {/* Read-only System Identifiers */}
        <div className="rounded-2xl border border-border bg-card/60 p-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            System & Billing Metadata
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-border/80 bg-background p-3">
              <span className="text-[11px] text-muted-foreground font-semibold block mb-0.5">Workspace Slug</span>
              <span className="text-xs font-mono text-foreground font-bold">{org.slug}</span>
            </div>

            <div className="rounded-xl border border-border/80 bg-background p-3">
              <span className="text-[11px] text-muted-foreground font-semibold block mb-0.5">Subscription Plan</span>
              <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary border border-primary/20 uppercase font-mono">
                {org.plan_tier}
              </span>
            </div>

            <div className="rounded-xl border border-border/80 bg-background p-3">
              <span className="text-[11px] text-muted-foreground font-semibold block mb-0.5">Billing Status</span>
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-400 border border-emerald-500/20 uppercase font-mono">{/* intentional: active billing status badge */}
                {org.billing_status}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        {canEdit && (
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 transition focus:outline-none disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-primary-foreground" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Organization Profile
                </>
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  )
}
