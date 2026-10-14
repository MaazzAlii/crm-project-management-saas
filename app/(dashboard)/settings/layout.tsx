'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Building2, Users, CreditCard, Puzzle, Bot, Settings, ShieldCheck } from 'lucide-react'

const settingsTabs = [
  { name: 'Organization', href: '/settings/organization', icon: Building2 },
  { name: 'Team Members', href: '/settings/team', icon: Users },
  { name: 'Billing & Plans', href: '/settings/billing', icon: CreditCard },
  { name: 'Integrations', href: '/settings/integrations', icon: Puzzle },
  { name: 'AI Settings', href: '/settings/ai', icon: Bot },
  { name: 'Audit Log', href: '/settings/audit-log', icon: ShieldCheck },
]

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="space-y-6">
      {/* Settings Header */}
      <div className="border-b border-border pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-sm">
            <Settings className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
              Workspace Settings
            </h1>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Manage your organization profile, team permissions, billing plans, and system preferences.
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-6 flex overflow-x-auto gap-1 border-b border-border pb-px no-scrollbar">
          {settingsTabs.map((tab) => {
            const Icon = tab.icon
            const isActive = pathname === tab.href || pathname?.startsWith(tab.href + '/')

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex items-center gap-2 rounded-t-xl px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition-all border-b-2 ${
                  isActive
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/60'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
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
