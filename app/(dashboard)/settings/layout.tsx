'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Building2, Users, CreditCard, Puzzle, Bot, Settings } from 'lucide-react'

const settingsTabs = [
  { name: 'Organization', href: '/settings/organization', icon: Building2 },
  { name: 'Team Members', href: '/settings/team', icon: Users },
  { name: 'Billing & Plans', href: '/settings/billing', icon: CreditCard },
  { name: 'Integrations', href: '/settings/integrations', icon: Puzzle },
  { name: 'AI Settings', href: '/settings/ai', icon: Bot },
]

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="space-y-6">
      {/* Settings Header */}
      <div className="border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-600/10 text-sky-400 border border-sky-500/20 shadow-sm">
            <Settings className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Workspace Settings
            </h1>
            <p className="mt-0.5 text-xs text-slate-400">
              Manage your organization profile, team permissions, billing plans, and system preferences.
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-6 flex overflow-x-auto gap-1 border-b border-slate-800 pb-px no-scrollbar">
          {settingsTabs.map((tab) => {
            const Icon = tab.icon
            const isActive = pathname === tab.href || pathname?.startsWith(tab.href + '/')

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex items-center gap-2 rounded-t-xl px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition-all border-b-2 ${
                  isActive
                    ? 'border-sky-500 bg-sky-500/10 text-sky-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-sky-400' : 'text-slate-500'}`} />
                <span>{tab.name}</span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Main Tab Content */}
      <div>{children}</div>
    </div>
  )
}
