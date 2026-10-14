'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Mail,
  RefreshCw,
  Trash2,
  Copy,
  Check,
  AlertTriangle,
  Loader2,
  Clock,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'

export interface PendingInvitation {
  id: string
  organization_id: string
  email: string
  role: 'admin' | 'member' | 'viewer'
  invited_by: string
  status: 'pending' | 'accepted' | 'revoked' | 'expired'
  token_expires_at: string
  send_failed?: boolean
  created_at: string
  updated_at: string
}

interface PendingInvitationsListProps {
  currentUserRole: string
  isSuperAdmin?: boolean
  recentInviteLink?: { id: string; link: string } | null
  refreshTrigger?: number
  onInviteRevoked?: () => void
}

export function PendingInvitationsList({
  currentUserRole,
  isSuperAdmin = false,
  recentInviteLink = null,
  refreshTrigger = 0,
  onInviteRevoked,
}: PendingInvitationsListProps) {
  const [invitations, setInvitations] = useState<PendingInvitation[]>([])
  const [loading, setLoading] = useState(true)
  const [resendingId, setResendingId] = useState<string | null>(null)
  const [invitationToRevoke, setInvitationToRevoke] = useState<PendingInvitation | null>(null)
  const [revoking, setRevoking] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const canManage =
    currentUserRole === 'owner' || currentUserRole === 'admin' || isSuperAdmin

  const fetchInvitations = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/invitations?status=pending', { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load pending invitations')
      const data = await res.json()
      const list = data.data?.invitations || data.invitations || []
      setInvitations(list)
    } catch {
      // Non-blocking error handling
      setInvitations([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchInvitations()
  }, [fetchInvitations, refreshTrigger])

  const handleResend = async (inv: PendingInvitation) => {
    try {
      setResendingId(inv.id)
      setFeedback(null)
      const res = await fetch(`/api/invitations/${inv.id}/resend`, {
        method: 'POST',
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || data.message || 'Failed to resend invitation')
      }
      setFeedback({
        type: 'success',
        text: `Invitation resent successfully to ${inv.email}`,
      })
      await fetchInvitations()
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.message || 'Error resending invitation',
      })
    } finally {
      setResendingId(null)
    }
  }

  const handleRevokeConfirm = async () => {
    if (!invitationToRevoke) return
    try {
      setRevoking(true)
      const res = await fetch(`/api/invitations/${invitationToRevoke.id}/revoke`, {
        method: 'POST',
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || data.message || 'Failed to revoke invitation')
      }
      setInvitations((prev) => prev.filter((i) => i.id !== invitationToRevoke.id))
      setFeedback({
        type: 'success',
        text: `Invitation for ${invitationToRevoke.email} revoked.`,
      })
      setInvitationToRevoke(null)
      if (onInviteRevoked) onInviteRevoked()
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.message || 'Failed to revoke invitation',
      })
    } finally {
      setRevoking(false)
    }
  }

  const handleCopyLink = (invId: string, link: string) => {
    navigator.clipboard.writeText(link)
    setCopiedId(invId)
    setTimeout(() => setCopiedId(null), 2500)
  }

  const getStatusBadge = (inv: PendingInvitation) => {
    const isExpired = new Date(inv.token_expires_at) < new Date()
    if (inv.send_failed) {
      return (
        <span
          data-testid="status-badge-send-failed"
          className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-400 border border-rose-500/30" // intentional: send-failed status badge
        >
          <AlertCircle className="h-3 w-3" />
          Send failed
        </span>
      )
    }
    if (isExpired) {
      return (
        <span
          data-testid="status-badge-expired"
          className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-400 border border-amber-500/30" // intentional: expired status badge
        >
          <Clock className="h-3 w-3" />
          Expired
        </span>
      )
    }
    return (
      <span
        data-testid="status-badge-pending"
        className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary border border-primary/30"
      >
        <Clock className="h-3 w-3" />
        Pending
      </span>
    )
  }

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr)
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    } catch {
      return isoStr
    }
  }

  return (
    <div className="space-y-4 pt-6 border-t border-border" data-testid="pending-invitations-list">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Mail className="h-4 w-4 text-primary" />
            Pending Invitations
          </h3>
          <p className="text-xs text-muted-foreground">
            Teammates invited to this workspace who have not yet accepted.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchInvitations}
          disabled={loading}
          title="Refresh pending invitations"
          className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Action Feedback Toast */}
      {feedback && (
        <div
          data-testid="pending-invite-toast"
          className={`flex items-center gap-2.5 rounded-xl border p-3 text-xs font-semibold ${
            feedback.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' // intentional: success feedback toast
              : 'border-rose-500/30 bg-rose-500/10 text-rose-300' // intentional: error feedback toast
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Content */}
      {loading && invitations.length === 0 ? (
        <div className="flex h-32 items-center justify-center rounded-2xl border border-border bg-card/50">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : invitations.length === 0 ? (
        <div
          data-testid="empty-pending-invitations"
          className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 p-8 text-center text-xs text-muted-foreground"
        >
          <Mail className="h-8 w-8 text-muted-foreground/60 mb-2" />
          <p className="font-semibold text-foreground">No pending invitations.</p>
          <p className="text-muted-foreground text-[11px] mt-0.5">
            When you invite teammates, their invitations will appear here until accepted.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs" data-testid="pending-invitations-table">
              <thead className="border-b border-border bg-muted/40 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3.5">Email</th>
                  <th className="px-5 py-3.5">Role</th>
                  <th className="px-5 py-3.5">Invited By</th>
                  <th className="px-5 py-3.5">Sent Date</th>
                  <th className="px-5 py-3.5">Expires</th>
                  <th className="px-5 py-3.5">Status</th>
                  {canManage && <th className="px-5 py-3.5 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {invitations.map((inv) => {
                  const hasLink = recentInviteLink && recentInviteLink.id === inv.id
                  return (
                    <tr
                      key={inv.id}
                      data-testid={`pending-invite-row-${inv.id}`}
                      className="hover:bg-muted/40 transition"
                    >
                      <td className="px-5 py-3.5 font-mono text-foreground font-medium">{inv.email}</td>
                      <td className="px-5 py-3.5">
                        <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border border-border">
                          {inv.role}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground font-mono text-[11px]">
                        {inv.invited_by ? inv.invited_by.slice(0, 8) + '...' : 'System'}
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground">{formatDate(inv.created_at)}</td>
                      <td className="px-5 py-3.5 text-muted-foreground">{formatDate(inv.token_expires_at)}</td>
                      <td className="px-5 py-3.5">{getStatusBadge(inv)}</td>
                      {canManage && (
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {hasLink && (
                              <button
                                type="button"
                                onClick={() => handleCopyLink(inv.id, recentInviteLink.link)}
                                title="Copy invite link"
                                className="inline-flex items-center gap-1 rounded-lg border border-primary/30 bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary hover:bg-primary/20 transition cursor-pointer"
                              >
                                {copiedId === inv.id ? (
                                  <Check className="h-3 w-3 text-emerald-400" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                                {copiedId === inv.id ? 'Copied' : 'Copy'}
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleResend(inv)}
                              disabled={resendingId === inv.id}
                              title="Resend invitation email"
                              className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted/80 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition disabled:opacity-50"
                            >
                              {resendingId === inv.id ? (
                                <Loader2 className="h-3 w-3 animate-spin text-primary" />
                              ) : (
                                <RefreshCw className="h-3 w-3" />
                              )}
                              Resend
                            </button>

                            <button
                              type="button"
                              onClick={() => setInvitationToRevoke(inv)}
                              title="Revoke invitation"
                              className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Revoke Confirmation Dialog */}
      {invitationToRevoke && (
        <div
          data-testid="revoke-invite-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-overlay)] p-4 backdrop-blur-sm animate-in fade-in"
        >
          <div className="w-full max-w-md rounded-2xl border border-destructive/30 bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-destructive">
              <AlertTriangle className="h-6 w-6 shrink-0" />
              <h3 className="text-base font-bold text-foreground">Revoke Invitation?</h3>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to revoke the invitation for{' '}
              <span className="font-semibold text-foreground font-mono">{invitationToRevoke.email}</span>?
              Their invitation link will be immediately invalidated and cannot be accepted.
            </p>

            <div className="flex justify-end gap-3 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setInvitationToRevoke(null)}
                className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={revoking}
                onClick={handleRevokeConfirm}
                className="inline-flex items-center gap-2 rounded-xl bg-destructive px-4 py-2 text-xs font-bold text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
              >
                {revoking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Confirm Revoke
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
