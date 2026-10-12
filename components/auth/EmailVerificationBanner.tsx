'use client'

import React, { useState, useEffect } from 'react'
import { AlertCircle, CheckCircle2, Loader2, Mail, X } from 'lucide-react'

interface EmailVerificationBannerProps {
  isVerified?: boolean
  userEmail?: string
}

export function EmailVerificationBanner({
  isVerified = false,
  userEmail,
}: EmailVerificationBannerProps) {
  const [dismissed, setDismissed] = useState(true)
  const [sending, setSending] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    // If already verified, never show
    if (isVerified) {
      setDismissed(true)
      return
    }

    // Dismissible for the browser session
    const isDismissed = sessionStorage.getItem('dismiss_email_verification_banner') === '1'
    setDismissed(isDismissed)
  }, [isVerified])

  if (isVerified || dismissed) {
    return null
  }

  const handleSendVerification = async () => {
    try {
      setSending(true)
      setFeedback(null)

      const res = await fetch('/api/auth/verify-email/send', {
        method: 'POST',
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to send verification email')
      }

      setFeedback({
        type: 'success',
        text: 'Verification link sent! Please check your inbox.',
      })
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.message || 'Error sending verification link.',
      })
    } finally {
      setSending(false)
    }
  }

  const handleDismiss = () => {
    sessionStorage.setItem('dismiss_email_verification_banner', '1')
    setDismissed(true)
  }

  return (
    <div
      data-testid="email-verification-banner"
      className="relative z-20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-950/20 to-slate-900 p-4 shadow-lg backdrop-blur-md"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400">
          <Mail className="h-5 w-5" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-amber-300">
            Confirm your email to invite teammates.
          </h4>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {userEmail
              ? `We sent a link to ${userEmail}. Confirm your address to unlock all team collaboration features.`
              : 'Confirm your email address to unlock workspace invitation permissions.'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
        {feedback && (
          <span
            className={`text-[11px] font-semibold flex items-center gap-1 ${
              feedback.type === 'success' ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : (
              <AlertCircle className="h-3.5 w-3.5" />
            )}
            {feedback.text}
          </span>
        )}

        <button
          type="button"
          disabled={sending}
          onClick={handleSendVerification}
          className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500/20 border border-amber-500/30 px-3 py-1.5 text-xs font-bold text-amber-200 hover:bg-amber-500/30 transition disabled:opacity-50 cursor-pointer"
        >
          {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
          Resend link
        </button>

        <button
          type="button"
          onClick={handleDismiss}
          title="Dismiss for session"
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
