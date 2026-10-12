'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  User,
  CreditCard,
  Trash2,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Eye,
} from 'lucide-react'
import { updateMemberRole, removeMember } from '@/lib/team/actions'
import { InviteMemberDialog } from './InviteMemberDialog'
import { PendingInvitationsList } from './PendingInvitationsList'

export interface MemberItem {
  id: string
  userId: string
  role: 'owner' | 'admin' | 'member' | 'viewer' | 'billing_manager'
  joinedAt: string
  profile: {
    fullName: string | null
    email: string
    avatarUrl: string | null
  }
}

interface TeamMemberListProps {
  members: MemberItem[]
  currentUserId: string
  currentUserRole: string
  isSuperAdmin: boolean
}

const ROLE_LABELS: Record<string, { label: string; badge: string; icon: any }> = {
  owner: {
    label: 'Owner',
    badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    icon: ShieldCheck,
  },
  admin: {
    label: 'Admin',
    badge: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    icon: Shield,
  },
  member: {
    label: 'Member',
    badge: 'bg-slate-800 text-slate-300 border-slate-700',
    icon: User,
  },
  viewer: {
    label: 'Viewer',
    badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    icon: Eye,
  },
  billing_manager: {
    label: 'Billing Manager',
    badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    icon: CreditCard,
  },
}

export function TeamMemberList({ members, currentUserId, currentUserRole, isSuperAdmin }: TeamMemberListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isOwner = currentUserRole === 'owner' || isSuperAdmin
  const isAdmin = currentUserRole === 'admin'
  const canManage = isOwner || isAdmin

  // Modal States
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [recentInviteLink, setRecentInviteLink] = useState<{ id: string; link: string } | null>(null)
  const [copiedLink, setCopiedLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [pendingRefreshTrigger, setPendingRefreshTrigger] = useState(0)

  // Auto-open modal if navigated via Quick Action (?action=invite or ?invite=1)
  useEffect(() => {
    if (searchParams?.get('action') === 'invite' || searchParams?.get('invite') === '1') {
      setShowInviteModal(true)
    }
  }, [searchParams])

  // Remove Modal State
  const [memberToRemove, setMemberToRemove] = useState<MemberItem | null>(null)
  const [removing, setRemoving] = useState(false)

  // Feedback Banners
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [updatingRoleMemberId, setUpdatingRoleMemberId] = useState<string | null>(null)

  // Calculate Owner Count
  const ownerCount = members.filter((m) => m.role === 'owner').length

  // Action: Handle Role Change (Prompt 36)
  const handleRoleChange = async (memberId: string, newRole: 'owner' | 'admin' | 'member' | 'viewer' | 'billing_manager') => {
    if (!canManage) return

    const targetMember = members.find((m) => m.id === memberId)
    if (!targetMember) return

    if (targetMember.userId === currentUserId) {
      setMessage({ type: 'error', text: 'Cannot change your own role.' })
      return
    }

    if (isAdmin) {
      if (targetMember.role === 'owner' || targetMember.role === 'admin') {
        setMessage({ type: 'error', text: 'Admins cannot change owner or admin roles.' })
        return
      }
      if (newRole === 'owner' || newRole === 'admin') {
        setMessage({ type: 'error', text: 'Admins cannot promote members to admin or owner.' })
        return
      }
    }

    if (targetMember.role === 'owner' && newRole !== 'owner' && ownerCount <= 1) {
      setMessage({ type: 'error', text: 'Cannot demote the last owner of an organization.' })
      return
    }

    setUpdatingRoleMemberId(memberId)
    setMessage(null)

    try {
      const res = await updateMemberRole({ memberId, newRole })
      if (res.success) {
        setMessage({ type: 'success', text: 'Member role updated successfully.' })
        router.refresh()
      } else {
        setMessage({ type: 'error', text: res.error || 'Failed to update member role.' })
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Unexpected error.' })
    } finally {
      setUpdatingRoleMemberId(null)
    }
  }

  // Action: Handle Member Removal (Prompt 36)
  const handleRemoveConfirm = async () => {
    if (!memberToRemove || !canManage) return

    if (memberToRemove.role === 'owner') {
      setMessage({ type: 'error', text: 'Cannot remove the organization owner.' })
      setMemberToRemove(null)
      return
    }

    if (isAdmin && memberToRemove.role === 'admin') {
      setMessage({ type: 'error', text: 'Admins cannot remove other admins.' })
      setMemberToRemove(null)
      return
    }

    setRemoving(true)
    setMessage(null)

    try {
      const res = await removeMember({ memberId: memberToRemove.id })
      if (res.success) {
        setMessage({ type: 'success', text: 'Member removed from organization.' })
        setMemberToRemove(null)
        router.refresh()
      } else {
        setMessage({ type: 'error', text: res.error || 'Failed to remove member.' })
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Unexpected error.' })
    } finally {
      setRemoving(false)
    }
  }

  // Permissions helper for role editing
  const canEditMemberRole = (member: MemberItem) => {
    if (member.userId === currentUserId) return false
    if (isOwner) return true
    if (isAdmin) {
      return member.role === 'member' || member.role === 'viewer'
    }
    return false
  }

  // Permissions helper for member removal
  const canRemoveMember = (member: MemberItem) => {
    if (member.userId === currentUserId) return false
    if (member.role === 'owner') return false
    if (isOwner) return true
    if (isAdmin) {
      return member.role === 'member' || member.role === 'viewer'
    }
    return false
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-sky-400" />
            Organization Team Members ({members.length})
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage your team, invite new members, and assign role permissions.
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-sky-600/20 hover:bg-sky-500 transition cursor-pointer"
          >
            <UserPlus className="h-4 w-4" />
            Invite Member
          </button>
        )}
      </div>

      {/* Global Feedback Alert */}
      {message && (
        <div
          data-testid="invite-toast"
          className={`flex items-center justify-between gap-3 rounded-xl border p-4 text-xs font-semibold ${
            message.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
              : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {message.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>

          {copiedLink && (
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(copiedLink)
                setCopied(true)
                setTimeout(() => setCopied(false), 2500)
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600/30 border border-emerald-500/40 px-2.5 py-1 text-[11px] font-bold text-emerald-200 hover:bg-emerald-600/50 transition cursor-pointer shrink-0"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Link Copied!' : 'Copy Invite Link'}
            </button>
          )}
        </div>
      )}

      {/* Single Member Empty Encouragement */}
      {members.length === 1 && (
        <div className="rounded-2xl border border-sky-500/20 bg-gradient-to-r from-sky-950/40 via-slate-900 to-indigo-950/30 p-5 space-y-3">
          <div className="flex items-center gap-2.5 text-sky-400 font-bold text-xs">
            <UserPlus className="h-4 w-4" />
            Build your team
          </div>
          <p className="text-xs text-slate-300">
            You are currently the only member in this workspace. Invite collaborators, project managers, or billing contacts to get started.
          </p>
        </div>
      )}

      {/* Desktop Table View */}
      <div className="hidden sm:block overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <tr>
              <th className="px-5 py-3.5">Member</th>
              <th className="px-5 py-3.5">Role</th>
              <th className="px-5 py-3.5">Joined</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {members.map((member) => {
              const RoleIcon = ROLE_LABELS[member.role]?.icon || User
              const isCurrentUser = member.userId === currentUserId
              const editable = canEditMemberRole(member)
              const removable = canRemoveMember(member)

              return (
                <tr key={member.id} className="hover:bg-slate-800/40 transition">
                  {/* Name & Email */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 font-bold text-white text-xs border border-slate-700">
                        {member.profile.fullName
                          ? member.profile.fullName.charAt(0).toUpperCase()
                          : member.profile.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-white flex items-center gap-2">
                          {member.profile.fullName || 'Team Member'}
                          {isCurrentUser && (
                            <span className="rounded bg-sky-500/20 px-1.5 py-0.5 text-[10px] font-mono text-sky-400 border border-sky-500/30">
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">{member.profile.email}</div>
                      </div>
                    </div>
                  </td>

                  {/* Role Selector / Badge (Prompt 36) */}
                  <td className="px-5 py-4">
                    {editable ? (
                      <select
                        disabled={updatingRoleMemberId === member.id}
                        value={member.role}
                        onChange={(e) =>
                          handleRoleChange(
                            member.id,
                            e.target.value as 'owner' | 'admin' | 'member' | 'viewer' | 'billing_manager'
                          )
                        }
                        className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-xs font-semibold text-white focus:border-sky-500 focus:outline-none disabled:opacity-50"
                      >
                        {isOwner && <option value="admin">Admin</option>}
                        <option value="member">Member</option>
                        <option value="viewer">Viewer</option>
                        {isOwner && <option value="billing_manager">Billing Manager</option>}
                      </select>
                    ) : (
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold border ${
                          ROLE_LABELS[member.role]?.badge
                        }`}
                      >
                        <RoleIcon className="h-3.5 w-3.5" />
                        {ROLE_LABELS[member.role]?.label || member.role}
                      </span>
                    )}
                  </td>

                  {/* Joined Date */}
                  <td className="px-5 py-4 text-slate-400 font-mono text-[11px]">
                    {new Date(member.joinedAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>

                  {/* Actions (Prompt 36) */}
                  <td className="px-5 py-4 text-right">
                    {removable && (
                      <button
                        onClick={() => setMemberToRemove(member)}
                        title="Remove member"
                        className="rounded-lg p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List View */}
      <div className="grid grid-cols-1 gap-3 sm:hidden">
        {members.map((member) => {
          const isCurrentUser = member.userId === currentUserId
          const editable = canEditMemberRole(member)
          const removable = canRemoveMember(member)

          return (
            <div key={member.id} className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 font-bold text-white text-xs">
                    {member.profile.fullName
                      ? member.profile.fullName.charAt(0).toUpperCase()
                      : member.profile.email.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-white text-xs flex items-center gap-1.5">
                      {member.profile.fullName || 'Team Member'}
                      {isCurrentUser && <span className="text-[10px] text-sky-400">(You)</span>}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">{member.profile.email}</div>
                  </div>
                </div>

                {removable && (
                  <button
                    onClick={() => setMemberToRemove(member)}
                    className="p-1 text-slate-400 hover:text-rose-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <span className="text-[11px] text-slate-400">Role:</span>
                {editable ? (
                  <select
                    value={member.role}
                    onChange={(e) =>
                      handleRoleChange(
                        member.id,
                        e.target.value as 'owner' | 'admin' | 'member' | 'viewer' | 'billing_manager'
                      )
                    }
                    className="rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 text-xs text-white"
                  >
                    {isOwner && <option value="admin">Admin</option>}
                    <option value="member">Member</option>
                    <option value="viewer">Viewer</option>
                    {isOwner && <option value="billing_manager">Billing Manager</option>}
                  </select>
                ) : (
                  <span className="text-xs font-semibold text-sky-400 uppercase font-mono">
                    {ROLE_LABELS[member.role]?.label || member.role}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Pending Invitations Table (Prompt 35) */}
      <PendingInvitationsList
        currentUserRole={currentUserRole}
        isSuperAdmin={isSuperAdmin}
        recentInviteLink={recentInviteLink}
        refreshTrigger={pendingRefreshTrigger}
        onInviteRevoked={() => router.refresh()}
      />

      {/* Invite Member Dialog (Prompt 34) */}
      <InviteMemberDialog
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        currentUserRole={currentUserRole}
        onSuccess={(invitation, inviteLink) => {
          setMessage({
            type: 'success',
            text: `Invitation sent successfully to ${invitation.email}!`,
          })
          if (inviteLink) {
            setCopiedLink(inviteLink)
            setRecentInviteLink({ id: invitation.id, link: inviteLink })
          }
          setPendingRefreshTrigger((prev) => prev + 1)
          router.refresh()
        }}
      />

      {/* Remove Member Confirmation Modal (Prompt 36) */}
      {memberToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-rose-500/30 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="h-6 w-6 shrink-0" />
              <h3 className="text-base font-bold text-white">Remove Team Member?</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to remove{' '}
              <span className="font-semibold text-white font-mono">{memberToRemove.profile.email}</span> from
              this workspace? They will lose access to all tenant resources immediately.
            </p>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setMemberToRemove(null)}
                className="rounded-xl border border-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={removing}
                onClick={handleRemoveConfirm}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-500 disabled:opacity-50"
              >
                {removing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Confirm Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
