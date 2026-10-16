'use client'

import { useState, useTransition } from 'react'
import {
  UserCog,
  X,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Power,
  Loader2,
  ShieldAlert,
} from 'lucide-react'
import {
  updateSuperAdminUserAction,
  toggleSuperAdminUserActiveAction,
  deleteSuperAdminUserAction,
} from '@/app/super-admin/user-actions'

export interface UserManagementUser {
  id: string
  fullName: string
  email: string
  isActive: boolean
  role: string
  orgId: string
  orgName: string
}

interface UserManagementModalProps {
  user: UserManagementUser
}

export function UserManagementModal({ user }: UserManagementModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [tab, setTab] = useState<'edit' | 'delete'>('edit')

  // Edit form state
  const [fullName, setFullName] = useState(user.fullName)
  const [email, setEmail] = useState(user.email)
  const [isActive, setIsActive] = useState(user.isActive)

  // Delete form state
  const [confirmEmail, setConfirmEmail] = useState('')

  // UI state
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const resetState = () => {
    setFullName(user.fullName)
    setEmail(user.email)
    setIsActive(user.isActive)
    setConfirmEmail('')
    setError(null)
    setSuccess(null)
    setTab('edit')
  }

  const handleOpen = () => {
    resetState()
    setIsOpen(true)
  }

  const handleClose = () => {
    setIsOpen(false)
    resetState()
  }

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    startTransition(async () => {
      const res = await updateSuperAdminUserAction(user.id, {
        fullName,
        email,
      })

      if (!res.success) {
        setError(res.error || 'Failed to update user profile')
      } else {
        setSuccess('User profile updated successfully')
      }
    })
  }

  const handleToggleStatus = () => {
    setError(null)
    setSuccess(null)

    startTransition(async () => {
      const nextActive = !isActive
      const res = await toggleSuperAdminUserActiveAction(user.id, nextActive)

      if (!res.success) {
        setError(res.error || 'Failed to toggle user status')
      } else {
        setIsActive(nextActive)
        setSuccess(
          nextActive
            ? 'User account reactivated successfully'
            : 'User account deactivated (sessions revoked)'
        )
      }
    })
  }

  const handleDeleteUser = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    startTransition(async () => {
      const res = await deleteSuperAdminUserAction(user.id, confirmEmail)

      if (!res.success) {
        setError(res.error || 'Failed to delete user account')
      } else {
        setSuccess('User account permanently deleted')
        setTimeout(() => {
          handleClose()
        }, 1200)
      }
    })
  }

  return (
    <>
      <button
        onClick={handleOpen}
        data-testid={`manage-user-btn-${user.id}`}
        className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground shadow-xs hover:bg-muted/80 transition-colors"
      >
        <UserCog className="h-3.5 w-3.5 text-primary" />
        Manage
      </button>

      {isOpen && (
        <div
          data-testid="user-management-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-overlay)] p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-md text-foreground animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2.5">
                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                  <UserCog className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">User Management</h3>
                  <p className="text-xs text-muted-foreground">
                    Super-admin controls for{' '}
                    <strong className="text-foreground">{user.email}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Tab navigation */}
            <div className="mt-4 flex border-b border-border text-xs">
              <button
                onClick={() => {
                  setTab('edit')
                  setError(null)
                }}
                className={`px-3 py-2 font-medium transition-colors border-b-2 -mb-px ${
                  tab === 'edit'
                    ? 'border-primary text-primary font-semibold'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Profile & Status
              </button>
              <button
                onClick={() => {
                  setTab('delete')
                  setError(null)
                }}
                className={`px-3 py-2 font-medium transition-colors border-b-2 -mb-px ${
                  tab === 'delete'
                    ? 'border-destructive text-destructive font-semibold'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Delete Account
              </button>
            </div>

            {/* Error & Success Feedback */}
            {error && (
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{success}</span>
              </div>
            )}

            {/* Tab 1: Edit Profile & Status */}
            {tab === 'edit' && (
              <div className="mt-4 space-y-5 text-xs">
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <label className="block font-semibold text-foreground mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      placeholder="Jane Doe"
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-foreground mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="user@example.com"
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none font-mono"
                    />
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={isPending}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-xs"
                    >
                      {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      Save Profile Changes
                    </button>
                  </div>
                </form>

                {/* Account Status / Soft Delete Toggle */}
                <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-foreground flex items-center gap-1.5">
                        <Power className="h-3.5 w-3.5 text-muted-foreground" />
                        Account Status
                      </h4>
                      <p className="text-muted-foreground mt-0.5">
                        {isActive
                          ? 'User is active and able to sign in.'
                          : 'User account is deactivated. Sign-in and active sessions are revoked.'}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold border ${
                        isActive
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                      }`}
                    >
                      {isActive ? 'Active' : 'Deactivated'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleToggleStatus}
                    disabled={isPending}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold border shadow-xs transition-colors ${
                      isActive
                        ? 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20'
                        : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20'
                    }`}
                  >
                    {isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                    {isActive ? 'Deactivate User (Soft Delete)' : 'Reactivate User Account'}
                  </button>
                </div>
              </div>
            )}

            {/* Tab 2: Delete Account (Hard Delete with Guardrails) */}
            {tab === 'delete' && (
              <form onSubmit={handleDeleteUser} className="mt-4 space-y-4 text-xs">
                <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3.5 space-y-2 text-destructive">
                  <div className="flex items-center gap-2 font-semibold">
                    <ShieldAlert className="h-4 w-4 shrink-0" />
                    <span>Permanent Account Deletion</span>
                  </div>
                  <p className="text-xs leading-relaxed opacity-90">
                    This action is permanent and cannot be undone. All membership associations,
                    tokens, and user profiles will be erased from the system.
                  </p>
                  <p className="text-xs font-medium">
                    Guardrail: Deletion is blocked if this user is currently an owner or admin of
                    any organization.
                  </p>
                </div>

                <div>
                  <label className="block font-semibold text-foreground mb-1">
                    Type user email <span className="font-mono text-destructive">&apos;{user.email}&apos;</span> to
                    confirm:
                  </label>
                  <input
                    type="text"
                    value={confirmEmail}
                    onChange={(e) => setConfirmEmail(e.target.value)}
                    required
                    placeholder={user.email}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-destructive focus:outline-none font-mono"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setTab('edit')}
                    className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPending || confirmEmail.trim().toLowerCase() !== user.email.toLowerCase()}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-destructive px-3.5 py-1.5 text-xs font-semibold text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 transition-colors shadow-xs"
                  >
                    {isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                    Permanently Delete User
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
