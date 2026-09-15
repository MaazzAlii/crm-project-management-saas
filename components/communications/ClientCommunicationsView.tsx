'use client'

import { useState } from 'react'
import { CommunicationItem } from '@/app/(dashboard)/clients/[id]/communications/actions'
import { LogCommunicationModal } from './LogCommunicationModal'
import { CommunicationThread } from './CommunicationThread'
import { Plus, MessageSquare, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface ClientCommunicationsViewProps {
  client: {
    id: string
    name: string
    company?: string | null
    email?: string | null
    phone?: string | null
    communication_mode?: string
  }
  initialCommunications: CommunicationItem[]
  showBackLink?: boolean
}

export function ClientCommunicationsView({
  client,
  initialCommunications,
  showBackLink = false,
}: ClientCommunicationsViewProps) {
  const [communications, setCommunications] = useState<CommunicationItem[]>(initialCommunications)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleRefresh = async () => {
    // Re-fetch client communications dynamically
    try {
      const { fetchClientCommunicationsAction } = await import(
        '@/app/(dashboard)/clients/[id]/communications/actions'
      )
      const data = await fetchClientCommunicationsAction(client.id)
      setCommunications(data)
    } catch (e) {
      console.error('Failed to refresh communications:', e)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header / Actions Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
        <div>
          {showBackLink && (
            <Link
              href={`/clients/${client.id}`}
              className="inline-flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 font-semibold mb-2 transition"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Client Profile
            </Link>
          )}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Client Communication Log</h2>
              <p className="text-xs text-slate-400">
                Unified messaging history for <span className="font-semibold text-slate-200">{client.name}</span>
                {client.company && ` (${client.company})`}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold shadow-lg shadow-sky-500/20 transition shrink-0"
        >
          <Plus className="h-4 w-4" />
          Log Communication
        </button>
      </div>

      {/* Main Thread */}
      <CommunicationThread
        communications={communications}
        communicationMode={client.communication_mode || 'manual'}
      />

      {/* Log Modal */}
      <LogCommunicationModal
        clientId={client.id}
        clientName={client.name}
        clientEmail={client.email}
        clientPhone={client.phone}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleRefresh}
      />
    </div>
  )
}
