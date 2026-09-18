'use client'

import { useState } from 'react'
import {
  Sparkles,
  X,
  CheckCheck,
  AlertCircle,
  Loader2,
  CheckCircle2,
  MessageSquare,
} from 'lucide-react'
import { ExtractedTaskSuggestion } from '@/lib/ai/prompts/task-extraction'
import {
  TaskCandidateProject,
  TaskCandidateAssignee,
} from '@/app/(dashboard)/inbox/actions'
import { SuggestedTaskCard } from './SuggestedTaskCard'

interface TaskExtractionModalProps {
  isOpen: boolean
  onClose: () => void
  tasks: ExtractedTaskSuggestion[]
  projects: TaskCandidateProject[]
  teamMembers: TaskCandidateAssignee[]
  messageSnippet: string
  clientName?: string
  senderName?: string
  clientId?: string | null
  messageId?: string | null
  isLoading?: boolean
  error?: string | null
}

export function TaskExtractionModal({
  isOpen,
  onClose,
  tasks: initialTasks,
  projects,
  teamMembers,
  messageSnippet,
  clientName,
  senderName,
  clientId,
  messageId,
  isLoading = false,
  error = null,
}: TaskExtractionModalProps) {
  const [tasks, setTasks] = useState<ExtractedTaskSuggestion[]>(initialTasks)
  const [createdTaskIds, setCreatedTaskIds] = useState<string[]>([])

  // Keep state synced when initialTasks changes
  if (initialTasks !== tasks && !isLoading && initialTasks.length > 0 && tasks.length === 0) {
    setTasks(initialTasks)
  }

  if (!isOpen) return null

  const handleDismiss = (index: number) => {
    setTasks((prev) => prev.filter((_, i) => i !== index))
  }

  const handleCreated = (taskId: string) => {
    setCreatedTaskIds((prev) => [...prev, taskId])
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">AI Task Extraction</h3>
                {tasks.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {tasks.length} {tasks.length === 1 ? 'Task' : 'Tasks'} Detected
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Actionable deliverables detected from{' '}
                <span className="font-semibold text-slate-200">{senderName || clientName || 'client'}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content / Scroll Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Analyzed Message Box */}
          {messageSnippet && (
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                Source Communication
              </div>
              <p className="text-xs text-slate-300 leading-relaxed italic line-clamp-3">
                &ldquo;{messageSnippet}&rdquo;
              </p>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Sparkles className="w-6 h-6 animate-pulse" />
                </div>
                <Loader2 className="w-6 h-6 text-indigo-400 animate-spin absolute -top-1 -right-1" />
              </div>
              <div>
                <h4 className="font-semibold text-white text-sm">Analyzing Message</h4>
                <p className="text-xs text-slate-400 max-w-sm mt-0.5">
                  Detecting explicit action items, deadlines, due dates, and assigning candidate roles...
                </p>
              </div>
            </div>
          )}

          {/* Error State */}
          {!isLoading && error && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3 text-xs text-rose-400">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Extraction Error:</span> {error}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && tasks.length === 0 && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-500">
                <CheckCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-white text-sm">No Actionable Tasks Detected</h4>
                <p className="text-xs text-slate-400 max-w-sm mt-0.5">
                  This communication appears to be informational, conversational, or a confirmation. No explicit deliverables or to-dos were identified.
                </p>
              </div>
            </div>
          )}

          {/* Extracted Task Cards */}
          {!isLoading && !error && tasks.length > 0 && (
            <div className="space-y-4">
              {tasks.map((task, idx) => (
                <SuggestedTaskCard
                  key={task.id || `task-${idx}`}
                  suggestion={task}
                  projects={projects}
                  teamMembers={teamMembers}
                  clientId={clientId}
                  messageId={messageId}
                  onDismiss={() => handleDismiss(idx)}
                  onCreated={handleCreated}
                />
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            {createdTaskIds.length > 0 ? (
              <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {createdTaskIds.length} {createdTaskIds.length === 1 ? 'task' : 'tasks'} successfully created
              </span>
            ) : (
              <span>All tasks require your explicit approval</span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
