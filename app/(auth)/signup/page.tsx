'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { handleSignUpAction, handleSignUpWithInviteAction } from '@/app/actions/signup'
import { User, Building, Mail, Lock, ArrowRight, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { PasswordStrengthMeter } from '@/components/auth/PasswordStrengthMeter'

function SignUpForm() {
  const searchParams = useSearchParams()
  const inviteToken = searchParams.get('invite')

  const [fullName, setFullName] = useState('')
  const [orgName, setOrgName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{
    fullName?: string
    orgName?: string
    email?: string
    password?: string
  }>({})
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
    setFieldErrors({})

    try {
      if (isInvite && inviteToken) {
        const res = await handleSignUpWithInviteAction({
          fullName,
          password,
          inviteToken,
        })

        if (res.errorDetail?.field) {
          setFieldErrors({ [res.errorDetail.field]: res.errorDetail.message })
          setError(res.errorDetail.message)
        } else if (res.error) {
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

        if (res.errorDetail?.field) {
          setFieldErrors({ [res.errorDetail.field]: res.errorDetail.message })
          setError(res.errorDetail.message)
        } else if (res.error) {
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-foreground relative overflow-hidden transition-colors">
      <div className="fixed top-5 right-5 z-50">
        <ThemeToggle />
      </div>

      {/* Background Glows */}
      <div className="absolute top-1/4 right-1/2 translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/15 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-blue-600/10 blur-3xl rounded-full pointer-events-none" />

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
          {isInvite
            ? `Join ${inviteOrgName || 'your team'}`
            : 'Create organization workspace'}
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          {isInvite
            ? 'Complete your profile to join your workspace'
            : 'Get started with your multi-tenant CRM & Project Management platform'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl py-8 px-4 shadow-xl dark:shadow-2xl border border-slate-200 dark:border-slate-800/80 sm:rounded-2xl sm:px-10 transition-colors">
          {error && !Object.keys(fieldErrors).length && (
            <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-destructive text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loadingInvite ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">Verifying invitation...</p>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSignUp} noValidate>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Full Name
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-placeholder">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value)
                      if (fieldErrors.fullName) setFieldErrors(prev => ({ ...prev, fullName: undefined }))
                    }}
                    placeholder="Jane Doe"
                    className={`block w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950/60 border rounded-xl text-foreground placeholder:text-placeholder focus:outline-none transition-all text-sm ${
                      fieldErrors.fullName
                        ? 'border-rose-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                        : 'border-slate-300 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500'
                    }`}
                  />
                </div>
                {fieldErrors.fullName && (
                  <p className="mt-1.5 text-xs text-rose-500 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{fieldErrors.fullName}</span>
                  </p>
                )}
              </div>

              {/* Organization name field is hidden when signing up with an invitation (Prompt 38) */}
              {!isInvite && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Company / Organization Name
                  </label>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-placeholder">
                      <Building className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={orgName}
                      onChange={(e) => {
                        setOrgName(e.target.value)
                        if (fieldErrors.orgName) setFieldErrors(prev => ({ ...prev, orgName: undefined }))
                      }}
                      placeholder="Acme Agency"
                      className={`block w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950/60 border rounded-xl text-foreground placeholder:text-placeholder focus:outline-none transition-all text-sm ${
                        fieldErrors.orgName
                          ? 'border-rose-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                          : 'border-slate-300 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500'
                      }`}
                    />
                  </div>
                  {fieldErrors.orgName && (
                    <p className="mt-1.5 text-xs text-rose-500 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{fieldErrors.orgName}</span>
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Email Address
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-placeholder">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    required
                    readOnly={isInvite}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: undefined }))
                    }}
                    placeholder="name@company.com"
                    className={`block w-full pl-10 pr-4 py-2 border rounded-xl text-foreground placeholder:text-placeholder focus:outline-none text-sm transition-all ${
                      isInvite
                        ? 'bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700/80 cursor-not-allowed opacity-90'
                        : fieldErrors.email
                        ? 'bg-slate-50 dark:bg-slate-950/60 border-rose-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                        : 'bg-slate-50 dark:bg-slate-950/60 border-slate-300 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500'
                    }`}
                  />
                </div>
                {isInvite && (
                  <p className="text-[11px] text-subtle-foreground mt-1">
                    Locked to the invitation recipient address.
                  </p>
                )}
                {fieldErrors.email && (
                  <p className="mt-1.5 text-xs text-rose-500 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{fieldErrors.email}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Password
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-placeholder">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: undefined }))
                    }}
                    placeholder="•••••••• (Min 8 chars, mixed case & numbers)"
                    className={`block w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950/60 border rounded-xl text-foreground placeholder:text-placeholder focus:outline-none transition-all text-sm ${
                      fieldErrors.password
                        ? 'border-rose-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                        : 'border-slate-300 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500'
                    }`}
                  />
                </div>
                {fieldErrors.password && (
                  <p className="mt-1.5 text-xs text-rose-500 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{fieldErrors.password}</span>
                  </p>
                )}
                <PasswordStrengthMeter password={password} className="mt-2" />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-primary-foreground bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link
              href={isInvite ? `/login?redirectTo=${encodeURIComponent(`/invite/${inviteToken}`)}` : '/login'}
              className="font-semibold text-primary hover:text-primary/80 transition-colors"
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
