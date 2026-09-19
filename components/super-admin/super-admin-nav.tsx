'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Building2, ShieldAlert, ArrowLeft, Sliders, ShieldCheck } from 'lucide-react'

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
    <header className="sticky top-0 z-50 border-b border-purple-900/40 bg-slate-950/95 backdrop-blur supports-[backdrop-filter]:bg-slate-950/80 text-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 shadow-md shadow-purple-900/30">
              <ShieldAlert className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight bg-gradient-to-r from-white via-slate-100 to-purple-200 bg-clip-text text-transparent">
                INNOVENTIX
              </span>
              <span className="ml-2 rounded-md bg-purple-950/80 px-2 py-0.5 text-xs font-semibold text-purple-300 border border-purple-800/50">
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
                      ? 'bg-purple-600/20 text-purple-200 border border-purple-500/30 shadow-sm'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {userEmail && (
            <span className="hidden sm:inline-block text-xs text-slate-400 font-mono bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800">
              {userEmail}
            </span>
          )}
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Exit to Tenant Hub
          </Link>
        </div>
      </div>
    </header>
  )
}
