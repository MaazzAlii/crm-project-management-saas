'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  FolderCheck,
  Plus,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Trash2,
  FileText,
  Loader2,
  MessageSquare
} from 'lucide-react'
import {
  DeliverableRecord,
  createDeliverableAction,
  updateDeliverableStatusAction,
  deleteDeliverableAction
} from '@/app/(dashboard)/projects/actions'

interface DeliverablesListProps {
  projectId: string
  deliverables: DeliverableRecord[]
}

export function DeliverablesList({ projectId, deliverables: initialDeliverables }: DeliverablesListProps) {
  const router = useRouter()
  const [deliverables, setDeliverables] = useState<DeliverableRecord[]>(initialDeliverables)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [driveLink, setDriveLink] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedbackInputId, setFeedbackInputId] = useState<string | null>(null)
  const [feedbackText, setFeedbackText] = useState('')

  // Create Deliverable
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('title', title)
      if (driveLink) formData.append('drive_link', driveLink)

      const res = await createDeliverableAction(projectId, formData)
      if (res.success) {
        setTitle('')
        setDriveLink('')
        setIsFormOpen(false)
        router.refresh()
      } else {
        alert(res.error || 'Failed to create deliverable')
      }
    } catch (err: any) {
      alert(err.message || 'Error creating deliverable')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Update Status
  const handleStatusUpdate = async (
    deliverableId: string,
    newStatus: 'pending' | 'approved' | 'revision_required',
    feedback?: string
  ) => {
    setDeliverables((prev) =>
      prev.map((d) => (d.id === deliverableId ? { ...d, status: newStatus, client_feedback: feedback ?? d.client_feedback } : d))
    )

    try {
      const res = await updateDeliverableStatusAction(deliverableId, projectId, newStatus, feedback)
      if (!res.success) {
        alert(res.error || 'Failed to update deliverable status')
      }
    } catch (err: any) {
      alert(err.message || 'Error updating status')
    } finally {
      setFeedbackInputId(null)
      setFeedbackText('')
    }
  }

  // Delete Deliverable
  const handleDelete = async (deliverableId: string) => {
    if (!confirm('Are you sure you want to delete this deliverable?')) return

    setDeliverables((prev) => prev.filter((d) => d.id !== deliverableId))
    try {
      const res = await deleteDeliverableAction(deliverableId, projectId)
      if (!res.success) {
        alert(res.error || 'Failed to delete deliverable')
      }
    } catch (err: any) {
      alert(err.message || 'Error deleting deliverable')
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FolderCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Deliverables & Review
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Client review links, files, approval status, and feedback log.
          </p>
        </div>

        <button
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-xs transition"
        >
          <Plus className="w-4 h-4" />
          Add Deliverable
        </button>
      </div>

      {/* Quick Add Form */}
      {isFormOpen && (
        <form onSubmit={handleCreate} className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
          <h3 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
            New Deliverable
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium">
                Deliverable Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Final Video Cut / API Spec Docs"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium">
                Drive Link or File URL
              </label>
              <input
                type="url"
                placeholder="https://drive.google.com/..."
                value={driveLink}
                onChange={(e) => setDriveLink(e.target.value)}
                className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Save Deliverable
            </button>
          </div>
        </form>
      )}

      {/* Deliverables List */}
      {deliverables.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
          <FileText className="mx-auto h-8 w-8 text-slate-400 dark:text-slate-600" />
          <p className="mt-2 text-xs font-medium text-slate-600 dark:text-slate-400">
            No deliverables uploaded yet.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {deliverables.map((del) => {
            const isApproved = del.status === 'approved'
            const isRevision = del.status === 'revision_required'

            return (
              <div
                key={del.id}
                className="p-4 bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm text-slate-900 dark:text-white">
                        {del.title}
                      </h4>

                      {/* Status Badge */}
                      {isApproved && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" /> Approved
                        </span>
                      )}
                      {isRevision && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-500/10 text-red-500 border border-red-500/20">
                          <AlertTriangle className="w-3 h-3" /> Revision Requested
                        </span>
                      )}
                      {del.status === 'pending' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                          <Clock className="w-3 h-3" /> Pending Review
                        </span>
                      )}
                    </div>

                    {/* Drive link */}
                    {del.drive_link && (
                      <a
                        href={del.drive_link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-medium"
                      >
                        <ExternalLink className="w-3 h-3" /> Open Drive Link
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Status Action Buttons */}
                    <button
                      onClick={() => handleStatusUpdate(del.id, 'approved')}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-medium transition"
                      title="Approve Deliverable"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        setFeedbackInputId(feedbackInputId === del.id ? null : del.id)
                      }}
                      className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[11px] font-medium transition"
                      title="Request Revision"
                    >
                      Request Revision
                    </button>
                    <button
                      onClick={() => handleDelete(del.id)}
                      className="p-1 text-red-400 hover:text-red-600 transition"
                      title="Delete Deliverable"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Feedback section */}
                {del.client_feedback && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                    <MessageSquare className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">Client Feedback: </span>
                      {del.client_feedback}
                    </div>
                  </div>
                )}

                {/* Feedback Input Prompt */}
                {feedbackInputId === del.id && (
                  <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg space-y-2">
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                      Specify revision requirements / feedback:
                    </label>
                    <textarea
                      rows={2}
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder="e.g. Please update logo placement and adjust voiceover speed."
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setFeedbackInputId(null)}
                        className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleStatusUpdate(del.id, 'revision_required', feedbackText)
                        }
                        className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-medium"
                      >
                        Submit Feedback
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
