'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
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
  X,
  Clock,
  Activity,
  Calendar,
  Phone,
} from 'lucide-react'
import { updateMemberRole, removeMember } from '@/lib/team/actions'
import { InviteMemberDialog } from './InviteMemberDialog'
import { PendingInvitationsList } from './PendingInvitationsList'

export interface MemberItem {
  id: string
  userId: string
  role: 'owner' | 'admin' | 'member' | 'viewer' | 'billing_manager'
  joinedAt: string
  isActive?: boolean
  lastLoginAt?: string | null
  phone?: string | null
  invitedByName?: string | null
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

export function formatRelativeTime(dateString: string | null | undefined): string {
  if (!dateString) return 'Never'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return 'Never'

  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 0 || diffInSeconds < 60) return 'Just now'

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours}h ago`

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays === 1) return 'Yesterday'
  if (diffInDays < 30) return `${diffInDays}d ago`

  const diffInMonths = Math.floor(diffInDays / 30)
  if (diffInMonths < 12) return `${diffInMonths}mo ago`

  const diffInYears = Math.floor(diffInDays / 365)
  return `${diffInYears}y ago`
}

export function getMemberStatus(member: MemberItem): {
  label: 'Active' | 'Suspended'
  badgeStyle: string
  supplementaryNote?: string
} {
  const isActive = member.isActive !== false
  if (!isActive) {
    return {
      label: 'Suspended',
      badgeStyle: 'bg-muted text-muted-foreground border-border',
    }
  }

  const lastLogin = member.lastLoginAt ? new Date(member.lastLoginAt).getTime() : 0
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000

  if (lastLogin > 0 && lastLogin >= thirtyDaysAgo) {
    return {
      label: 'Active',
      badgeStyle: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/20',
    }
  }

  return {
    label: 'Active',
    badgeStyle: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/20',
    supplementaryNote: member.lastLoginAt ? 'Inactive >30d' : 'No login yet',
  }
}

const ROLE_LABELS: Record<string, { label: string; badge: string; icon: any }> = {
  owner: {
    label: 'Owner',
    badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20', // intentional: role status badge
    icon: ShieldCheck,
  },
  admin: {
    label: 'Admin',
    badge: 'bg-sky-500/10 text-sky-400 border-sky-500/20', // intentional: role status badge
    icon: Shield,
  },
  member: {
    label: 'Member',
    badge: 'bg-muted text-muted-foreground border-border',
    icon: User,
  },
  viewer: {
    label: 'Viewer',
    badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', // intentional: role status badge
    icon: Eye,
  },
  billing_manager: {
    label: 'Billing Manager',
    badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20', // intentional: role status badge
    icon: CreditCard,
  },
}

function MemberProfileModal({
  member,
  isOpen,
  onClose,
  triggerRef,
}: {
  member: MemberItem | null
  isOpen: boolean
  onClose: () => void
  triggerRef?: React.RefObject<HTMLElement | null>
}) {
  const modalRef = useRef<HTMLDivElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = (document.activeElement as HTMLElement) || triggerRef?.current || null
    }
  }, [isOpen, triggerRef])

  useEffect(() => {
    if (!isOpen || !member) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (focusableElements.length === 0) return

        const firstElement = focusableElements[0]
        const lastElement = focusableElements[focusableElements.length - 1]

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault()
            lastElement.focus()
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault()
            firstElement.focus()
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    // Initial focus on the close button
    const timer = setTimeout(() => {
      const firstBtn = modalRef.current?.querySelector<HTMLElement>('button')
      firstBtn?.focus()
    }, 50)

    const triggerEl = triggerRef?.current
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      clearTimeout(timer)
      if (triggerEl) {
        triggerEl.focus()
      } else if (previousActiveElement.current) {
        previousActiveElement.current.focus()
      }
    }
  }, [isOpen, member, onClose, triggerRef])

  if (!isOpen || !member) return null

  const status = getMemberStatus(member)
  const RoleIcon = ROLE_LABELS[member.role]?.icon || User

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="member-profile-modal-title"
        data-testid="member-profile-modal"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-6 text-foreground animate-in zoom-in-95 duration-200"
      >
        {/* Header with Avatar and Close */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary font-bold text-xl border border-primary/20 shrink-0 overflow-hidden">
              {member.profile.avatarUrl ? (
                <Image
                  src={member.profile.avatarUrl}
                  alt={member.profile.fullName || member.profile.email}
                  width={56}
                  height={56}
                  unoptimized
                  className="h-full w-full object-cover"
                />
              ) : member.profile.fullName ? (
                member.profile.fullName.slice(0, 2).toUpperCase()
              ) : (
                member.profile.email.slice(0, 2).toUpperCase()
              )}
            </div>
            <div>
              <h3 id="member-profile-modal-title" className="text-lg font-bold text-foreground">
                {member.profile.fullName || 'Team Member'}
              </h3>
              <p className="text-xs text-muted-foreground font-mono">{member.profile.email}</p>
            </div>
          </div>
          <button
            type="button"
            data-testid="close-profile-modal-btn"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
            aria-label="Close profile modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Details Grid */}
        <div className="space-y-3.5 divide-y divide-border/60 text-xs">
          {/* Role */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-muted-foreground font-medium flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-primary" />
              Workspace Role
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-md px-2.5 py-0.5 text-xs font-semibold border ${
                ROLE_LABELS[member.role]?.badge
              }`}
            >
              <RoleIcon className="h-3 w-3" />
              {ROLE_LABELS[member.role]?.label || member.role}
            </span>
          </div>

          {/* Account Status */}
          <div className="flex items-center justify-between pt-3">
            <span className="text-muted-foreground font-medium flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-primary" />
              Account Status
            </span>
            <div className="flex items-center gap-1.5">
              <span
                data-testid="modal-status-badge"
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${status.badgeStyle}`}
              >
                {status.label}
              </span>
              {status.supplementaryNote && (
                <span className="text-[10px] text-muted-foreground font-mono">({status.supplementaryNote})</span>
              )}
            </div>
          </div>

          {/* Last Active */}
          <div className="flex items-center justify-between pt-3">
            <span className="text-muted-foreground font-medium flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-primary" />
              Last Active
            </span>
            <span data-testid="modal-last-active" className="font-semibold text-foreground">
              {formatRelativeTime(member.lastLoginAt)}
            </span>
          </div>

          {/* Member Since */}
          <div className="flex items-center justify-between pt-3">
            <span className="text-muted-foreground font-medium flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              Member Since
            </span>
            <span data-testid="modal-joined-at" className="font-mono text-foreground">
              {new Date(member.joinedAt).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>

          {/* Phone */}
          <div className="flex items-center justify-between pt-3">
            <span className="text-muted-foreground font-medium flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-primary" />
              Phone Number
            </span>
            <span data-testid="modal-phone" className="font-mono text-foreground">
              {member.phone || 'Not provided'}
            </span>
          </div>

          {/* Invited By */}
          <div className="flex items-center justify-between pt-3">
            <span className="text-muted-foreground font-medium flex items-center gap-1.5">
              <UserPlus className="h-3.5 w-3.5 text-primary" />
              Invited By
            </span>
            <span data-testid="modal-invited-by" className="text-foreground">
              {member.invitedByName || 'Direct / Platform Admin'}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            data-testid="modal-close-footer-btn"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-border bg-muted/60 text-foreground text-xs font-semibold hover:bg-muted transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
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

  // Profile Modal State (Bug #14 & #15)
  const [profileModalMember, setProfileModalMember] = useState<MemberItem | null>(null)
  const profileTriggerRef = useRef<HTMLElement | null>(null)

  const openMemberProfile = (member: MemberItem, e?: React.MouseEvent<HTMLElement>) => {
    if (e?.currentTarget) {
      profileTriggerRef.current = e.currentTarget
    }
    setProfileModalMember(member)
  }

  const closeMemberProfile = () => {
    setProfileModalMember(null)
  }

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
      return member.role === 'member' || member.role === 'viewer' || member.role === 'billing_manager'
    }
    return false
  }

  // Permissions helper for member removal
  const canRemoveMember = (member: MemberItem) => {
    if (member.userId === currentUserId) return false
    if (member.role === 'owner') return false
    if (isOwner) return true
    if (isAdmin) {
      return member.role === 'member' || member.role === 'viewer' || member.role === 'billing_manager'
    }
    return false
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-foreground flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Organization Team Members ({members.length})
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage your team, invite new members, and assign role permissions.
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 transition cursor-pointer"
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
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' // intentional: success feedback toast
              : 'border-rose-500/30 bg-rose-500/10 text-rose-300' // intentional: error feedback toast
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
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600/30 border border-emerald-500/40 px-2.5 py-1 text-[11px] font-bold text-emerald-200 hover:bg-emerald-600/50 transition cursor-pointer shrink-0" // intentional: copy feedback button
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Link Copied!' : 'Copy Invite Link'}
            </button>
          )}
        </div>
      )}

      {/* Single Member Empty Encouragement */}
      {members.length === 1 && (
        <div className="rounded-2xl border border-primary/20 bg-card p-5 space-y-3">
          <div className="flex items-center gap-2.5 text-primary font-bold text-xs">
            <UserPlus className="h-4 w-4" />
            Build your team
          </div>
          <p className="text-xs text-muted-foreground">
            You are currently the only member in this workspace. Invite collaborators, project managers, or billing contacts to get started.
          </p>
        </div>
      )}

      {/* Desktop Table View */}
      <div className="hidden sm:block overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-border bg-muted/40 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-5 py-3.5">Member</th>
              <th className="px-5 py-3.5">Role</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5">Last Active</th>
              <th className="px-5 py-3.5">Joined</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {members.map((member) => {
              const RoleIcon = ROLE_LABELS[member.role]?.icon || User
              const isCurrentUser = member.userId === currentUserId
              const editable = canEditMemberRole(member)
              const removable = canRemoveMember(member)
              const status = getMemberStatus(member)

              return (
                <tr key={member.id} className="hover:bg-muted/40 transition">
                  {/* Name & Email (Clickable for Profile Modal - Bug #14) */}
                  <td className="px-5 py-4">
                    <button
                      type="button"
                      data-testid={`member-row-btn-${member.userId}`}
                      onClick={(e) => openMemberProfile(member, e)}
                      className="flex items-center gap-3 text-left group cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary rounded-xl p-1 -m-1 transition"
                      title="View member profile"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs border border-primary/20 shrink-0 overflow-hidden">
                        {member.profile.avatarUrl ? (
                          <Image
                            src={member.profile.avatarUrl}
                            alt={member.profile.fullName || member.profile.email}
                            width={36}
                            height={36}
                            unoptimized
                            className="h-full w-full object-cover"
                          />
                        ) : member.profile.fullName ? (
                          member.profile.fullName.charAt(0).toUpperCase()
                        ) : (
                          member.profile.email.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-foreground flex items-center gap-2 group-hover:text-primary transition">
                          <span>{member.profile.fullName || 'Team Member'}</span>
                          {isCurrentUser && (
                            <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[10px] font-mono text-primary border border-primary/30">
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground font-mono">{member.profile.email}</div>
                      </div>
                    </button>
                  </td>

                  {/* Role Selector / Badge (Prompt 36) */}
                  <td className="px-5 py-4">
                    {editable ? (
                      <select
                        data-testid={`role-select-${member.userId}`}
                        disabled={updatingRoleMemberId === member.id}
                        value={member.role}
                        onChange={(e) =>
                          handleRoleChange(
                            member.id,
                            e.target.value as 'owner' | 'admin' | 'member' | 'viewer' | 'billing_manager'
                          )
                        }
                        className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-semibold text-foreground focus:border-primary focus:outline-none disabled:opacity-50"
                      >
                        {isOwner && (
                          <option value="admin" data-testid="role-option-admin">
                            Admin
                          </option>
                        )}
                        <option value="member">Member</option>
                        <option value="viewer">Viewer</option>
                        <option value="billing_manager">Billing Manager</option>
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

                  {/* Status Badge (Bug #15) */}
                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-0.5">
                      <span
                        data-testid={`member-status-badge-${member.userId}`}
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border w-fit ${status.badgeStyle}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            member.isActive !== false ? 'bg-emerald-500' : 'bg-muted-foreground'
                          }`}
                        />
                        {status.label}
                      </span>
                      {status.supplementaryNote && (
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {status.supplementaryNote}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Last Active (Bug #15) */}
                  <td className="px-5 py-4 text-muted-foreground text-[11px]">
                    <span data-testid={`member-last-active-${member.userId}`}>
                      {formatRelativeTime(member.lastLoginAt)}
                    </span>
                  </td>

                  {/* Joined Date */}
                  <td className="px-5 py-4 text-muted-foreground font-mono text-[11px]">
                    {new Date(member.joinedAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>

                  {/* Actions (Prompt 36 & TEAM-3 Hardening) */}
                  <td className="px-5 py-4 text-right">
                    {member.role === 'owner' ? (
                      <button
                        data-testid={`remove-member-${member.userId}`}
                        disabled
                        title="The owner cannot be removed. Transfer ownership first."
                        className="rounded-lg p-2 text-muted-foreground/40 cursor-not-allowed opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    ) : removable ? (
                      <button
                        data-testid={`remove-member-${member.userId}`}
                        onClick={() => setMemberToRemove(member)}
                        title="Remove member"
                        className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    ) : null}
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
          const status = getMemberStatus(member)

          return (
            <div key={member.id} className="rounded-xl border border-border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  data-testid={`mobile-member-btn-${member.userId}`}
                  onClick={(e) => openMemberProfile(member, e)}
                  className="flex items-center gap-2.5 text-left cursor-pointer group focus:outline-hidden"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs border border-primary/20 shrink-0 overflow-hidden">
                    {member.profile.avatarUrl ? (
                      <Image
                        src={member.profile.avatarUrl}
                        alt={member.profile.fullName || member.profile.email}
                        width={32}
                        height={32}
                        unoptimized
                        className="h-full w-full object-cover"
                      />
                    ) : member.profile.fullName ? (
                      member.profile.fullName.charAt(0).toUpperCase()
                    ) : (
                      member.profile.email.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-foreground text-xs flex items-center gap-1.5 group-hover:text-primary transition">
                      {member.profile.fullName || 'Team Member'}
                      {isCurrentUser && <span className="text-[10px] text-primary">(You)</span>}
                    </div>
                    <div className="text-[10px] text-muted-foreground font-mono">{member.profile.email}</div>
                  </div>
                </button>

                {member.role === 'owner' ? (
                  <button
                    disabled
                    title="The owner cannot be removed. Transfer ownership first."
                    className="p-1 text-muted-foreground/40 cursor-not-allowed opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                ) : removable ? (
                  <button
                    onClick={() => setMemberToRemove(member)}
                    className="p-1 text-muted-foreground hover:text-destructive cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                ) : null}
              </div>

              {/* Status & Last Active Row (Bug #15) */}
              <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
                <span className="text-[11px] text-muted-foreground">Status:</span>
                <div className="flex items-center gap-1.5">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border ${status.badgeStyle}`}>
                    {status.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    • {formatRelativeTime(member.lastLoginAt)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-[11px] text-muted-foreground">Role:</span>
                {editable ? (
                  <select
                    value={member.role}
                    onChange={(e) =>
                      handleRoleChange(
                        member.id,
                        e.target.value as 'owner' | 'admin' | 'member' | 'viewer' | 'billing_manager'
                      )
                    }
                    className="rounded-lg border border-border bg-background px-2 py-1 text-xs text-foreground focus:border-primary focus:outline-none"
                  >
                    {isOwner && <option value="admin">Admin</option>}
                    <option value="member">Member</option>
                    <option value="viewer">Viewer</option>
                    <option value="billing_manager">Billing Manager</option>
                  </select>
                ) : (
                  <span className="text-xs font-semibold text-primary uppercase font-mono">
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
        onSuccess={(invitation, inviteLink, summaryMessage) => {
          const emailTarget = invitation?.email || 'team member'
          setMessage({
            type: 'success',
            text: summaryMessage || `Invitation sent successfully to ${emailTarget}!`,
          })
          if (inviteLink && invitation?.id) {
            setCopiedLink(inviteLink)
            setRecentInviteLink({ id: invitation.id, link: inviteLink })
          }
          setPendingRefreshTrigger((prev) => prev + 1)
          router.refresh()
        }}
      />

      {/* Remove Member Confirmation Modal (Prompt 36) */}
      {memberToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-overlay)] p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-destructive/30 bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-destructive">
              <AlertTriangle className="h-6 w-6 shrink-0" />
              <h3 className="text-base font-bold text-foreground">Remove Team Member?</h3>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to remove{' '}
              <span className="font-semibold text-foreground font-mono">{memberToRemove.profile.email}</span> from
              this workspace? They will lose access to all tenant resources immediately.
            </p>

            <div className="flex justify-end gap-3 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setMemberToRemove(null)}
                className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={removing}
                onClick={handleRemoveConfirm}
                className="inline-flex items-center gap-2 rounded-xl bg-destructive px-4 py-2 text-xs font-bold text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
              >
                {removing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Confirm Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Member Profile Modal (Prompt 35 / Bug #14 & #15) */}
      <MemberProfileModal
        member={profileModalMember}
        isOpen={Boolean(profileModalMember)}
        onClose={closeMemberProfile}
        triggerRef={profileTriggerRef}
      />
    </div>
  )
}
