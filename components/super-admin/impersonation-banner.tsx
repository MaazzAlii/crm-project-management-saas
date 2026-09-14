'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldAlert, LogOut, Loader2 } from 'lucide-react'

interface ImpersonationBannerProps {
  initialActive: boolean
  orgName?: string | null
  expiresAt?: string | null
}

export function ImpersonationBanner({
  initialActive,
  orgName,
  expiresAt,
}: ImpersonationBannerProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [active, setActive] = useState(initialActive)

  if (!active || !orgName) return null

  const formattedExpiry = expiresAt
    ? new Date(expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null

  const handleExitSupportMode = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/super-admin/impersonate', {
        method: 'DELETE',
      })
      if (res.ok) {
        setActive(false)
        router.refresh()
        window.location.href = '/super-admin/organizations'
      }
    } catch (err) {
      console.error('Failed to exit support mode:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="sticky top-0 z-50 flex items-center justify-between border-b border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-200 backdrop-blur-md">
      <div className="flex items-center gap-2.5">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">
          <ShieldAlert className="h-4 w-4" />
        </span>
        <div>
          <span className="font-bold text-amber-300">Viewing as [{orgName}]</span>
          <span className="ml-1.5 font-medium text-amber-200/80">— Support Mode (Read-Only)</span>
          {formattedExpiry && (
            <span className="ml-2 rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] text-amber-300">
              Expires at {formattedExpiry}
            </span>
          )}
        </div>
      </div>

      <button
        onClick={handleExitSupportMode}
        disabled={loading}
        className="inline-flex items-center gap-1.5 rounded-md border border-amber-500/40 bg-amber-500/20 px-3 py-1 font-semibold text-amber-200 transition hover:bg-amber-500/30 hover:text-white disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <LogOut className="h-3.5 w-3.5" />
        )}
        Exit Support Mode
      </button>
    </div>
  )
}
