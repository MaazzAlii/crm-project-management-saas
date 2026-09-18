'use client'

import { useState } from 'react'
import { CommunicationItem } from '@/app/(dashboard)/clients/[id]/communications/actions'
import { LogCommunicationModal } from './LogCommunicationModal'
import { CommunicationThread } from './CommunicationThread'
import { Plus, MessageSquare, ArrowLeft, Sparkles, Loader2 } from 'lucide-react'
import {
  extractTasksFromThreadAction,
  TaskCandidateProject,
  TaskCandidateAssignee,
} from '@/app/(dashboard)/inbox/actions'
import { ExtractedTaskSuggestion } from '@/lib/ai/prompts/task-extraction'
import { TaskExtractionModal } from '@/components/inbox/TaskExtractionModal'
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
  aiEnabled?: boolean
  showBackLink?: boolean
}

export function ClientCommunicationsView({
  client,
  initialCommunications,
  aiEnabled = false,
  showBackLink = false,
}: ClientCommunicationsViewProps) {
  const [communications, setCommunications] = useState<CommunicationItem[]>(initialCommunications)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Task Extraction State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractedTasks, setExtractedTasks] = useState<ExtractedTaskSuggestion[]>([])
  const [taskProjects, setTaskProjects] = useState<TaskCandidateProject[]>([])
  const [taskTeamMembers, setTaskTeamMembers] = useState<TaskCandidateAssignee[]>([])
  const [taskError, setTaskError] = useState<string | null>(null)
  const [analyzedSnippet, setAnalyzedSnippet] = useState('')

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

  const handleExtractTasks = async () => {
    if (communications.length === 0) return

    const actionableText = communications
      .slice(0, 5)
      .map((m) => `${m.sender_name || 'Sender'}: ${m.body}`)
      .join('\n')

    const primarySnippet = communications[0]?.body || ''
    setAnalyzedSnippet(primarySnippet)
    setIsTaskModalOpen(true)
    setIsExtracting(true)
    setTaskError(null)

    try {
      const res = await extractTasksFromThreadAction({
        messageBody: actionableText,
        senderName: client.name,
        clientId: client.id,
        clientName: client.name,
        channel: communications[0]?.channel_type || 'communication',
        messageId: communications[0]?.id,
      })

      if (res.success) {
        setExtractedTasks(res.tasks)
        setTaskProjects(res.projects)
        setTaskTeamMembers(res.teamMembers)
      } else {
        setTaskError(res.error || 'Failed to extract tasks.')
        setTaskProjects(res.projects || [])
        setTaskTeamMembers(res.teamMembers || [])
      }
    } catch (err: any) {
      setTaskError(err.message || 'Failed to extract tasks.')
    } finally {
      setIsExtracting(false)
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

        <div className="flex items-center gap-3 shrink-0">
          {aiEnabled && (
            <button
              onClick={handleExtractTasks}
              disabled={isExtracting || communications.length === 0}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 font-bold transition disabled:opacity-50 text-sm"
              title="Extract actionable project tasks from client communications"
            >
              {isExtracting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              <span>Extract Tasks</span>
            </button>
          )}

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold shadow-lg shadow-sky-500/20 transition shrink-0 text-sm"
          >
            <Plus className="h-4 w-4" />
            Log Communication
          </button>
        </div>
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

      {/* AI Task Extraction Modal */}
      <TaskExtractionModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        tasks={extractedTasks}
        projects={taskProjects}
        teamMembers={taskTeamMembers}
        messageSnippet={analyzedSnippet}
        clientName={client.name}
        senderName={client.name}
        clientId={client.id}
        isLoading={isExtracting}
        error={taskError}
      />
    </div>
  )
}
