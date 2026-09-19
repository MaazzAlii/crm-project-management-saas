import { Metadata } from 'next'
import { requirePortalSession } from '@/lib/portal/auth'
import { fetchClientPortalSettingsData } from '@/lib/portal/settings'
import { PortalNav } from '@/components/client-portal/PortalNav'
import { PortalSettingsClient } from '@/components/client-portal/PortalSettingsClient'
import { Settings } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Client Portal Settings & Preferences | Innoventix Hub',
  description: 'Manage your organization profile, invoicing preferences, alert rules, and authorized users.',
}

export default async function ClientPortalSettingsPage() {
  await requirePortalSession()
  const data = await fetchClientPortalSettingsData()

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <PortalNav
        orgName={data.organization.name}
        orgLogoUrl={data.organization.logoUrl}
      />

      <main className="mx-auto max-w-5xl px-6 py-8 space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/30 text-violet-400 flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">Portal Settings & Preferences</h1>
              <p className="text-xs text-slate-400">
                Manage your organization profile, contact records, alert rules, and authorized portal logins.
              </p>
            </div>
          </div>
        </div>

        {/* Client Settings Tabs & Forms */}
        <PortalSettingsClient initialData={data} />
      </main>
    </div>
  )
}
