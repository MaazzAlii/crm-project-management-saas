'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Building2, ShieldAlert, ArrowLeft, Sliders, ShieldCheck } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/theme-toggle'

interface SuperAdminNavProps {
  userEmail?: string
}

export function SuperAdminNav({ userEmail }: SuperAdminNavProps) {
  const pathname = usePathname()

  const navItems = [
    {
      name: 'Platform Overview',
      href: '/super-admin/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Organizations',
      href: '/super-admin/organizations',
      icon: Building2,
    },
    {
      name: 'Platform Settings',
      href: '/super-admin/settings',
      icon: Sliders,
    },
    {
      name: 'Audit Logs',
      href: '/super-admin/audit-log',
      icon: ShieldCheck,
    },
  ]

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 text-foreground">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 shadow-md shadow-purple-900/30">
              <ShieldAlert className="h-5 w-5 text-white" /> {/* intentional: white icon on brand gradient background */}
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-foreground">
                INNOVENTIX
              </span>
              <span className="ml-2 rounded-md bg-purple-500/10 px-2 py-0.5 text-xs font-semibold text-purple-600 dark:text-purple-300 border border-purple-500/30">
                SUPER ADMIN
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || (item.href !== '/super-admin/dashboard' && pathname?.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30 shadow-xs'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          {userEmail && (
            <span className="hidden sm:inline-block text-xs text-muted-foreground font-mono bg-muted/50 px-2.5 py-1 rounded-md border border-border">
              {userEmail}
            </span>
          )}
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Exit to Tenant Hub
          </Link>
        </div>
      </div>
    </header>
  )
}
