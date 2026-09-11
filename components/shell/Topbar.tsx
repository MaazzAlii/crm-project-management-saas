'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { OrgSwitcher } from './OrgSwitcher'
import { type UserSessionContext, type UserOrganizationItem } from '@/lib/auth/session'
import { Bell, Menu, LogOut, User, Shield, ChevronDown } from 'lucide-react'

interface TopbarProps {
  sessionContext: UserSessionContext
  onOpenMobileMenu: () => void
}

export function Topbar({ sessionContext, onOpenMobileMenu }: TopbarProps) {
  const router = useRouter()
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const { user, organization, userOrganizations, role } = sessionContext

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    setSigningOut(true)
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/login')
      router.refresh()
    } catch (err) {
      console.error('Sign out error:', err)
    } finally {
      setSigningOut(false)
    }
  }

  const userInitials = user.full_name
    ? user.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2)
    : user.email.substring(0, 2).toUpperCase()

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-800/80 bg-slate-950/90 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Button */}
        <button
          onClick={onOpenMobileMenu}
          className="rounded-lg border border-slate-800 bg-slate-900 p-2 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Organization Switcher */}
        {organization && (
          <OrgSwitcher
            currentOrg={organization}
            userOrganizations={userOrganizations}
          />
        )}
      </div>

      {/* Right Header Actions */}
      <div className="flex items-center gap-3">
        {/* Notification Bell Stub (Wired in Task 53) */}
        <button
          title="In-App Notifications"
          className="relative rounded-xl border border-slate-800 bg-slate-900/80 p-2.5 text-slate-400 hover:border-slate-700 hover:bg-slate-800 hover:text-white transition"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-sky-500 animate-pulse" />
        </button>

        {/* User Account Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="flex items-center gap-2.5 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-left text-xs font-medium text-white hover:border-slate-700 hover:bg-slate-800 transition focus:outline-none"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 font-bold text-white shadow-sm">
              {userInitials}
            </div>
            <div className="hidden flex-col sm:flex">
              <span className="font-semibold text-white truncate max-w-[120px]">
                {user.full_name || user.email.split('@')[0]}
              </span>
              <span className="text-[10px] capitalize text-slate-400 font-mono">
                {role || 'Member'}
              </span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>

          {userDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-800 bg-slate-900 p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3 py-2 border-b border-slate-800">
                <p className="text-xs font-bold text-white truncate">
                  {user.full_name || 'Account User'}
                </p>
                <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                {role && (
                  <span className="mt-1 inline-block rounded bg-sky-500/10 px-2 py-0.5 text-[10px] font-semibold text-sky-400 border border-sky-500/20 capitalize">
                    Role: {role}
                  </span>
                )}
              </div>

              <div className="pt-2">
                <button
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition disabled:opacity-50"
                >
                  <LogOut className="h-4 w-4" />
                  {signingOut ? 'Signing out...' : 'Sign Out'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
