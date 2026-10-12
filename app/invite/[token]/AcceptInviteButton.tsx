'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react'

interface AcceptInviteButtonProps {
  token: string
}

export function AcceptInviteButton({ token }: AcceptInviteButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleAccept = async () => {
    try {
      setLoading(true)
      setError(null)

      const res = await fetch('/api/invitations/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to accept invitation')
      }

      setSuccess(true)
      // Redirect to the dashboard with the organization selected (Prompt 37 state 5)
      setTimeout(() => {
        window.location.assign('/dashboard')
      }, 500)
    } catch (err: any) {
      setError(err.message || 'An error occurred while accepting the invitation.')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>Invitation accepted! Redirecting to dashboard...</span>
        </div>
      )}

      <button
        type="button"
        disabled={loading || success}
        onClick={handleAccept}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-600/25 transition disabled:opacity-50 cursor-pointer"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Joining Workspace...</span>
          </>
        ) : (
          <>
            <span>Accept Invitation</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </div>
  )
}
