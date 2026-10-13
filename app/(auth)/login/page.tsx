'use client'

import { useState, Suspense, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Lock, Mail, ArrowRight, AlertCircle, CheckCircle2, Loader2, Clock } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/theme-toggle'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [retryAfter, setRetryAfter] = useState<number>(0)

  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/dashboard'
  const resetSuccess = searchParams.get('reset') === 'success'

  // Countdown timer for rate-limit lockout
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (retryAfter > 0) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (res.status === 429) {
        const seconds = data.retryAfterSeconds || 60
        setRetryAfter(seconds)
        setError(`Too many attempts. Try again in ${seconds} seconds.`)
      } else if (!res.ok) {
        setError(data.error || 'Invalid email or password')
      } else {
        if (data.requirePasswordChange) {
          window.location.assign(data.redirectTo || '/change-password?required=1')
          return
        }
        window.location.assign(redirectTo)
        return
      }
    } catch {
      setError('An unexpected network error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl py-8 px-4 shadow-xl dark:shadow-2xl border border-slate-200 dark:border-slate-800/80 sm:rounded-2xl sm:px-10 transition-colors">
      {resetSuccess && !error && (
        <div className="mb-6 border border-emerald-500/20 bg-emerald-500/10 rounded-xl p-4 flex items-center gap-3 text-sm text-success">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-success" />
          <span>Password reset successful! Please sign in with your new credentials.</span>
        </div>
      )}

      {error && (
        <div
          className={`mb-6 border rounded-xl p-4 flex items-center gap-3 text-sm ${
            retryAfter > 0
              ? 'bg-amber-500/10 border-amber-500/20 text-warning'
              : 'bg-red-500/10 border-red-500/20 text-destructive'
          }`}
        >
          {retryAfter > 0 ? (
            <Clock className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <span>
            {retryAfter > 0
              ? `Too many attempts. Try again in ${retryAfter}s.`
              : error}
          </span>
        </div>
      )}

      <form className="space-y-5" onSubmit={handleLogin}>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Email Address
          </label>
          <div className="relative rounded-xl shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-placeholder">
              <Mail className="h-5 w-5" />
            </div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="block w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-300 dark:border-slate-800 rounded-xl text-foreground placeholder:text-placeholder focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Password
          </label>
          <div className="relative rounded-xl shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-placeholder">
              <Lock className="h-5 w-5" />
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="block w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-300 dark:border-slate-800 rounded-xl text-foreground placeholder:text-placeholder focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm">
            <Link
              href="/reset-password"
              className="font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Forgot your password?
            </Link>
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading || retryAfter > 0}
            className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-primary-foreground bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : retryAfter > 0 ? (
              <>
                <Clock className="w-4 h-4" />
                <span>Locked — {retryAfter}s</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>

      <div className="mt-6 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link
          href="/signup"
          className="font-semibold text-primary hover:text-primary/80 transition-colors"
        >
          Create organization workspace
        </Link>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-foreground relative overflow-hidden transition-colors">
      <div className="fixed top-5 right-5 z-50">
        <ThemeToggle />
      </div>

      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/15 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-600/10 blur-3xl rounded-full pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="flex justify-center items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-primary-foreground shadow-lg shadow-blue-500/30">
            IX
          </div>
          <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground">
            Innoventix Platform
          </span>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-foreground">
          Sign in to your workspace
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Enter your credentials to access your CRM & Project Management hub
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <Suspense fallback={<div className="text-center text-muted-foreground py-8">Loading...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
