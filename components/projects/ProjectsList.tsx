'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Briefcase,
  Plus,
  Edit2,
  Trash2,
  User,
  Building2,
  DollarSign,
  CheckCircle2,
  Clock,
  FolderOpen,
  List,
  Kanban
} from 'lucide-react'
import { ProjectStatusBadge } from './ProjectStatusBadge'
import { ProjectFilters, ProjectFiltersState } from './ProjectFilters'
import { NewProjectModal } from './NewProjectModal'
import { EditProjectModal } from './EditProjectModal'
import { ProjectRecord, updateProjectAction, deleteProjectAction } from '@/app/(dashboard)/projects/actions'

interface ProjectsListProps {
  initialProjects: ProjectRecord[]
  clientsList: { id: string; name: string }[]
  membersList: { id: string; name: string }[]
}

export function ProjectsList({ initialProjects, clientsList, membersList }: ProjectsListProps) {
  const router = useRouter()
  const [projects, setProjects] = useState<ProjectRecord[]>(initialProjects)
  const [filters, setFilters] = useState<ProjectFiltersState>({
    search: '',
    status: 'ALL',
    client: 'ALL',
    assigned: 'ALL'
  })

  const [isNewModalOpen, setIsNewModalOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<ProjectRecord | null>(null)
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null)
  const [isUpdatingStatusId, setIsUpdatingStatusId] = useState<string | null>(null)

  // Filter projects
  const filteredProjects = projects.filter((project) => {
    // Search match
    if (filters.search) {
      const q = filters.search.toLowerCase()
      const matchTitle = project.title.toLowerCase().includes(q)
      const matchDesc = project.description?.toLowerCase().includes(q) ?? false
      const matchClient = project.client_name?.toLowerCase().includes(q) ?? false
      if (!matchTitle && !matchDesc && !matchClient) return false
    }

    // Status filter
    if (filters.status !== 'ALL' && project.status !== filters.status) {
      return false
    }

    // Client filter
    if (filters.client !== 'ALL' && project.client_id !== filters.client) {
      return false
    }

    // Assigned filter
    if (filters.assigned !== 'ALL' && project.assigned_to !== filters.assigned) {
      return false
    }

    return true
  })

  // Status inline update
  const handleStatusChange = async (projectId: string, newStatus: string) => {
    setIsUpdatingStatusId(projectId)
    try {
      const formData = new FormData()
      formData.append('status', newStatus)
      const res = await updateProjectAction(projectId, formData)
      if (res.success) {
        setProjects((prev) =>
          prev.map((p) => (p.id === projectId ? { ...p, status: newStatus } : p))
        )
      } else {
        alert(res.error || 'Failed to update project status')
      }
    } catch (err: any) {
      alert(err.message || 'Error updating status')
    } finally {
      setIsUpdatingStatusId(null)
    }
  }

  // Delete project
  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return
    }

    setIsDeletingId(projectId)
    try {
      const res = await deleteProjectAction(projectId)
      if (res.success) {
        setProjects((prev) => prev.filter((p) => p.id !== projectId))
        router.refresh()
      } else {
        alert(res.error || 'Failed to delete project')
      }
    } catch (err: any) {
      alert(err.message || 'Error deleting project')
    } finally {
      setIsDeletingId(null)
    }
  }

  const formatCurrency = (amount?: number | null, curr = 'USD') => {
    if (amount == null) return null
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: curr,
      maximumFractionDigits: 0
    }).format(amount)
  }

  // Summary statistics
  const activeCount = projects.filter((p) => p.status === 'Active' || p.status === 'in_progress').length
  const reviewCount = projects.filter((p) => p.status === 'In Review' || p.status === 'in_review').length
  const totalBudget = projects.reduce((acc, p) => acc + (p.amount || 0), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Briefcase className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            Projects List & Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage agency projects, status pipeline, deliverables, and client budgets.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <Link
              href="/projects"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs transition"
            >
              <List className="w-4 h-4" />
              List View
            </Link>
            <Link
              href="/projects/kanban"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
            >
              <Kanban className="w-4 h-4" />
              Kanban Board
            </Link>
          </div>

          <button
            onClick={() => setIsNewModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-sm transition shadow-sm hover:shadow"
          >
            <Plus className="w-4 h-4" />
            Create Project
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Projects
            </span>
            <FolderOpen className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {projects.length}
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Active Projects
            </span>
            <Clock className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            {activeCount}
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              In Review
            </span>
            <CheckCircle2 className="w-5 h-5 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-2">
            {reviewCount}
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Portfolio Budget
            </span>
            <DollarSign className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {formatCurrency(totalBudget) || '$0'}
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <ProjectFilters
        filters={filters}
        onChange={setFilters}
        onReset={() =>
          setFilters({
            search: '',
            status: 'ALL',
            client: 'ALL',
            assigned: 'ALL'
          })
        }
        totalCount={projects.length}
        filteredCount={filteredProjects.length}
        clientsList={clientsList}
        membersList={membersList}
      />

      {/* Table List View */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <Briefcase className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-600" />
          <h3 className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
            No projects found
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {filters.search || filters.status !== 'ALL' || filters.client !== 'ALL' || filters.assigned !== 'ALL'
              ? 'Try adjusting your search query or status filter.'
              : 'Get started by creating your first agency project.'}
          </p>
          <div className="mt-6">
            <button
              onClick={() => setIsNewModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition"
            >
              <Plus className="w-4 h-4" />
              New Project
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Project Title</th>
                  <th className="py-3.5 px-4">Client</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Assigned Member</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredProjects.map((project) => {
                  const clientName = project.client_name || 'Unspecified Client'
                  const assignedName = project.assigned_name || 'Unassigned'

                  return (
                    <tr
                      key={project.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition group"
                    >
                      <td className="py-4 px-4 font-medium text-slate-900 dark:text-white">
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-slate-100">
                            {project.title}
                          </div>
                          {project.description && (
                            <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 max-w-xs mt-0.5">
                              {project.description}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-4 text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{clientName}</span>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <ProjectStatusBadge status={project.status} />
                      </td>

                      <td className="py-4 px-4 text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-xs">{assignedName}</span>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-slate-700 dark:text-slate-300 font-medium text-xs">
                        {formatCurrency(project.amount, project.currency || 'USD') || '—'}
                      </td>

                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditingProject(project)}
                            className="p-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition"
                            title="Quick Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDeleteProject(project.id)}
                            className="p-1.5 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition"
                            title="Delete Project"
                            disabled={isDeletingId === project.id}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {isNewModalOpen && (
        <NewProjectModal
          isOpen={isNewModalOpen}
          onClose={() => setIsNewModalOpen(false)}
          onSuccess={() => {
            setIsNewModalOpen(false)
            router.refresh()
          }}
          clientsList={clientsList}
          membersList={membersList}
        />
      )}

      {editingProject && (
        <EditProjectModal
          isOpen={!!editingProject}
          onClose={() => setEditingProject(null)}
          onSuccess={() => {
            setEditingProject(null)
            router.refresh()
          }}
          project={editingProject}
          membersList={membersList}
        />
      )}
    </div>
  )
}
