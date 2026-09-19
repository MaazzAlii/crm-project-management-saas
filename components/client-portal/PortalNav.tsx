'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Building2, LayoutDashboard, FolderOpen, FileText, Settings, LogOut } from 'lucide-react'

interface PortalNavProps {
  orgName: string
  orgLogoUrl?: string | null
}

const navLinks = [
  { href: '/client/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/client/projects', label: 'Projects', icon: FolderOpen },
  { href: '/client/invoices', label: 'Invoices', icon: FileText },
  { href: '/client/settings', label: 'Settings', icon: Settings },
]

export function PortalNav({ orgName, orgLogoUrl }: PortalNavProps) {
  const pathname = usePathname()

  return (
    <nav className="sticky top-0 z-30 border-b border-slate-800/60 bg-slate-950/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          {orgLogoUrl ? (
            <img src={orgLogoUrl} alt={orgName} className="h-8 w-8 rounded-lg object-cover" />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600/20 ring-1 ring-violet-500/30">
              <Building2 className="h-4 w-4 text-violet-400" />
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-white leading-none">{orgName}</p>
            <p className="text-[10px] text-slate-500 leading-none mt-0.5">Client Portal</p>
          </div>
        </div>

        {/* Links */}
        <div className="hidden sm:flex items-center gap-1">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-violet-600/20 text-violet-300'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            )
          })}
        </div>

        {/* Sign out */}
        <form action="/client/auth/signout" method="post">
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-slate-400 transition-colors hover:bg-slate-800/60 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </form>
      </div>

      {/* Mobile bottom nav */}
      <div className="flex sm:hidden border-t border-slate-800/40 px-4 py-2 gap-1">
        {navLinks.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center gap-1 rounded-lg py-2 text-[10px] font-medium transition-colors ${
                active ? 'text-violet-400' : 'text-slate-500 hover:text-white'
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
