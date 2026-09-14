'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, Loader2 } from 'lucide-react'

interface StartImpersonationButtonProps {
  organizationId: string
  organizationName: string
}

export function StartImpersonationButton({
  organizationId,
  organizationName,
}: StartImpersonationButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleStartImpersonation = async () => {
    if (
      !confirm(
        `Start read-only Support Access as '${organizationName}'?\n\nAll support actions are logged.`
      )
    ) {
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/super-admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          organizationName,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        alert(data.error || 'Failed to start support access.')
        return
      }

      router.refresh()
      window.location.href = `/dashboard`
    } catch (err) {
      console.error('Error starting support access:', err)
      alert('Network error initiating support access.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleStartImpersonation}
      disabled={loading}
      className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3.5 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 hover:text-amber-200 transition disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Eye className="h-4 w-4" />
      )}
      Start Support Access (Read-Only)
    </button>
  )
}
