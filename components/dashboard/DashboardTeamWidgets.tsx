import React from 'react'
import Link from 'next/link'
import {
  Users,
  Mail,
  UserPlus,
  ArrowRight,
  ShieldCheck,
  Shield,
  User,
  Eye,
  AlertTriangle,
  Clock,
  AlertCircle,
} from 'lucide-react'

export interface RecentMember {
  id: string
  fullName: string | null
  email: string
  role: string
  joinedAt: string
}

export interface RecentInvitation {
  id: string
  email: string
  role: string
  status: string
  sendFailed?: boolean
  expiresAt: string
}

interface DashboardTeamWidgetsProps {
  seatsUsed: number
  seatsMax: number
  isFreePlan: boolean
  recentMembers: RecentMember[]
  pendingCount: number
  recentInvitations: RecentInvitation[]
}

const ROLE_ICONS: Record<string, any> = {
  owner: ShieldCheck,
  admin: Shield,
  member: User,
  viewer: Eye,
}

export function DashboardTeamWidgets({
  seatsUsed,
  seatsMax,
  isFreePlan,
  recentMembers,
  pendingCount,
  recentInvitations,
}: DashboardTeamWidgetsProps) {
  const isSeatLimitReached = seatsUsed >= seatsMax

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6" data-testid="dashboard-team-widgets">
      {/* 1. Team Card (Prompt 44) */}
      <div
        data-testid="dashboard-team-card"
        className="rounded-2xl border border-border bg-card p-5 shadow-sm dark:shadow-xl flex flex-col justify-between space-y-4"
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-sky-500 dark:text-sky-400" />
              <h3 className="text-sm font-bold text-foreground">Team Members</h3>
            </div>
            <span
              data-testid="dashboard-seats-capacity"
              className="font-mono text-xs text-sky-600 dark:text-sky-400 font-bold bg-sky-500/10 px-2.5 py-0.5 rounded-full border border-sky-500/20"
            >
              {seatsUsed} of {seatsMax} seats used
            </span>
          </div>

          {/* Seat limit warning if on free plan */}
          {isFreePlan && isSeatLimitReached && (
            <div
              data-testid="seat-limit-warning"
              className="flex items-center justify-between gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-600 dark:text-amber-300"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500 dark:text-amber-400" />
                <span>Seat limit reached. Upgrade to add more.</span>
              </div>
              <Link
                href="/settings/billing"
                className="font-bold text-amber-700 dark:text-amber-200 hover:underline shrink-0"
              >
                Upgrade
              </Link>
            </div>
          )}

          {/* 3 Most Recent Members */}
          <div className="space-y-2 pt-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Recent Members
            </span>
            {recentMembers.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">No team members joined yet.</p>
            ) : (
              <div className="space-y-2">
                {recentMembers.map((member) => {
                  const RoleIcon = ROLE_ICONS[member.role] || User
                  return (
                    <div
                      key={member.id}
                      className="flex items-center justify-between rounded-xl border border-border/80 bg-slate-50/80 dark:bg-slate-950/60 p-2.5 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* intentional: avatar badge uses text-white on dark bg in dark mode, text-foreground in light mode */}
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800 font-bold text-foreground dark:text-slate-100 text-[11px] border border-slate-300 dark:border-slate-700">
                          {member.fullName
                            ? member.fullName.charAt(0).toUpperCase()
                            : member.email.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground truncate text-xs">
                            {member.fullName || member.email}
                          </p>
                          <p className="font-mono text-[10px] text-muted-foreground truncate">
                            {member.email}
                          </p>
                        </div>
                      </div>

                      <span className="inline-flex items-center gap-1 rounded bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-300 border border-slate-200 dark:border-slate-700/80 shrink-0">
                        <RoleIcon className="h-3 w-3 text-sky-500 dark:text-sky-400" />
                        {member.role}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Invite Teammate button */}
        <div className="pt-2 border-t border-border">
          {/* intentional: primary action button uses text-white on branded bg-sky-600 */}
          <Link
            href="/settings/team?action=invite"
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-sky-500 transition shadow-md shadow-sky-600/20"
          >
            <UserPlus className="h-4 w-4" />
            Invite teammate
          </Link>
        </div>
      </div>

      {/* 2. Pending Invitations Card (Prompt 44) */}
      <div
        data-testid="dashboard-invitations-card"
        className="rounded-2xl border border-border bg-card p-5 shadow-sm dark:shadow-xl flex flex-col justify-between space-y-4"
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-sky-500 dark:text-sky-400" />
              <h3 className="text-sm font-bold text-foreground">Pending Invitations</h3>
            </div>
            <span
              data-testid="dashboard-pending-count"
              className="font-mono text-xs text-foreground font-bold bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700"
            >
              {pendingCount} pending
            </span>
          </div>

          {/* 3 Most Recent Pending Invites */}
          <div className="space-y-2 pt-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Recent Dispatches
            </span>
            {recentInvitations.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                <p className="font-semibold text-foreground">No pending invitations.</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  All invited teammates have accepted or joined.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentInvitations.map((inv) => {
                  const isExpired = new Date(inv.expiresAt) < new Date()
                  return (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between rounded-xl border border-border/80 bg-slate-50/80 dark:bg-slate-950/60 p-2.5 text-xs"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-mono font-medium text-foreground text-xs truncate">
                          {inv.email}
                        </p>
                        <p className="text-[10px] text-muted-foreground capitalize">Role: {inv.role}</p>
                      </div>

                      <div className="shrink-0">
                        {inv.sendFailed ? (
                          <span className="inline-flex items-center gap-1 rounded bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-500 dark:text-rose-400 border border-rose-500/30">
                            <AlertCircle className="h-3 w-3" />
                            Send failed
                          </span>
                        ) : isExpired ? (
                          <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-500 dark:text-amber-400 border border-amber-500/30">
                            <Clock className="h-3 w-3" />
                            Expired
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded bg-sky-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-500 dark:text-sky-400 border border-sky-500/30">
                            <Clock className="h-3 w-3" />
                            Pending
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Link to Team Settings page */}
        <div className="pt-2 border-t border-border">
          <Link
            href="/settings/team"
            className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-border bg-slate-100 dark:bg-slate-800/80 px-4 py-2.5 text-xs font-bold text-foreground hover:bg-slate-200 dark:hover:bg-slate-800 transition"
          >
            <span>Manage all in Team Settings</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
