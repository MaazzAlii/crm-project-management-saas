'use client'

import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Lock, ArrowRight, AlertCircle, CheckCircle2, Loader2, KeyRound, ShieldAlert } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/theme-toggle'

function ChangePasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isRequired = searchParams.get('required') === '1'

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Password Strength Rules
  const hasMinLength = newPassword.length >= 8
  const hasUppercase = /[A-Z]/.test(newPassword)
  const hasLowercase = /[a-z]/.test(newPassword)
  const hasDigit = /[0-9]/.test(newPassword)
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword
  const isFormValid =
    currentPassword.length > 0 &&
    hasMinLength &&
    hasUppercase &&
    hasLowercase &&
    hasDigit &&
    passwordsMatch

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid || loading) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to update password. Please check your current password.')
      } else {
        setSuccess(true)
        setTimeout(() => {
          // Hard reload/redirect to dashboard to re-issue refreshed session token
          window.location.assign('/dashboard')
        }, 1200)
      }
    } catch {
      setError('An unexpected network error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl py-8 px-4 shadow-xl dark:shadow-2xl border border-slate-200 dark:border-slate-800/80 sm:rounded-2xl sm:px-10 text-center transition-colors">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-success mx-auto mb-4">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-bold text-foreground mb-2">Password Updated Successfully</h2>
        <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
          Your new password has been established. Redirecting you to your dashboard...
        </p>
        <div className="flex justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl py-8 px-4 shadow-xl dark:shadow-2xl border border-slate-200 dark:border-slate-800/80 sm:rounded-2xl sm:px-10 transition-colors">
      <div className="mb-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-primary mx-auto mb-3">
          <KeyRound className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold text-foreground tracking-tight">
          {isRequired ? 'Change Temporary Password' : 'Change Your Password'}
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          {isRequired
            ? 'For security, you must establish a permanent password on first login.'
            : 'Update your account credentials to keep your workspace secure.'}
        </p>
      </div>

      {isRequired && (
        <div className="mb-6 border border-amber-500/20 bg-amber-500/10 rounded-xl p-3.5 flex items-start gap-3 text-xs text-warning">
          <ShieldAlert className="w-4 h-4 shrink-0 text-warning mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold text-warning">First-time login required step:</span> Please verify your temporary password and create a strong permanent password.
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 border border-rose-500/20 bg-rose-500/10 rounded-xl p-4 flex items-center gap-3 text-xs text-destructive">
          <AlertCircle className="w-5 h-5 shrink-0 text-destructive" />
          <span>{error}</span>
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">
            {isRequired ? 'Current (Temporary) Password' : 'Current Password'}
          </label>
          <div className="relative rounded-xl shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-placeholder">
              <Lock className="h-4 w-4" />
            </div>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••••••"
              className="block w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-300 dark:border-slate-800 rounded-xl text-foreground placeholder:text-placeholder focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition text-xs font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">
            New Permanent Password
          </label>
          <div className="relative rounded-xl shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-placeholder">
              <Lock className="h-4 w-4" />
            </div>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••••••"
              className="block w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-300 dark:border-slate-800 rounded-xl text-foreground placeholder:text-placeholder focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition text-xs font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">
            Confirm New Password
          </label>
          <div className="relative rounded-xl shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-placeholder">
              <Lock className="h-4 w-4" />
            </div>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••••••"
              className={`block w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border rounded-xl text-foreground placeholder:text-placeholder focus:outline-none focus:ring-2 transition text-xs font-mono ${
                confirmPassword && !passwordsMatch
                  ? 'border-destructive focus:ring-destructive/50 focus:border-destructive'
                  : 'border-slate-300 dark:border-slate-800 focus:ring-indigo-500/50 focus:border-indigo-500'
              }`}
            />
          </div>
        </div>

        {/* Password Strength Checklist */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-3.5 space-y-2 transition-colors">
          <span className="text-[11px] font-semibold text-muted-foreground block">Password Requirements:</span>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-success' : 'text-placeholder'}`}>
              <div className={`h-1.5 w-1.5 rounded-full ${hasMinLength ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-600'}`} />
              <span>At least 8 characters</span>
            </div>
            <div className={`flex items-center gap-1.5 ${hasUppercase ? 'text-success' : 'text-placeholder'}`}>
              <div className={`h-1.5 w-1.5 rounded-full ${hasUppercase ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-600'}`} />
              <span>One uppercase letter</span>
            </div>
            <div className={`flex items-center gap-1.5 ${hasLowercase ? 'text-success' : 'text-placeholder'}`}>
              <div className={`h-1.5 w-1.5 rounded-full ${hasLowercase ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-600'}`} />
              <span>One lowercase letter</span>
            </div>
            <div className={`flex items-center gap-1.5 ${hasDigit ? 'text-success' : 'text-placeholder'}`}>
              <div className={`h-1.5 w-1.5 rounded-full ${hasDigit ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-600'}`} />
              <span>One number (0-9)</span>
            </div>
          </div>
          {confirmPassword && (
            <div className={`flex items-center gap-1.5 text-[11px] pt-1 ${passwordsMatch ? 'text-success' : 'text-destructive'}`}>
              <div className={`h-1.5 w-1.5 rounded-full ${passwordsMatch ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              <span>{passwordsMatch ? 'Passwords match' : 'Passwords do not match'}</span>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={!isFormValid || loading}
          className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-primary-foreground bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-lg shadow-indigo-600/25 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving Password...</span>
            </>
          ) : (
            <>
              <span>Update Password & Continue</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  )
}

export default function ChangePasswordPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-foreground relative overflow-hidden transition-colors">
      <div className="fixed top-5 right-5 z-50">
        <ThemeToggle />
      </div>

      {/* Background ambient radial glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-sky-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center items-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center font-bold text-primary-foreground shadow-lg shadow-sky-500/25">
            IX
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground">
            Innoventix
          </span>
        </div>

        <Suspense
          fallback={
            <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl py-8 px-4 rounded-2xl flex justify-center border border-slate-200 dark:border-slate-800">
              <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
            </div>
          }
        >
          <ChangePasswordForm />
        </Suspense>
      </div>
    </div>
  )
}
