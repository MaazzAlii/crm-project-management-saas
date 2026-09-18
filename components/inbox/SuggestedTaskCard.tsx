'use client'

import { useState } from 'react'
import {
  Sparkles,
  Calendar,
  User,
  FolderKanban,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Quote,
  Check,
} from 'lucide-react'
import { ExtractedTaskSuggestion } from '@/lib/ai/prompts/task-extraction'
import {
  TaskCandidateProject,
  TaskCandidateAssignee,
  createExtractedTaskAction,
} from '@/app/(dashboard)/inbox/actions'
import Link from 'next/link'

interface SuggestedTaskCardProps {
  suggestion: ExtractedTaskSuggestion
  projects: TaskCandidateProject[]
  teamMembers: TaskCandidateAssignee[]
  defaultProjectId?: string
  clientId?: string | null
  messageId?: string | null
  onCreated?: (taskId: string) => void
  onDismiss?: () => void
}

export function SuggestedTaskCard({
  suggestion,
  projects,
  teamMembers,
  defaultProjectId,
  clientId,
  messageId,
  onCreated,
  onDismiss,
}: SuggestedTaskCardProps) {
  const [title, setTitle] = useState(suggestion.title)
  const [description, setDescription] = useState(suggestion.description)
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>(suggestion.priority || 'medium')
  const [dueDate, setDueDate] = useState<string>(suggestion.suggestedDueDate || '')

  // Pre-select project matching client if available, else first project
  const initialProjectId =
    defaultProjectId ||
    projects.find((p) => p.client_id === clientId)?.id ||
    projects[0]?.id ||
    ''
  const [projectId, setProjectId] = useState<string>(initialProjectId)

  // Try to match suggested assignee to team members
  const matchedAssignee = teamMembers.find((m) =>
    suggestion.suggestedAssignee &&
    (m.name.toLowerCase().includes(suggestion.suggestedAssignee.toLowerCase()) ||
     suggestion.suggestedAssignee.toLowerCase().includes(m.name.toLowerCase()))
  )
  const [assignedTo, setAssignedTo] = useState<string>(matchedAssignee?.id || '')

  const [isCreating, setIsCreating] = useState(false)
  const [isCreated, setIsCreated] = useState(false)
  const [createdTaskId, setCreatedTaskId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleCreate = async () => {
    if (!title.trim()) {
      setError('Task title cannot be empty.')
      return
    }
    if (!projectId) {
      setError('Please select a target project for this task.')
      return
    }

    setIsCreating(true)
    setError(null)

    try {
      const res = await createExtractedTaskAction({
        projectId,
        title: title.trim(),
        description: description.trim(),
        priority,
        dueDate: dueDate || null,
        assignedTo: assignedTo || null,
        sourceSnippet: suggestion.sourceSnippet,
        clientId,
        messageId,
      })

      if (res.success && res.taskId) {
        setIsCreated(true)
        setCreatedTaskId(res.taskId)
        if (onCreated) {
          onCreated(res.taskId)
        }
      } else {
        setError(res.error || 'Failed to create task.')
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.')
    } finally {
      setIsCreating(false)
    }
  }

  const confidence = suggestion.confidenceScore || 85
  const confidenceColor =
    confidence >= 90
      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      : confidence >= 75
      ? 'bg-sky-500/10 text-sky-400 border-sky-500/20'
      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-4 hover:border-slate-700 transition shadow-lg">
      {/* Header: Confidence Pill & Dismiss */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${confidenceColor}`}>
            <Sparkles className="w-3 h-3" />
            {confidence}% Confidence
          </span>

          {suggestion.estimatedHours && (
            <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700/60">
              ~{suggestion.estimatedHours} hr{suggestion.estimatedHours > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {!isCreated && onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="text-slate-500 hover:text-slate-300 p-1 rounded-lg hover:bg-slate-800 transition"
            title="Dismiss suggestion"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Triggering Snippet */}
      {suggestion.sourceSnippet && (
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300 italic">
          <Quote className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
          <span className="leading-relaxed">&ldquo;{suggestion.sourceSnippet}&rdquo;</span>
        </div>
      )}

      {/* Editable Title */}
      <div>
        <label className="block text-xs font-semibold text-slate-400 mb-1">
          Task Title
        </label>
        <input
          type="text"
          value={title}
          disabled={isCreated || isCreating}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 text-sm rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500 disabled:opacity-60 transition"
          placeholder="Task title"
        />
      </div>

      {/* Editable Description */}
      <div>
        <label className="block text-xs font-semibold text-slate-400 mb-1">
          Context & Deliverables
        </label>
        <textarea
          rows={2}
          value={description}
          disabled={isCreated || isCreating}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-indigo-500 disabled:opacity-60 resize-none transition"
          placeholder="Task details"
        />
      </div>

      {/* Selectors Grid: Project, Assignee, Priority, Due Date */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {/* Project Selector */}
        <div>
          <label className="flex items-center gap-1 text-xs font-semibold text-slate-400 mb-1">
            <FolderKanban className="w-3 h-3 text-indigo-400" />
            Target Project <span className="text-rose-400">*</span>
          </label>
          <select
            value={projectId}
            disabled={isCreated || isCreating}
            onChange={(e) => setProjectId(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-indigo-500 disabled:opacity-60 transition"
          >
            {projects.length === 0 ? (
              <option value="">No projects found</option>
            ) : (
              projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} {p.client_id === clientId ? '(This Client)' : ''}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Assignee Selector */}
        <div>
          <label className="flex items-center gap-1 text-xs font-semibold text-slate-400 mb-1">
            <User className="w-3 h-3 text-indigo-400" />
            Assignee
          </label>
          <select
            value={assignedTo}
            disabled={isCreated || isCreating}
            onChange={(e) => setAssignedTo(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-indigo-500 disabled:opacity-60 transition"
          >
            <option value="">Unassigned</option>
            {teamMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        {/* Priority Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">
            Priority
          </label>
          <select
            value={priority}
            disabled={isCreated || isCreating}
            onChange={(e) => setPriority(e.target.value as any)}
            className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-indigo-500 disabled:opacity-60 capitalize transition"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>

        {/* Due Date Picker */}
        <div>
          <label className="flex items-center gap-1 text-xs font-semibold text-slate-400 mb-1">
            <Calendar className="w-3 h-3 text-indigo-400" />
            Due Date
          </label>
          <input
            type="date"
            value={dueDate}
            disabled={isCreated || isCreating}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-indigo-500 disabled:opacity-60 transition"
          />
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800">
        <div className="text-[11px] text-slate-500">
          Suggested by AI • Requires explicit human confirmation
        </div>

        {isCreated ? (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Check className="w-3.5 h-3.5" />
              Task Created
            </span>
            <Link
              href={projectId ? `/projects/${projectId}` : '/tasks'}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition"
            >
              View in Project →
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {onDismiss && (
              <button
                type="button"
                onClick={onDismiss}
                disabled={isCreating}
                className="px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white rounded-xl transition"
              >
                Dismiss
              </button>
            )}

            <button
              type="button"
              onClick={handleCreate}
              disabled={isCreating || !projectId}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white shadow-md shadow-indigo-500/20 disabled:opacity-50 transition"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Creating Task...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Accept & Create Task
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
