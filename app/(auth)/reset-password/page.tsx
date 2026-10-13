'use client'

import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Lock, ArrowRight, AlertCircle, CheckCircle2, Loader2, KeyRound } from 'lucide-react'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''
  const email = searchParams.get('email') || ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Validation rules
  const hasMinLength = password.length >= 8
  const hasUppercase = /[A-Z]/.test(password)
  const hasLowercase = /[a-z]/.test(password)
  const hasDigit = /[0-9]/.test(password)
  const passwordsMatch = password.length > 0 && password === confirmPassword
  const isFormValid = hasMinLength && hasUppercase && hasLowercase && hasDigit && passwordsMatch

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid || loading) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          token,
          newPassword: password,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to reset password. Please request a new link.')
      } else {
        setSuccess(true)
        setTimeout(() => {
          router.push('/login?reset=success')
        }, 1500)
      }
    } catch {
      setError('An unexpected network error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!token || !email) {
    return (
      <div className="bg-slate-900/80 backdrop-blur-xl py-8 px-4 shadow-2xl border border-slate-800/80 sm:rounded-2xl sm:px-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto mb-4">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-bold text-white mb-2">Invalid Reset Link</h2>
        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          This password reset link is missing required verification parameters. Please request a new link.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-sky-500 transition shadow-lg shadow-sky-600/20"
        >
          <span>Return to Sign In</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    )
  }

  if (success) {
    return (
      <div className="bg-slate-900/80 backdrop-blur-xl py-8 px-4 shadow-2xl border border-slate-800/80 sm:rounded-2xl sm:px-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto mb-4">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-bold text-white mb-2">Password Reset Successfully</h2>
        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          Your password has been updated. Redirecting you to sign in...
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
        <h2 className="text-xl font-bold text-white tracking-tight">Create New Password</h2>
        <p className="text-xs text-slate-400 mt-1">
          Enter a strong new password for <span className="font-medium text-slate-300">{email}</span>
        </p>
      </div>

      {error && (
        <div className="mb-6 border border-rose-500/20 bg-rose-500/10 rounded-xl p-4 flex items-center gap-3 text-xs text-rose-300">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            New Password
          </label>
          <div className="relative rounded-xl shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Lock className="h-4 w-4" />
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="block w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition text-xs"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Confirm Password
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
              className="block w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition text-xs"
            />
          </div>
        </div>

        {/* Strength Checklist */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-3.5 space-y-2 text-[11px]">
          <p className="font-semibold text-slate-400">Password requirements:</p>
          <div className="grid grid-cols-2 gap-2">
            <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-400' : 'text-slate-500'}`}>
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>At least 8 characters</span>
            </div>
            <div className={`flex items-center gap-1.5 ${hasUppercase ? 'text-emerald-400' : 'text-slate-500'}`}>
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Uppercase letter</span>
            </div>
            <div className={`flex items-center gap-1.5 ${hasLowercase ? 'text-emerald-400' : 'text-slate-500'}`}>
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Lowercase letter</span>
            </div>
            <div className={`flex items-center gap-1.5 ${hasDigit ? 'text-emerald-400' : 'text-slate-500'}`}>
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Number (0-9)</span>
            </div>
          </div>
          {confirmPassword.length > 0 && (
            <div className={`flex items-center gap-1.5 pt-1 border-t border-slate-800/60 ${passwordsMatch ? 'text-emerald-400' : 'text-rose-400'}`}>
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{passwordsMatch ? 'Passwords match' : 'Passwords do not match'}</span>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={!isFormValid || loading}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-sky-600/25 hover:from-sky-400 hover:to-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Updating password...</span>
            </>
          ) : (
            <>
              <span>Reset Password</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-950">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex items-center justify-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 font-extrabold text-white shadow-lg shadow-sky-600/30">
            IX
          </div>
          <span className="font-extrabold text-xl tracking-tight text-white">INNOVENTIX</span>
        </Link>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <Suspense fallback={
          <div className="bg-slate-900/80 backdrop-blur-xl p-8 rounded-2xl border border-slate-800 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-sky-400 mx-auto" />
          </div>
        }>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  )
}
