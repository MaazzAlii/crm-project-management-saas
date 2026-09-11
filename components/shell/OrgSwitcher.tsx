'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, ChevronDown, Check, Plus, ShieldAlert } from 'lucide-react'
import { setActiveOrgAction } from '@/app/actions/org'
import { type UserOrganizationItem } from '@/lib/auth/session'
import Link from 'next/link'

interface OrgSwitcherProps {
  currentOrg: {
    id: string
    name: string
    slug: string
    plan_tier: string
  }
  userOrganizations: UserOrganizationItem[]
}

export function OrgSwitcher({ currentOrg, userOrganizations }: OrgSwitcherProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [switching, setSwitching] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelectOrg = async (orgId: string) => {
    if (orgId === currentOrg.id) {
      setIsOpen(false)
      return
    }

    setSwitching(true)
    try {
      await setActiveOrgAction(orgId)
      setIsOpen(false)
      router.refresh()
      window.location.reload()
    } catch (err) {
      console.error('Failed to switch organization:', err)
    } finally {
      setSwitching(false)
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={switching}
        className="flex items-center gap-2.5 rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-2 text-left text-xs font-semibold text-white shadow-sm transition hover:border-slate-700 hover:bg-slate-800/80 focus:outline-none"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-600/20 text-sky-400 border border-sky-500/30">
          <Building2 className="h-4 w-4" />
        </div>
        <div className="flex flex-col">
          <span className="max-w-[130px] truncate font-bold text-white leading-tight sm:max-w-[170px]">
            {currentOrg.name}
          </span>
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-mono">
            {currentOrg.plan_tier} tier
          </span>
        </div>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-64 rounded-xl border border-slate-800 bg-slate-900 p-1.5 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
            Workspaces ({userOrganizations.length})
          </div>

          <div className="py-1 space-y-0.5 max-h-56 overflow-y-auto">
            {userOrganizations.map((org) => {
              const isSelected = org.id === currentOrg.id
              return (
                <button
                  key={org.id}
                  onClick={() => handleSelectOrg(org.id)}
                  className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-xs transition ${
                    isSelected
                      ? 'bg-sky-500/10 text-sky-300 font-semibold border border-sky-500/20'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{org.name}</span>
                  </div>
                  {isSelected && <Check className="h-4 w-4 text-sky-400 shrink-0" />}
                </button>
              )
            })}
          </div>

          <div className="pt-1.5 border-t border-slate-800">
            <Link
              href="/onboarding"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-sky-400 hover:bg-sky-500/10 transition"
            >
              <Plus className="h-4 w-4" />
              Create New Workspace
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
