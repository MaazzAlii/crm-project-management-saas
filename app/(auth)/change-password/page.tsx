'use client'

import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Lock, ArrowRight, AlertCircle, CheckCircle2, Loader2, KeyRound, ShieldAlert } from 'lucide-react'

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
      <div className="bg-slate-900/80 backdrop-blur-xl py-8 px-4 shadow-2xl border border-slate-800/80 sm:rounded-2xl sm:px-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto mb-4">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-bold text-white mb-2">Password Updated Successfully</h2>
        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          Your new password has been established. Redirecting you to your dashboard...
        </p>
        <div className="flex justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-sky-400" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-slate-900/80 backdrop-blur-xl py-8 px-4 shadow-2xl border border-slate-800/80 sm:rounded-2xl sm:px-10">
      <div className="mb-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 mx-auto mb-3">
          <KeyRound className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">
          {isRequired ? 'Change Temporary Password' : 'Change Your Password'}
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          {isRequired
            ? 'For security, you must establish a permanent password on first login.'
            : 'Update your account credentials to keep your workspace secure.'}
        </p>
      </div>

      {isRequired && (
        <div className="mb-6 border border-amber-500/20 bg-amber-500/10 rounded-xl p-3.5 flex items-start gap-3 text-xs text-amber-300">
          <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold text-amber-200">First-time login required step:</span> Please verify your temporary password and create a strong permanent password.
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 border border-rose-500/20 bg-rose-500/10 rounded-xl p-4 flex items-center gap-3 text-xs text-rose-300">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            {isRequired ? 'Current (Temporary) Password' : 'Current Password'}
          </label>
          <div className="relative rounded-xl shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Lock className="h-4 w-4" />
            </div>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••••••"
              className="block w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition text-xs font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            New Permanent Password
          </label>
          <div className="relative rounded-xl shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Lock className="h-4 w-4" />
            </div>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••••••"
              className="block w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition text-xs font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Confirm New Password
          </label>
          <div className="relative rounded-xl shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Lock className="h-4 w-4" />
            </div>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••••••"
              className={`block w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 transition text-xs font-mono ${
                confirmPassword && !passwordsMatch
                  ? 'border-rose-500 focus:ring-rose-500/50 focus:border-rose-500'
                  : 'border-slate-800 focus:ring-sky-500/50 focus:border-sky-500'
              }`}
            />
          </div>
        </div>

        {/* Password Strength Checklist */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-2">
          <span className="text-[11px] font-semibold text-slate-400 block">Password Requirements:</span>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-400' : 'text-slate-500'}`}>
              <div className={`h-1.5 w-1.5 rounded-full ${hasMinLength ? 'bg-emerald-400' : 'bg-slate-600'}`} />
              <span>At least 8 characters</span>
            </div>
            <div className={`flex items-center gap-1.5 ${hasUppercase ? 'text-emerald-400' : 'text-slate-500'}`}>
              <div className={`h-1.5 w-1.5 rounded-full ${hasUppercase ? 'bg-emerald-400' : 'bg-slate-600'}`} />
              <span>One uppercase letter</span>
            </div>
            <div className={`flex items-center gap-1.5 ${hasLowercase ? 'text-emerald-400' : 'text-slate-500'}`}>
              <div className={`h-1.5 w-1.5 rounded-full ${hasLowercase ? 'bg-emerald-400' : 'bg-slate-600'}`} />
              <span>One lowercase letter</span>
            </div>
            <div className={`flex items-center gap-1.5 ${hasDigit ? 'text-emerald-400' : 'text-slate-500'}`}>
              <div className={`h-1.5 w-1.5 rounded-full ${hasDigit ? 'bg-emerald-400' : 'bg-slate-600'}`} />
              <span>One number (0-9)</span>
            </div>
          </div>
          {confirmPassword && (
            <div className={`flex items-center gap-1.5 text-[11px] pt-1 ${passwordsMatch ? 'text-emerald-400' : 'text-rose-400'}`}>
              <div className={`h-1.5 w-1.5 rounded-full ${passwordsMatch ? 'bg-emerald-400' : 'bg-rose-400'}`} />
              <span>{passwordsMatch ? 'Passwords match' : 'Passwords do not match'}</span>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={!isFormValid || loading}
          className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 shadow-lg shadow-sky-600/25 transition disabled:opacity-50 disabled:cursor-not-allowed"
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
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient radial glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-sky-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center items-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-sky-500/25">
            IX
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
            Innoventix
          </span>
        </div>

        <Suspense
          fallback={
            <div className="bg-slate-900/80 backdrop-blur-xl py-8 px-4 rounded-2xl flex justify-center border border-slate-800">
              <Loader2 className="h-6 w-6 animate-spin text-sky-400" />
            </div>
          }
        >
          <ChangePasswordForm />
        </Suspense>
      </div>
    </div>
  )
}
