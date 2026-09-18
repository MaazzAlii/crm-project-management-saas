'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Mail, ArrowRight, CheckCircle, AlertCircle, Loader2, Shield, Building2 } from 'lucide-react'

function ClientLoginForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const orgSlug = searchParams.get('org') ?? ''

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()

    // Redirect after OTP confirmation → portal auth callback
    const redirectTo =
      typeof window !== 'undefined'
        ? `${window.location.origin}/client/auth/callback${orgSlug ? `?org=${orgSlug}` : ''}`
        : '/client/auth/callback'

    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false, // Portal users must be pre-created by the org
        emailRedirectTo: redirectTo,
      },
    })

    if (authError) {
      // Friendly message — avoid leaking "user not found"
      setError(
        authError.message.toLowerCase().includes('not found') ||
          authError.message.toLowerCase().includes('invalid')
          ? 'No portal account found for this email. Contact your account manager for access.'
          : authError.message
      )
      setLoading(false)
    } else {
      setSent(true)
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="portal-card text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-500/30">
          <CheckCircle className="h-8 w-8 text-emerald-400" />
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">Check your inbox</h2>
        <p className="text-slate-400 text-sm leading-relaxed">
          We sent a secure login link to <span className="text-white font-medium">{email}</span>.
          <br />
          The link expires in 24 hours.
        </p>
        <button
          onClick={() => { setSent(false); setEmail('') }}
          className="mt-6 text-sm text-slate-400 hover:text-white transition-colors underline underline-offset-4"
        >
          Use a different email
        </button>
      </div>
    )
  }

  return (
    <div className="portal-card">
      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleMagicLink} className="space-y-5">
        <div>
          <label htmlFor="portal-email" className="block text-sm font-medium text-slate-300 mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
              <Mail className="h-5 w-5" />
            </div>
            <input
              id="portal-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="portal-input pl-10"
              autoComplete="email"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !email}
          className="portal-btn-primary w-full"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              Send Magic Link
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-slate-500">
        No password required — we&apos;ll email you a secure, one-time link.
      </p>
    </div>
  )
}

export default function ClientLoginPage() {
  return (
    <div className="portal-bg min-h-screen flex flex-col items-center justify-center px-4 py-16">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-violet-600/10 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-[300px] w-[300px] rounded-full bg-cyan-600/8 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo / branding */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600/20 ring-1 ring-violet-500/30 shadow-lg shadow-violet-500/10">
            <Building2 className="h-7 w-7 text-violet-400" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Client Portal</h1>
          <p className="mt-1.5 text-sm text-slate-400">
            Access your projects, tasks, and deliverables.
          </p>
        </div>

        <Suspense fallback={<div className="portal-card animate-pulse h-48" />}>
          <ClientLoginForm />
        </Suspense>

        {/* Security badge */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-600">
          <Shield className="h-3.5 w-3.5" />
          <span>Secured by Supabase Auth — your data is encrypted end-to-end</span>
        </div>
      </div>
    </div>
  )
}
