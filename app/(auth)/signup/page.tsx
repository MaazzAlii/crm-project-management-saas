'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { handleSignUpAction, handleSignUpWithInviteAction } from '@/app/actions/signup'
import { User, Building, Mail, Lock, ArrowRight, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/theme-toggle'

function SignUpForm() {
  const searchParams = useSearchParams()
  const inviteToken = searchParams.get('invite')

  const [fullName, setFullName] = useState('')
  const [orgName, setOrgName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inviteOrgName, setInviteOrgName] = useState<string | null>(null)
  const [loadingInvite, setLoadingInvite] = useState(!!inviteToken)

  const isInvite = !!inviteToken

  useEffect(() => {
    if (!inviteToken) return

    async function loadInviteInfo() {
      try {
        setLoadingInvite(true)
        const res = await fetch(`/api/invitations/accept-info?token=${encodeURIComponent(inviteToken || '')}`)
        const data = await res.json()
        if (res.ok && data.organizationName) {
          setInviteOrgName(data.organizationName)
          if (data.maskedEmail) {
            setEmail(data.maskedEmail)
          }
        } else {
          setError(data.error || 'This invitation is invalid or has expired.')
        }
      } catch {
        setError('Failed to load invitation details.')
      } finally {
        setLoadingInvite(false)
      }
    }

    loadInviteInfo()
  }, [inviteToken])

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (isInvite && inviteToken) {
        const res = await handleSignUpWithInviteAction({
          fullName,
          password,
          inviteToken,
        })

        if (res.error) {
          setError(res.error)
        } else if (res.redirectUrl) {
          window.location.assign(res.redirectUrl)
          return
        }
      } else {
        const res = await handleSignUpAction({
          fullName,
          orgName,
          email,
          password,
        })

        if (res.error) {
          setError(res.error)
        } else if (res.redirectUrl) {
          window.location.assign(res.redirectUrl)
          return
        }
      }
    } catch {
      setError('An unexpected network error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-900 dark:text-slate-100 relative overflow-hidden transition-colors">
      <div className="fixed top-5 right-5 z-50">
        <ThemeToggle />
      </div>

      {/* Background Glows */}
      <div className="absolute top-1/4 right-1/2 translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/15 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-blue-600/10 blur-3xl rounded-full pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="flex justify-center items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/30">
            IX
          </div>
          <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-800 to-slate-600 dark:from-white dark:via-slate-200 dark:to-slate-400">
            Innoventix Platform
          </span>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {isInvite
            ? `Join ${inviteOrgName || 'your team'}`
            : 'Create organization workspace'}
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
          {isInvite
            ? 'Complete your profile to join your workspace'
            : 'Get started with your multi-tenant CRM & Project Management platform'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl py-8 px-4 shadow-xl dark:shadow-2xl border border-slate-200 dark:border-slate-800/80 sm:rounded-2xl sm:px-10 transition-colors">
          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-red-400 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loadingInvite ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
              <p className="text-xs text-slate-400">Verifying invitation...</p>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSignUp}>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jane Doe"
                    className="block w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
                  />
                </div>
              </div>

              {/* Organization name field is hidden when signing up with an invitation (Prompt 38) */}
              {!isInvite && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Company / Organization Name
                  </label>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                      <Building className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      placeholder="Acme Agency"
                      className="block w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    required
                    readOnly={isInvite}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className={`block w-full pl-10 pr-4 py-2 border rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none text-sm transition-all ${
                      isInvite
                        ? 'bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700/80 cursor-not-allowed opacity-90'
                        : 'bg-slate-50 dark:bg-slate-950/60 border-slate-300 dark:border-slate-800 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500'
                    }`}
                  />
                </div>
                {isInvite && (
                  <p className="text-[11px] text-slate-500 mt-1">
                    Locked to the invitation recipient address.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Password
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="•••••••• (Min 6 chars)"
                    className="block w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg shadow-blue-600/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{isInvite ? 'Joining Team...' : 'Creating Workspace...'}</span>
                    </>
                  ) : (
                    <>
                      <span>{isInvite ? 'Create Account & Join' : 'Create Workspace'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
            Already have an account?{' '}
            <Link
              href={isInvite ? `/login?redirectTo=${encodeURIComponent(`/invite/${inviteToken}`)}` : '/login'}
              className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
        </div>
      }
    >
      <SignUpForm />
    </Suspense>
  )
}
