'use client'

import { useState } from 'react'
import { createProjectAction } from '@/app/(dashboard)/projects/actions'
import { X, Briefcase, Plus, Loader2, Calendar, DollarSign, User, Shield } from 'lucide-react'

interface NewProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  clientsList: { id: string; name: string }[]
  membersList: { id: string; name: string }[]
  templatesList?: { id: string; name: string; type?: string | null; default_amount?: number; description?: string | null }[]
  initialClientId?: string
}

export function NewProjectModal({
  isOpen,
  onClose,
  onSuccess,
  clientsList,
  membersList,
  templatesList = [],
  initialClientId,
}: NewProjectModalProps) {
  const [clientId, setClientId] = useState(initialClientId || clientsList[0]?.id || '')
  const [templateId, setTemplateId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState('Combined')
  const [briefSource, setBriefSource] = useState('WhatsApp')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [status, setStatus] = useState('Active')
  const [priority, setPriority] = useState('medium')
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10))
  const [deadline, setDeadline] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [notes, setNotes] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleTemplateSelect = (selectedTmplId: string) => {
    setTemplateId(selectedTmplId)
    const tmpl = templatesList.find((t) => t.id === selectedTmplId)
    if (tmpl) {
      if (tmpl.type) setType(tmpl.type)
      if (tmpl.default_amount) setAmount(tmpl.default_amount.toString())
      if (tmpl.description && !description) setDescription(tmpl.description)
      if (!title) setTitle(tmpl.name + ' Project')
    }
  }

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData()
    formData.append('client_id', clientId)
    if (templateId) formData.append('template_id', templateId)
    formData.append('title', title)
    formData.append('description', description)
    formData.append('type', type)
    formData.append('brief_source', briefSource)
    formData.append('amount', amount)
    formData.append('currency', currency)
    formData.append('status', status)
    formData.append('priority', priority)
    formData.append('start_date', startDate)
    formData.append('deadline', deadline)
    formData.append('assigned_to', assignedTo)
    formData.append('notes', notes)

    const res = await createProjectAction(formData)

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
              <h2 className="text-lg font-bold text-white">Create New Project</h2>
              <p className="text-xs text-slate-400">Add a client project record with budget & deadlines</p>
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
          {/* Template Selection Dropdown */}
          {templatesList.length > 0 && (
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl space-y-1">
              <label className="block font-semibold text-indigo-300">
                Use Project Template (Optional)
              </label>
              <select
                value={templateId}
                onChange={(e) => handleTemplateSelect(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">No Template (Custom Project)</option>
                {templatesList.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.type || 'Combined'})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400">
                Selecting a template automatically populates tasks & default deliverables.
              </p>
            </div>
          )}

          {/* Client & Project Title Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Client <span className="text-rose-400">*</span>
              </label>
              <select
                required
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-white focus:border-sky-500 focus:outline-none"
              >
                {clientsList.length === 0 ? (
                  <option value="">No clients found — add client first</option>
                ) : (
                  clientsList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Project Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. UGC Video Ad Campaign / AI Agent"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Description & Scope</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Outline project deliverables, requirements, and goal..."
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
            />
          </div>

          {/* Type & Brief Source */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Project Type</label>
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
              <label className="block text-slate-300 font-semibold mb-1">Brief Source</label>
              <select
                value={briefSource}
                onChange={(e) => setBriefSource(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-white focus:border-sky-500 focus:outline-none"
              >
                <option value="WhatsApp">WhatsApp</option>
                <option value="Slack">Slack</option>
                <option value="Upwork">Upwork</option>
                <option value="Discord">Discord</option>
                <option value="Email">Email</option>
              </select>
            </div>
          </div>

          {/* Budget & Currency */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Project Budget / Amount</label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 5000"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
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

          {/* Status, Priority & Dates */}
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
              <label className="block text-slate-300 font-semibold mb-1">Assigned Team Member</label>
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

          {/* Start Date & Deadline */}
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
              <label className="block text-slate-300 font-semibold mb-1">Target Deadline</label>
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
              disabled={loading || !title.trim() || !clientId}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold shadow-lg shadow-sky-500/20 transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Project'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
