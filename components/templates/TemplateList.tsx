'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Layout,
  Plus,
  Trash2,
  CheckSquare,
  FolderCheck,
  DollarSign,
  Briefcase,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { ProjectTemplateRecord, deleteProjectTemplateAction } from '@/app/(dashboard)/settings/templates/actions'
import { NewTemplateModal } from './NewTemplateModal'

interface TemplateListProps {
  initialTemplates: ProjectTemplateRecord[]
}

export function TemplateList({ initialTemplates }: TemplateListProps) {
  const router = useRouter()
  const [templates, setTemplates] = useState<ProjectTemplateRecord[]>(initialTemplates)
  const [isNewModalOpen, setIsNewModalOpen] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const handleDelete = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this project template?')) return

    setTemplates((prev) => prev.filter((t) => t.id !== templateId))
    try {
      const res = await deleteProjectTemplateAction(templateId)
      if (!res.success) {
        alert(res.error || 'Failed to delete template')
      }
    } catch (err: any) {
      alert(err.message || 'Error deleting template')
    }
  }

  const formatCurrency = (amount?: number, curr = 'USD') => {
    if (!amount) return '$0'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: curr,
      maximumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Layout className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            Project Templates Library
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Save recurring project structures as reusable templates with task scaffolding and deliverables.
          </p>
        </div>

        <button
          onClick={() => setIsNewModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-sm transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Create Template
        </button>
      </div>

      {/* Templates Grid */}
      {templates.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <Layout className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-600" />
          <h3 className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
            No templates created yet
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Build reusable project templates to scaffold tasks and deliverables automatically.
          </p>
          <div className="mt-6">
            <button
              onClick={() => setIsNewModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition"
            >
              <Plus className="w-4 h-4" />
              Create Template
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((tmpl) => {
            const taskCount = tmpl.tasks?.length || 0
            const deliverableCount = tmpl.default_deliverables?.length || 0
            const isExpanded = expandedId === tmpl.id

            return (
              <div
                key={tmpl.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <span className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                        {tmpl.type || 'Combined'}
                      </span>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white">
                        {tmpl.name}
                      </h3>
                    </div>

                    <button
                      onClick={() => handleDelete(tmpl.id)}
                      className="p-1 text-red-400 hover:text-red-600 transition"
                      title="Delete Template"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {tmpl.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      {tmpl.description}
                    </p>
                  )}

                  {/* Template Meta Info */}
                  <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 dark:border-slate-800 text-center text-xs">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Value</div>
                      <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                        {formatCurrency(tmpl.default_amount, tmpl.currency)}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Tasks</div>
                      <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                        {taskCount} steps
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Files</div>
                      <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                        {deliverableCount} items
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expandable Task & Deliverable Drawer */}
                <div className="space-y-2">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : tmpl.id)}
                    className="w-full flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
                  >
                    <span>View Template Details</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {isExpanded && (
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-3 text-xs border border-slate-200/60 dark:border-slate-800">
                      {/* Tasks list */}
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white mb-1 flex items-center gap-1.5">
                          <CheckSquare className="w-3.5 h-3.5 text-indigo-500" />
                          Pre-configured Tasks:
                        </div>
                        {taskCount === 0 ? (
                          <div className="text-slate-400 text-[11px]">No tasks defined</div>
                        ) : (
                          <ul className="space-y-1 pl-4 list-disc text-slate-600 dark:text-slate-400 text-[11px]">
                            {tmpl.tasks?.map((t) => (
                              <li key={t.id}>
                                <span className="font-medium text-slate-800 dark:text-slate-200">{t.title}</span> (Day {t.day_offset})
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      {/* Deliverables list */}
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white mb-1 flex items-center gap-1.5">
                          <FolderCheck className="w-3.5 h-3.5 text-emerald-500" />
                          Default Deliverables:
                        </div>
                        {deliverableCount === 0 ? (
                          <div className="text-slate-400 text-[11px]">No deliverables defined</div>
                        ) : (
                          <ul className="space-y-1 pl-4 list-disc text-slate-600 dark:text-slate-400 text-[11px]">
                            {tmpl.default_deliverables.map((del, idx) => (
                              <li key={idx}>{del}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* New Template Modal */}
      {isNewModalOpen && (
        <NewTemplateModal
          isOpen={isNewModalOpen}
          onClose={() => setIsNewModalOpen(false)}
          onSuccess={() => {
            setIsNewModalOpen(false)
            router.refresh()
          }}
        />
      )}
    </div>
  )
}
