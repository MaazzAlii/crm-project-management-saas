'use client'

import { useState } from 'react'
import {
  Building2,
  CreditCard,
  Bell,
  Radio,
  Users,
  Check,
  AlertCircle,
  Loader2,
  Save,
  Globe,
  Mail,
  Phone,
  ShieldCheck,
  Zap,
  ExternalLink,
} from 'lucide-react'
import type { ClientPortalFullSettingsData } from '@/lib/portal/settings'
import {
  updatePortalProfileAction,
  updatePortalBillingAction,
  updatePortalNotificationsAction,
} from '@/app/actions/portal-settings'

interface PortalSettingsClientProps {
  initialData: ClientPortalFullSettingsData
}

type TabType = 'profile' | 'billing' | 'notifications' | 'integrations' | 'team'

export function PortalSettingsClient({ initialData }: PortalSettingsClientProps) {
  const [activeTab, setActiveTab] = useState<TabType>('profile')
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  )

  // Profile Form State
  const [name, setName] = useState(initialData.client.name)
  const [company, setCompany] = useState(initialData.client.company || '')
  const [email, setEmail] = useState(initialData.client.email || '')
  const [phone, setPhone] = useState(initialData.client.phone || '')
  const [country, setCountry] = useState(initialData.client.country || '')
  const [logoUrl, setLogoUrl] = useState(initialData.client.settings.logo_url || '')

  // Billing Form State
  const [billingEmail, setBillingEmail] = useState(
    initialData.client.settings.billing_email || initialData.client.email || ''
  )
  const [taxId, setTaxId] = useState(initialData.client.settings.tax_id || '')
  const [preferredMethod, setPreferredMethod] = useState(
    initialData.client.settings.invoicing_preferences.preferred_method || 'stripe_card'
  )
  const [requirePo, setRequirePo] = useState(
    initialData.client.settings.invoicing_preferences.require_po || false
  )
  const [autoReceipt, setAutoReceipt] = useState(
    initialData.client.settings.invoicing_preferences.auto_receipt ?? true
  )
  const [currency, setCurrency] = useState(initialData.client.currency || 'USD')

  // Notifications Form State
  const [notifNewProject, setNotifNewProject] = useState(
    initialData.client.settings.notifications.new_project ?? true
  )
  const [notifDeadline, setNotifDeadline] = useState(
    initialData.client.settings.notifications.deadline_alerts ?? true
  )
  const [notifDeliverable, setNotifDeliverable] = useState(
    initialData.client.settings.notifications.deliverable_ready ?? true
  )
  const [notifInvoice, setNotifInvoice] = useState(
    initialData.client.settings.notifications.invoice_issued ?? true
  )

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setFeedback(null)

    const res = await updatePortalProfileAction({
      name,
      company,
      email,
      phone,
      country,
      logoUrl,
    })

    if (res.success) {
      setFeedback({ type: 'success', message: res.message || 'Profile saved successfully!' })
    } else {
      setFeedback({ type: 'error', message: res.error || 'Failed to update profile.' })
    }
    setLoading(false)
  }

  const handleSaveBilling = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setFeedback(null)

    const res = await updatePortalBillingAction({
      billingEmail,
      taxId,
      preferredMethod,
      requirePo,
      autoReceipt,
      currency,
    })

    if (res.success) {
      setFeedback({ type: 'success', message: res.message || 'Billing preferences saved!' })
    } else {
      setFeedback({ type: 'error', message: res.error || 'Failed to save billing preferences.' })
    }
    setLoading(false)
  }

  const handleSaveNotifications = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setFeedback(null)

    const res = await updatePortalNotificationsAction({
      newProject: notifNewProject,
      deadlineAlerts: notifDeadline,
      deliverableReady: notifDeliverable,
      invoiceIssued: notifInvoice,
    })

    if (res.success) {
      setFeedback({ type: 'success', message: res.message || 'Notification settings saved!' })
    } else {
      setFeedback({ type: 'error', message: res.error || 'Failed to save notification settings.' })
    }
    setLoading(false)
  }

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'profile', label: 'Company Profile', icon: <Building2 className="w-4 h-4" /> },
    { id: 'billing', label: 'Billing & Invoicing', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
    { id: 'integrations', label: 'Channels & Status', icon: <Radio className="w-4 h-4" /> },
    { id: 'team', label: 'Authorized Users', icon: <Users className="w-4 h-4" /> },
  ]

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-900/90 border border-slate-800 rounded-xl max-w-fit shadow-inner">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id)
              setFeedback(null)
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === tab.id
                ? 'bg-violet-600 text-white shadow-md shadow-violet-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center gap-2.5 transition-all animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* TAB 1: Company Profile */}
      {activeTab === 'profile' && (
        <form
          onSubmit={handleSaveProfile}
          className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6"
        >
          <div className="border-b border-slate-800/80 pb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-violet-400" />
              <span>Company & Contact Information</span>
            </h3>
            <p className="text-xs text-slate-400">
              Update how your agency partners identify and reach your organization.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                Contact / Representative Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Company / Brand Name</label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Acme Corp"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Primary Contact Email</label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Phone Number</label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Country / Jurisdiction</label>
              <div className="relative">
                <Globe className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="e.g. United States"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Logo / Avatar URL</label>
              <input
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://example.com/logo.png"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-800/80">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-violet-600 hover:bg-violet-500 transition-colors disabled:opacity-50 shadow-md shadow-violet-500/20"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save Profile Changes</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: Billing & Invoicing */}
      {activeTab === 'billing' && (
        <form
          onSubmit={handleSaveBilling}
          className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6"
        >
          <div className="border-b border-slate-800/80 pb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <span>Billing & Invoicing Preferences</span>
            </h3>
            <p className="text-xs text-slate-400">
              Configure your invoice recipient, payment preferences, and tax details.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                Invoice & Billing Email <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  value={billingEmail}
                  onChange={(e) => setBillingEmail(e.target.value)}
                  required
                  placeholder="billing@yourcompany.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Tax ID / VAT Registration</label>
              <input
                type="text"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                placeholder="e.g. US-123456789 or GB999 9999 73"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Preferred Payment Method</label>
              <select
                value={preferredMethod}
                onChange={(e) => setPreferredMethod(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-300 focus:outline-none focus:border-violet-500 transition-colors"
              >
                <option value="stripe_card">Credit / Debit Card (Stripe)</option>
                <option value="bank_transfer">ACH / Wire Transfer</option>
                <option value="paypal">PayPal Business</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Settlement Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-300 focus:outline-none focus:border-violet-500 transition-colors"
              >
                <option value="USD">USD ($ - US Dollar)</option>
                <option value="EUR">EUR (€ - Euro)</option>
                <option value="GBP">GBP (£ - British Pound)</option>
                <option value="CAD">CAD ($ - Canadian Dollar)</option>
              </select>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Invoicing Rules
            </h4>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl cursor-pointer hover:border-slate-700 transition-colors">
                <input
                  type="checkbox"
                  checked={requirePo}
                  onChange={(e) => setRequirePo(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-violet-600 focus:ring-violet-500"
                />
                <div className="text-xs">
                  <p className="font-semibold text-white">Require Purchase Order (PO) Number</p>
                  <p className="text-slate-400">
                    Mandate a client PO reference on all generated project invoices.
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl cursor-pointer hover:border-slate-700 transition-colors">
                <input
                  type="checkbox"
                  checked={autoReceipt}
                  onChange={(e) => setAutoReceipt(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-violet-600 focus:ring-violet-500"
                />
                <div className="text-xs">
                  <p className="font-semibold text-white">Automatic Payment Receipts</p>
                  <p className="text-slate-400">
                    Automatically email PDF payment receipts immediately upon invoice settlement.
                  </p>
                </div>
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-800/80">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors disabled:opacity-50 shadow-md shadow-emerald-500/20"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save Invoicing Preferences</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: Notifications */}
      {activeTab === 'notifications' && (
        <form
          onSubmit={handleSaveNotifications}
          className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6"
        >
          <div className="border-b border-slate-800/80 pb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-400" />
              <span>Client Portal Notification Preferences</span>
            </h3>
            <p className="text-xs text-slate-400">
              Customize which project events trigger direct notifications and email alerts.
            </p>
          </div>

          <div className="space-y-3">
            {/* New Project Initiated */}
            <div className="flex items-center justify-between p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl">
              <div>
                <p className="text-xs font-bold text-white">New Project Kickoff</p>
                <p className="text-[11px] text-slate-400">
                  Notify me whenever the agency initiates a new project or milestone.
                </p>
              </div>
              <input
                type="checkbox"
                checked={notifNewProject}
                onChange={(e) => setNotifNewProject(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-violet-600 focus:ring-violet-500"
              />
            </div>

            {/* Deliverable Ready for Review */}
            <div className="flex items-center justify-between p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl">
              <div>
                <p className="text-xs font-bold text-white">Deliverable Ready for Approval</p>
                <p className="text-[11px] text-slate-400">
                  Immediate alerts when files, videos, or assets are submitted for your review.
                </p>
              </div>
              <input
                type="checkbox"
                checked={notifDeliverable}
                onChange={(e) => setNotifDeliverable(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-violet-600 focus:ring-violet-500"
              />
            </div>

            {/* Deadline Approaching Alerts */}
            <div className="flex items-center justify-between p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl">
              <div>
                <p className="text-xs font-bold text-white">Milestone & Deadline Reminders</p>
                <p className="text-[11px] text-slate-400">
                  Advance warnings 24 hours prior to scheduled project deliverable deadlines.
                </p>
              </div>
              <input
                type="checkbox"
                checked={notifDeadline}
                onChange={(e) => setNotifDeadline(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-violet-600 focus:ring-violet-500"
              />
            </div>

            {/* Invoice Issued / Payment Receipt */}
            <div className="flex items-center justify-between p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl">
              <div>
                <p className="text-xs font-bold text-white">Invoices & Payment Confirmations</p>
                <p className="text-[11px] text-slate-400">
                  Receive notifications when invoices are ready and when transactions complete.
                </p>
              </div>
              <input
                type="checkbox"
                checked={notifInvoice}
                onChange={(e) => setNotifInvoice(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-violet-600 focus:ring-violet-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-800/80">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 transition-colors disabled:opacity-50 shadow-md shadow-amber-500/20"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save Alert Preferences</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 4: Integrations & Channels Status */}
      {activeTab === 'integrations' && (
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="border-b border-slate-800/80 pb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Radio className="w-4 h-4 text-purple-400" />
              <span>Agency Communication Channels & Sync Status</span>
            </h3>
            <p className="text-xs text-slate-400">
              Live status of automated communication bridges connecting your agency team.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Direct WhatsApp Channel */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#25D366]/20 border border-[#25D366]/40 text-[#25D366] flex items-center justify-center font-bold text-xs">
                    WA
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-white">WhatsApp Business</h4>
                    <p className="text-[10px] text-slate-400">Connected to your phone number</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Active Hub</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Inbound text updates and media briefs are auto-routed to your dedicated project manager.
              </p>
            </div>

            {/* Slack Channel */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#36C5F0]/20 border border-[#36C5F0]/40 text-[#36C5F0] flex items-center justify-center font-bold text-xs">
                    SL
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-white">Slack Connect</h4>
                    <p className="text-[10px] text-slate-400">Shared workspace channels</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Connected</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Deliverable review links and revision requests are mirrored in your Slack channel.
              </p>
            </div>

            {/* Email Bridge */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#EA4335]/20 border border-[#EA4335]/40 text-[#EA4335] flex items-center justify-center font-bold text-xs">
                    EM
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-white">Email Sync Bridge</h4>
                    <p className="text-[10px] text-slate-400">Transactional and delivery notices</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Operational</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Inbound emails from registered domain contacts are matched to your account thread.
              </p>
            </div>

            {/* In-App Webhook Notifications */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center font-bold text-xs">
                    N8
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-white">Automated Delivery Webhooks</h4>
                    <p className="text-[10px] text-slate-400">Real-time event stream</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <Zap className="w-3 h-3" />
                  <span>Subscribed</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Signed HMAC event triggers notify your webhook endpoint upon deliverable completion.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Authorized Team Users */}
      {activeTab === 'team' && (
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="border-b border-slate-800/80 pb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              <span>Approved Client Portal Users</span>
            </h3>
            <p className="text-xs text-slate-400">
              Members of your organization authorized to review deliverables and inspect invoices.
            </p>
          </div>

          <div className="space-y-3">
            {initialData.teamMembers.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                Your primary account is the sole active login for this portal.
              </p>
            ) : (
              initialData.teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-violet-600/20 border border-violet-500/30 text-violet-400 flex items-center justify-center font-bold text-xs">
                      {initialData.client.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{initialData.client.name}</p>
                      <p className="text-[11px] text-slate-400 font-mono">
                        {initialData.client.email || 'Authorized Contact'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <ShieldCheck className="w-3 h-3" />
                      <span>{member.isActive ? 'Active Portal Access' : 'Inactive'}</span>
                    </span>
                    {member.invitedAt && (
                      <span className="text-[10px] text-slate-500 hidden sm:inline">
                        Invited {new Date(member.invitedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-4 rounded-xl bg-violet-950/20 border border-violet-500/30 text-xs text-slate-300 flex items-center justify-between gap-4">
            <div>
              <p className="font-bold text-white">Need to add additional team reviewers?</p>
              <p className="text-slate-400 text-[11px]">
                Contact your agency account manager to provision additional login credentials.
              </p>
            </div>
            <a
              href={`mailto:${initialData.organization.name}?subject=Request Portal Access for Team Member`}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white transition-colors whitespace-nowrap"
            >
              Request Access
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
