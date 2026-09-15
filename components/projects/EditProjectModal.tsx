'use client'

import { useState } from 'react'
import { ProjectRecord, updateProjectAction } from '@/app/(dashboard)/projects/actions'
import { X, Briefcase, Save, Loader2 } from 'lucide-react'

interface EditProjectModalProps {
  project: ProjectRecord
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  membersList: { id: string; name: string }[]
}

export function EditProjectModal({
  project,
  isOpen,
  onClose,
  onSuccess,
  membersList,
}: EditProjectModalProps) {
  const [title, setTitle] = useState(project.title)
  const [description, setDescription] = useState(project.description || '')
  const [type, setType] = useState(project.type || 'Combined')
  const [amount, setAmount] = useState(project.amount ? project.amount.toString() : '')
  const [currency, setCurrency] = useState(project.currency || 'USD')
  const [status, setStatus] = useState(project.status || 'Active')
  const [priority, setPriority] = useState(project.priority || 'medium')
  const [startDate, setStartDate] = useState(project.start_date || '')
  const [deadline, setDeadline] = useState(project.deadline || '')
  const [assignedTo, setAssignedTo] = useState(project.assigned_to || '')
  const [notes, setNotes] = useState(project.notes || '')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData()
    formData.append('title', title)
    formData.append('description', description)
    formData.append('type', type)
    formData.append('amount', amount)
    formData.append('currency', currency)
    formData.append('status', status)
    formData.append('priority', priority)
    formData.append('start_date', startDate)
    formData.append('deadline', deadline)
    formData.append('assigned_to', assignedTo)
    formData.append('notes', notes)

    const res = await updateProjectAction(project.id, formData)

    setLoading(false)

    if (res.error) {
      setError(res.error)
    } else {
      onClose()
      if (onSuccess) onSuccess()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Edit Project Details</h2>
              <p className="text-xs text-slate-400">
                Client: <span className="font-semibold text-slate-200">{project.client_name}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs max-h-[70vh] overflow-y-auto pr-1">
          {/* Title */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Project Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Description & Scope</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-white focus:border-sky-500 focus:outline-none"
            />
          </div>

          {/* Type, Amount & Currency */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-white focus:border-sky-500 focus:outline-none"
              >
                <option value="UGC Media">UGC Media</option>
                <option value="AI Voice Agent">AI Voice Agent</option>
                <option value="Automation">Automation</option>
                <option value="Web Development">Web Development</option>
                <option value="Combined">Combined Agency Service</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Budget / Amount</label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-white focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-white focus:border-sky-500 focus:outline-none uppercase"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="CAD">CAD ($)</option>
                <option value="AUD">AUD ($)</option>
              </select>
            </div>
          </div>

          {/* Status, Priority & Member */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-white focus:border-sky-500 focus:outline-none"
              >
                <option value="Planning">Planning</option>
                <option value="Active">Active</option>
                <option value="In Review">In Review</option>
                <option value="Completed">Completed</option>
                <option value="On Hold">On Hold</option>
                <option value="Archived">Archived</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-white focus:border-sky-500 focus:outline-none capitalize"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Assigned Member</label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-white focus:border-sky-500 focus:outline-none"
              >
                <option value="">Unassigned</option>
                {membersList.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-white focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Deadline</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-white focus:border-sky-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-800 text-slate-400 font-semibold hover:bg-slate-800 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold shadow-lg shadow-sky-500/20 transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
