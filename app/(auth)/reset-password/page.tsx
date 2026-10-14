'use client'

import { useState, Suspense, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Lock, Mail, ArrowRight, AlertCircle, CheckCircle2, Loader2, KeyRound, Clock } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { PasswordStrengthMeter } from '@/components/auth/PasswordStrengthMeter'
import { validatePasswordStrength } from '@/lib/auth/password'

function ForgotPasswordView() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [retryAfter, setRetryAfter] = useState<number>(0)

  // Countdown timer for rate-limiting
  useEffect(() => {
    if (retryAfter <= 0) return
    const interval = setInterval(() => {
      setRetryAfter((s) => {
        if (s <= 1) {
          clearInterval(interval)
          setError(null)
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [retryAfter])

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (retryAfter > 0 || loading) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (res.status === 429) {
        const seconds = data.retryAfterSeconds || 60
        setRetryAfter(seconds)
        setError(`Too many attempts. Try again in ${seconds} seconds.`)
      } else if (!res.ok) {
        setError(data.error || 'Failed to dispatch reset email. Please try again.')
      } else {
        setSent(true)
      }
    } catch {
      setError('An unexpected network error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="bg-card/90 backdrop-blur-xl py-8 px-4 shadow-sm border border-border sm:rounded-2xl sm:px-10 text-center transition-colors">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 mx-auto mb-4">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-bold text-foreground mb-2">Check your inbox</h2>
        <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
          If an account exists with <span className="font-semibold text-foreground">{email}</span>, we&apos;ve emailed a secure password reset link. The link expires in 1 hour.
        </p>
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => {
              setSent(false)
              setEmail('')
            }}
            className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
          >
            Use a different email address
          </button>
          <div>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition shadow-xs w-full"
            >
              <span>Return to Sign In</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card/90 backdrop-blur-xl py-8 px-4 shadow-sm border border-border sm:rounded-2xl sm:px-10 transition-colors">
      <div className="mb-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary mx-auto mb-3">
          <KeyRound className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold text-foreground tracking-tight">Forgot Password</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Enter your email and we&apos;ll send you a secure link to reset your password.
        </p>
      </div>

      {error && (
        <div
          className={`mb-6 border rounded-xl p-3.5 flex items-center gap-3 text-xs ${
            retryAfter > 0
              ? 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
              : 'bg-destructive/10 border-destructive/20 text-destructive'
          }`}
        >
          {retryAfter > 0 ? (
            <Clock className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{error}</span>
        </div>
      )}

      <form className="space-y-4" onSubmit={handleForgotSubmit}>
        <div>
          <label htmlFor="forgot-email" className="block text-xs font-semibold text-foreground mb-1.5">
            Email Address
          </label>
          <div className="relative rounded-xl shadow-xs">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
              <Mail className="h-4 w-4" />
            </div>
            <input
              id="forgot-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="block w-full pl-10 pr-4 py-2.5 bg-background border border-input rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition text-xs"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || retryAfter > 0}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Sending reset link...</span>
            </>
          ) : (
            <>
              <span>Send Reset Link</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <Link
          href="/login"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5"
        >
          <span>Return to Sign In</span>
        </Link>
      </div>
    </div>
  )
}

function ResetPasswordForm({ token, email }: { token: string; email: string }) {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Validation rules
  const strengthCheck = validatePasswordStrength(password)
  const passwordsMatch = password.length > 0 && password === confirmPassword
  const isFormValid = strengthCheck.isValid && passwordsMatch

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid || loading) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          email: email || undefined,
          password,
          newPassword: password,
          confirmPassword,
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

  if (success) {
    return (
      <div className="bg-card/90 backdrop-blur-xl py-8 px-4 shadow-sm border border-border sm:rounded-2xl sm:px-10 text-center transition-colors">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 mx-auto mb-4">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-bold text-foreground mb-2">Password Reset Successfully</h2>
        <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
          Your password has been updated. Redirecting you to sign in...
        </p>
        <div className="flex justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card/90 backdrop-blur-xl py-8 px-4 shadow-sm border border-border sm:rounded-2xl sm:px-10 transition-colors">
      <div className="mb-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary mx-auto mb-3">
          <KeyRound className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold text-foreground tracking-tight">Create New Password</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Enter a strong new password{email ? <> for <span className="font-medium text-foreground">{email}</span></> : ''}
        </p>
      </div>

      {error && (
        <div className="mb-6 border border-destructive/20 bg-destructive/10 rounded-xl p-3.5 flex items-center gap-3 text-xs text-destructive">
          <AlertCircle className="w-4 h-4 shrink-0 text-destructive" />
          <span>{error}</span>
        </div>
      )}

      <form className="space-y-4" onSubmit={handleResetSubmit}>
        <div>
          <label htmlFor="reset-password" className="block text-xs font-semibold text-foreground mb-1.5">
            New Password
          </label>
          <div className="relative rounded-xl shadow-xs">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
              <Lock className="h-4 w-4" />
            </div>
            <input
              id="reset-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="block w-full pl-10 pr-4 py-2.5 bg-background border border-input rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition text-xs"
            />
          </div>
        </div>

        {/* Live Password Strength Meter */}
        <PasswordStrengthMeter password={password} className="mt-2" />

        <div>
          <label htmlFor="confirm-password" className="block text-xs font-semibold text-foreground mb-1.5">
            Confirm Password
          </label>
          <div className="relative rounded-xl shadow-xs">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
              <Lock className="h-4 w-4" />
            </div>
            <input
              id="confirm-password"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••••••"
              className="block w-full pl-10 pr-4 py-2.5 bg-background border border-input rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition text-xs"
            />
          </div>
          {confirmPassword.length > 0 && (
            <p
              className={`mt-1.5 text-[11px] flex items-center gap-1.5 ${
                passwordsMatch ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'
              }`}
            >
              {passwordsMatch ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Passwords match</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span>Passwords do not match</span>
                </>
              )}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={!isFormValid || loading}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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

      <div className="mt-6 text-center">
        <Link
          href="/login"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5"
        >
          <span>Return to Sign In</span>
        </Link>
      </div>
    </div>
  )
}

function ResetPasswordContainer() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''
  const email = searchParams.get('email') || ''
  const mode = searchParams.get('mode') || ''

  if (!token || mode === 'forgot') {
    return <ForgotPasswordView />
  }

  return <ResetPasswordForm token={token} email={email} />
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col justify-center py-12 sm:px-6 lg:px-8 bg-background text-foreground relative transition-colors">
      <div className="fixed top-5 right-5 z-50">
        <ThemeToggle />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex items-center justify-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary font-extrabold text-primary-foreground shadow-xs">
            IX
          </div>
          <span className="font-extrabold text-xl tracking-tight text-foreground">INNOVENTIX</span>
        </Link>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <Suspense
          fallback={
            <div className="bg-card/90 backdrop-blur-xl p-8 rounded-2xl border border-border text-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
            </div>
          }
        >
          <ResetPasswordContainer />
        </Suspense>
      </div>
    </div>
  )
}
