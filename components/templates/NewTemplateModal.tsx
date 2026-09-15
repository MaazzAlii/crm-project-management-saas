'use client'

import { useState } from 'react'
import { Layout, X, Plus, Trash2, Loader2, AlertCircle } from 'lucide-react'
import { createProjectTemplateAction } from '@/app/(dashboard)/settings/templates/actions'

interface NewTemplateModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

interface TaskDraft {
  title: string
  description?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  day_offset: number
}

export function NewTemplateModal({ isOpen, onClose, onSuccess }: NewTemplateModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState('Combined')
  const [defaultAmount, setDefaultAmount] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [deliverablesText, setDeliverablesText] = useState('')
  const [tasks, setTasks] = useState<TaskDraft[]>([
    { title: 'Project Kickoff & Requirements Review', priority: 'high', day_offset: 1 },
    { title: 'Architecture & Design Specification', priority: 'medium', day_offset: 3 }
  ])

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  if (!isOpen) return null

  const handleAddTask = () => {
    setTasks([...tasks, { title: '', priority: 'medium', day_offset: 5 }])
  }

  const handleRemoveTask = (index: number) => {
    setTasks(tasks.filter((_, idx) => idx !== index))
  }

  const handleTaskChange = (index: number, field: keyof TaskDraft, value: any) => {
    const updated = [...tasks]
    updated[index] = { ...updated[index], [field]: value }
    setTasks(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setErrorMsg('Template name is required.')
      return
    }

    const validTasks = tasks.filter((t) => t.title.trim() !== '')

    setIsSubmitting(true)
    setErrorMsg('')
    try {
      const formData = new FormData()
      formData.append('name', name)
      formData.append('description', description)
      formData.append('type', type)
      formData.append('default_amount', defaultAmount)
      formData.append('currency', currency)
      formData.append('default_deliverables', deliverablesText)
      formData.append('tasks_json', JSON.stringify(validTasks))

      const res = await createProjectTemplateAction(formData)
      if (res.success) {
        onClose()
        if (onSuccess) onSuccess()
      } else {
        setErrorMsg(res.error || 'Failed to create template')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error creating template')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <Layout className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="font-bold text-slate-900 dark:text-white text-base">
              Create Project Template
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto pr-2 text-xs">
          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Template Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. AI Voice Agent Standard Workflow"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Project Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                <option value="AI Voice Agent">AI Voice Agent</option>
                <option value="UGC Media">UGC Media</option>
                <option value="Automation">Automation</option>
                <option value="Combined">Combined</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Default Contract Amount
              </label>
              <input
                type="number"
                placeholder="5000"
                value={defaultAmount}
                onChange={(e) => setDefaultAmount(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Description
            </label>
            <textarea
              rows={2}
              placeholder="Standard deliverables and execution guide..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Default Deliverables (One per line)
            </label>
            <textarea
              rows={3}
              placeholder="Voice Bot Dialog Flow Diagram&#10;Twilio Audio Webhook Integration&#10;QA Load Test Report"
              value={deliverablesText}
              onChange={(e) => setDeliverablesText(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Pre-configured Tasks Builder */}
          <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                Pre-configured Task Scaffolding ({tasks.length})
              </h3>
              <button
                type="button"
                onClick={handleAddTask}
                className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
              >
                <Plus className="w-3.5 h-3.5" /> Add Task Step
              </button>
            </div>

            <div className="space-y-2">
              {tasks.map((t, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      placeholder="Task step title..."
                      value={t.title}
                      onChange={(e) => handleTaskChange(idx, 'title', e.target.value)}
                      className="flex-1 px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-xs text-slate-900 dark:text-white focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveTask(idx)}
                      className="p-1 text-red-400 hover:text-red-600 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <label className="text-slate-400">Priority:</label>
                      <select
                        value={t.priority}
                        onChange={(e) => handleTaskChange(idx, 'priority', e.target.value)}
                        className="w-full mt-0.5 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-900 dark:text-white"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-slate-400">Day Offset (from start):</label>
                      <input
                        type="number"
                        value={t.day_offset}
                        onChange={(e) =>
                          handleTaskChange(idx, 'day_offset', parseInt(e.target.value || '0', 10))
                        }
                        className="w-full mt-0.5 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition shadow-xs disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Save Template
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
