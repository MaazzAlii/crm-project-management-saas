'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Building2, LayoutDashboard, FolderOpen, FileText, Settings, LogOut } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/theme-toggle'

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
    <nav className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-md transition-colors">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          {orgLogoUrl ? (
            <img src={orgLogoUrl} alt={orgName} className="h-8 w-8 rounded-lg object-cover" />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
              <Building2 className="h-4 w-4 text-primary" />
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-foreground leading-none">{orgName}</p>
            <p className="text-[10px] text-muted-foreground leading-none mt-0.5">Client Portal</p>
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
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            )
          })}
        </div>

        {/* Right Actions: Theme Toggle + Sign out */}
        <div className="flex items-center gap-2.5">
          <ThemeToggle />
          <form action="/client/auth/signout" method="post">
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </form>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <div className="flex sm:hidden border-t border-border px-4 py-2 gap-1">
        {navLinks.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center gap-1 rounded-lg py-2 text-[10px] font-medium transition-colors ${
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
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
