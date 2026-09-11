'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Briefcase,
  CheckSquare,
  Inbox,
  UserCheck,
  BarChart3,
  Settings,
  ShieldCheck,
  X,
  Sparkles,
} from 'lucide-react'

export interface SidebarProps {
  isSuperAdmin?: boolean
  isOpenMobile?: boolean
  onCloseMobile?: () => void
}

export const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Clients (CRM)', href: '/clients', icon: Users },
  { name: 'Projects', href: '/projects', icon: Briefcase },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  { name: 'Unified Inbox', href: '/inbox', icon: Inbox },
  { name: 'Team Members', href: '/team', icon: UserCheck },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Org Settings', href: '/settings', icon: Settings },
]

export function Sidebar({ isSuperAdmin, isOpenMobile, onCloseMobile }: SidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden animate-in fade-in duration-200"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-64 flex-col border-r border-slate-800/80 bg-slate-950/95 backdrop-blur-md transition-transform duration-200 lg:static lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-800/80 px-5">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 font-extrabold text-white shadow-md shadow-sky-600/30">
              IX
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight text-white leading-tight">
                INNOVENTIX
              </span>
              <span className="text-[10px] font-semibold text-slate-400">CRM & Project Hub</span>
            </div>
          </Link>

          {/* Close button on mobile */}
          <button
            onClick={onCloseMobile}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname?.startsWith(item.href))

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                className={`group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-sky-600/15 text-sky-400 border border-sky-500/30 shadow-sm'
                    : 'text-slate-400 hover:bg-slate-900/90 hover:text-slate-200'
                }`}
              >
                <Icon
                  className={`h-4 w-4 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-sky-400' : 'text-slate-500 group-hover:text-slate-300'
                  }`}
                />
                <span className="truncate">{item.name}</span>
              </Link>
            )
          })}
        </div>

        {/* Bottom Section: Super Admin Quick Portal */}
        <div className="border-t border-slate-800/80 p-3 space-y-2">
          {isSuperAdmin && (
            <Link
              href="/super-admin/dashboard"
              onClick={onCloseMobile}
              className="flex items-center gap-2.5 rounded-xl border border-purple-500/30 bg-purple-500/10 px-3.5 py-2.5 text-xs font-semibold text-purple-300 hover:bg-purple-500/20 hover:text-purple-200 transition"
            >
              <ShieldCheck className="h-4 w-4 text-purple-400" />
              <span>Super Admin Portal</span>
            </Link>
          )}

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-xs text-slate-400">
            <div className="flex items-center gap-1.5 font-semibold text-slate-300 mb-1">
              <Sparkles className="h-3.5 w-3.5 text-sky-400" />
              <span>Self-Hosted Pro</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-400">
              v2.0 active stack running on VPS infrastructure.
            </p>
          </div>
        </div>
      </aside>
    </>
  )
}
