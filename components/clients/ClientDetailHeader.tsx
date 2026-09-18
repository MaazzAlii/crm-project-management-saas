'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ClientRecord } from '@/components/clients/ClientsList'
import { CommunicationModeBadge } from '@/components/clients/CommunicationModeBadge'
import { CommunicationModeSwitchModal } from '@/components/clients/CommunicationModeSwitchModal'
import { TagBadge } from '@/components/clients/TagBadge'
import { ClientEditModal } from '@/components/clients/ClientEditModal'
import { deleteClientAction } from '@/app/(dashboard)/clients/actions'
import {
  ArrowLeft,
  Edit,
  Trash2,
  Building2,
  Mail,
  Phone,
  AlertTriangle,
  Loader2,
  CheckCircle2,
} from 'lucide-react'

interface ClientDetailHeaderProps {
  client: ClientRecord
  userRole?: string | null
  isSuperAdmin?: boolean
}

export function ClientDetailHeader({ client, userRole, isSuperAdmin }: ClientDetailHeaderProps) {
  const router = useRouter()
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isSwitchModalOpen, setIsSwitchModalOpen] = useState(false)
  const [currentMode, setCurrentMode] = useState(client.communication_mode || 'manual')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const canDelete = userRole === 'owner' || userRole === 'admin' || isSuperAdmin

  async function handleDelete() {
    setDeleting(true)
    setDeleteError(null)

    const res = await deleteClientAction(client.id)
    if (res.error) {
      setDeleteError(res.error)
      setDeleting(false)
      return
    }

    setDeleting(false)
    setIsDeleteOpen(false)
    router.push('/clients')
    router.refresh()
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      case 'lead':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      case 'churned':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20'
      case 'archived':
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20'
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20'
    }
  }

  return (
    <>
      <div className="flex flex-col gap-4 border-b border-slate-800/80 pb-6">
        {/* Back Link */}
        <div>
          <Link
            href="/clients"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-sky-400 transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Clients Directory</span>
          </Link>
        </div>

        {/* Client Title Bar & Actions */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center flex-wrap gap-2.5">
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                {client.name}
              </h1>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadge(
                  client.status
                )}`}
              >
                {client.status.toUpperCase()}
              </span>
              <CommunicationModeBadge
                mode={currentMode}
                onUpgrade={currentMode === 'manual' ? () => setIsSwitchModalOpen(true) : undefined}
              />
              {client.tags && client.tags.map((tag) => (
                <TagBadge key={tag} name={tag} size="md" />
              ))}
            </div>

            <div className="flex items-center flex-wrap gap-4 text-xs text-slate-400">
              {client.company && (
                <div className="flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-slate-500" />
                  <span>{client.company}</span>
                </div>
              )}
              {client.email && (
                <div className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-slate-500" />
                  <span>{client.email}</span>
                </div>
              )}
              {client.phone && (
                <div className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-slate-500" />
                  <span>{client.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 hover:border-slate-700 transition"
            >
              <Edit className="h-3.5 w-3.5 text-sky-400" />
              <span>Edit Profile</span>
            </button>

            {canDelete && (
              <button
                onClick={() => setIsDeleteOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 transition"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <ClientEditModal
        client={client}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
      />

      {/* Delete Confirmation Modal */}
      {isDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-rose-500/30 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 border border-rose-500/20">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Delete Client Record?</h3>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-white">{client.name}</strong>?
              This will remove all client metadata and history for this tenant.
            </p>

            {deleteError && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsDeleteOpen(false)}
                className="rounded-xl border border-slate-800 px-4 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-500 transition disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    <span>Confirm Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Switch Mode Confirmation Modal */}
      <CommunicationModeSwitchModal
        isOpen={isSwitchModalOpen}
        onClose={() => setIsSwitchModalOpen(false)}
        clientId={client.id}
        clientName={client.name}
        clientEmail={client.email}
        clientPhone={client.phone}
        onSuccess={() => setCurrentMode('connected')}
      />
    </>
  )
}
