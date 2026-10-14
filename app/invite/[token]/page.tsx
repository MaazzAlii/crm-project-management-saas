import React from 'react'
import Link from 'next/link'
import { getCurrentSessionContext } from '@/lib/auth/session'
import { getInvitationAcceptInfo } from '@/lib/services/invitation-service'
import { hashToken } from '@/lib/security/invite-token'
import { invitationRepo } from '@/lib/db/repositories/invitation-repo'
import { Users, AlertTriangle, ArrowRight, ShieldCheck, Mail, LogOut, CheckCircle2 } from 'lucide-react'
import { AcceptInviteButton } from './AcceptInviteButton'

interface PageProps {
  params: Promise<{ token: string }> | { token: string }
}

export default async function InviteAcceptancePage({ params }: PageProps) {
  const resolvedParams = await Promise.resolve(params)
  const token = resolvedParams.token

  // 1. Fetch public invitation accept info
  const acceptInfoRes = await getInvitationAcceptInfo(token)
  const session = await getCurrentSessionContext()

  // STATE 1: Invalid, expired, or revoked
  if (!acceptInfoRes.success) {
    const isExpired = acceptInfoRes.error === 'expired'
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 text-slate-100 relative">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-8 shadow-2xl text-center space-y-4">
            <div
              className={`w-12 h-12 rounded-2xl ${
                isExpired
                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
              } border flex items-center justify-center mx-auto`}
            >
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-white">
              {isExpired ? 'This Invitation Has Expired' : 'Invitation Unavailable'}
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              {isExpired
                ? 'This invitation link has expired. Workspace invitations are valid for 7 days. Please contact your workspace administrator to request a new invitation.'
                : 'This invitation is invalid or has been revoked. Please contact your workspace administrator to request a new invitation.'}
            </p>
            <div className="pt-4 border-t border-slate-800 space-y-2">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 w-full rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700 transition"
              >
                Sign in to your account
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Get full recipient email from repo for matching
  const tokenHash = hashToken(token)
  const invitation = await invitationRepo.findByTokenHash(tokenHash)
  const targetEmail = invitation?.email?.toLowerCase().trim() || ''

  const loggedInEmail = session?.user?.email?.toLowerCase().trim()
  const isRightAccount = loggedInEmail && loggedInEmail === targetEmail
  const isWrongAccount = loggedInEmail && loggedInEmail !== targetEmail

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 text-slate-100 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 right-1/2 translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/15 blur-3xl rounded-full pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="flex justify-center items-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/30">
            IX
          </div>
          <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
            Innoventix Platform
          </span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-8 shadow-2xl backdrop-blur-xl space-y-6">
          {/* Header */}
          <div className="text-center space-y-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/10 px-3 py-1 text-[11px] font-bold text-sky-400 border border-sky-500/20">
              <Users className="w-3.5 h-3.5" />
              Team Invitation
            </span>
            <h2 className="text-2xl font-black text-white pt-2">
              Join {acceptInfoRes.organizationName}
            </h2>
            <p className="text-xs text-slate-400">
              You have been invited to join this workspace as a{' '}
              <span className="font-semibold text-white uppercase font-mono">{acceptInfoRes.role}</span>.
            </p>
          </div>

          {/* STATE 4: Signed in with another email */}
          {isWrongAccount ? (
            <div className="space-y-4 pt-2">
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-xs text-amber-300 space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-400">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  Different account logged in
                </div>
                <p className="leading-relaxed">
                  This invite is for another email address. Sign out and sign in with{' '}
                  <span className="font-semibold text-white font-mono">{acceptInfoRes.maskedEmail}</span>.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <form action="/api/auth/logout" method="POST">
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700 transition cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out & Switch Account
                  </button>
                </form>
              </div>
            </div>
          ) : isRightAccount ? (
            /* STATE 3: Signed in with the right email */
            <div className="space-y-4 pt-2">
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-xs space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Signed in as:</span>
                  <span className="font-mono text-white font-medium">{session?.user?.email}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Assigned Role:</span>
                  <span className="rounded bg-sky-500/20 text-sky-400 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                    {acceptInfoRes.role}
                  </span>
                </div>
              </div>

              <AcceptInviteButton token={token} />
            </div>
          ) : (
            /* STATE 2: Needs account / Not signed in */
            <div className="space-y-4 pt-2">
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-xs text-slate-400 space-y-1">
                <div>Invited Recipient:</div>
                <div className="font-mono text-white font-semibold text-sm">
                  {acceptInfoRes.maskedEmail}
                </div>
              </div>

              {acceptInfoRes.accountExists ? (
                /* Account already exists: Sign in link */
                <div className="space-y-3">
                  <Link
                    href={`/login?redirectTo=${encodeURIComponent(`/invite/${token}`)}`}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-600/25 transition cursor-pointer"
                  >
                    <span>Sign In to Accept</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <p className="text-center text-[11px] text-slate-500">
                    Sign in with your registered password to join {acceptInfoRes.organizationName}.
                  </p>
                </div>
              ) : (
                /* Needs new account: Locked signup flow */
                <div className="space-y-3">
                  <Link
                    href={`/signup?invite=${encodeURIComponent(token)}`}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-600/25 transition cursor-pointer"
                  >
                    <span>Create Your Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <div className="text-center text-[11px] text-slate-400">
                    Already have an account?{' '}
                    <Link
                      href={`/login?redirectTo=${encodeURIComponent(`/invite/${token}`)}`}
                      className="font-bold text-blue-400 hover:text-blue-300"
                    >
                      Sign in instead
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
