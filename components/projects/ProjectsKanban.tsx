'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Briefcase,
  Plus,
  Search,
  Filter,
  Kanban,
  List,
  Clock,
  Play,
  Eye,
  CheckCircle2,
  PauseCircle,
  Building2,
  User,
  DollarSign,
  Calendar,
  Edit2,
  Trash2,
  MoreVertical,
  AlertCircle,
  MoveRight
} from 'lucide-react'
import { ProjectRecord, updateProjectStatusAction, deleteProjectAction } from '@/app/(dashboard)/projects/actions'
import { NewProjectModal } from './NewProjectModal'
import { EditProjectModal } from './EditProjectModal'

export interface ProjectsKanbanProps {
  initialProjects: ProjectRecord[]
  clientsList: { id: string; name: string }[]
  membersList: { id: string; name: string }[]
}

interface ColumnDef {
  id: string
  title: string
  statuses: string[]
  badgeColor: string
  headerBg: string
  dotColor: string
  icon: any
}

const COLUMNS: ColumnDef[] = [
  {
    id: 'Planning',
    title: 'Planning',
    statuses: ['Planning', 'planning', 'brief_received'],
    badgeColor: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    headerBg: 'border-t-4 border-t-amber-500',
    dotColor: 'bg-amber-500',
    icon: Clock
  },
  {
    id: 'Active',
    title: 'Active',
    statuses: ['Active', 'active', 'in_progress'],
    badgeColor: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    headerBg: 'border-t-4 border-t-emerald-500',
    dotColor: 'bg-emerald-500',
    icon: Play
  },
  {
    id: 'In Review',
    title: 'In Review',
    statuses: ['In Review', 'in_review'],
    badgeColor: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    headerBg: 'border-t-4 border-t-purple-500',
    dotColor: 'bg-purple-500',
    icon: Eye
  },
  {
    id: 'Completed',
    title: 'Completed',
    statuses: ['Completed', 'completed', 'delivered'],
    badgeColor: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    headerBg: 'border-t-4 border-t-blue-500',
    dotColor: 'bg-blue-500',
    icon: CheckCircle2
  },
  {
    id: 'On Hold',
    title: 'On Hold',
    statuses: ['On Hold', 'on_hold', 'Archived', 'archived'],
    badgeColor: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    headerBg: 'border-t-4 border-t-slate-500',
    dotColor: 'bg-slate-400',
    icon: PauseCircle
  }
]

export function ProjectsKanban({ initialProjects, clientsList, membersList }: ProjectsKanbanProps) {
  const router = useRouter()
  const [projects, setProjects] = useState<ProjectRecord[]>(initialProjects)

  // Filters
  const [search, setSearch] = useState('')
  const [selectedClient, setSelectedClient] = useState('ALL')
  const [selectedMember, setSelectedMember] = useState('ALL')

  // Drag state
  const [draggedProjectId, setDraggedProjectId] = useState<string | null>(null)
  const [dragOverColId, setDragOverColId] = useState<string | null>(null)

  // Modals
  const [isNewModalOpen, setIsNewModalOpen] = useState(false)
  const [newModalInitialClient, setNewModalInitialClient] = useState<string>('')
  const [editingProject, setEditingProject] = useState<ProjectRecord | null>(null)

  // Quick menu active card id
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)

  // Filter project cards
  const filteredProjects = projects.filter((project) => {
    if (search) {
      const q = search.toLowerCase()
      const matchTitle = project.title.toLowerCase().includes(q)
      const matchDesc = project.description?.toLowerCase().includes(q) ?? false
      const matchClient = project.client_name?.toLowerCase().includes(q) ?? false
      if (!matchTitle && !matchDesc && !matchClient) return false
    }

    if (selectedClient !== 'ALL' && project.client_id !== selectedClient) {
      return false
    }

    if (selectedMember !== 'ALL' && project.assigned_to !== selectedMember) {
      return false
    }

    return true
  })

  // Handle status update
  const handleMoveStatus = async (projectId: string, targetStatus: string) => {
    // Optimistic update
    const prevProjects = [...projects]
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, status: targetStatus } : p))
    )

    try {
      const res = await updateProjectStatusAction(projectId, targetStatus)
      if (!res.success) {
        setProjects(prevProjects)
        alert(res.error || 'Failed to update project status')
      }
    } catch (err: any) {
      setProjects(prevProjects)
      alert(err.message || 'Error updating project status')
    }
  }

  // Handle Delete
  const handleDelete = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return
    const prev = [...projects]
    setProjects((p) => p.filter((x) => x.id !== projectId))
    try {
      const res = await deleteProjectAction(projectId)
      if (!res.success) {
        setProjects(prev)
        alert(res.error || 'Failed to delete project')
      }
    } catch (err: any) {
      setProjects(prev)
      alert(err.message || 'Error deleting project')
    }
  }

  // Drag Handlers
  const handleDragStart = (e: React.DragEvent, projectId: string) => {
    e.dataTransfer.setData('text/plain', projectId)
    setDraggedProjectId(projectId)
  }

  const handleDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault()
    if (dragOverColId !== colId) {
      setDragOverColId(colId)
    }
  }

  const handleDragLeave = (colId: string) => {
    if (dragOverColId === colId) {
      setDragOverColId(null)
    }
  }

  const handleDrop = (e: React.DragEvent, colId: string) => {
    e.preventDefault()
    setDragOverColId(null)
    const projectId = e.dataTransfer.getData('text/plain') || draggedProjectId
    if (projectId) {
      handleMoveStatus(projectId, colId)
    }
    setDraggedProjectId(null)
  }

  const formatCurrency = (amount?: number | null, curr = 'USD') => {
    if (amount == null) return null
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: curr,
      maximumFractionDigits: 0
    }).format(amount)
  }

  // Total projects & budget stats
  const totalAmount = filteredProjects.reduce((acc, p) => acc + (p.amount || 0), 0)

  return (
    <div className="space-y-6">
      {/* Top Header & View Switcher */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Kanban className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            Projects Kanban Board
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Visual workflow pipeline. Drag and drop project cards between status columns.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggle Tabs */}
          <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <Link
              href="/projects"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
            >
              <List className="w-4 h-4" />
              List View
            </Link>
            <Link
              href="/projects/kanban"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs transition"
            >
              <Kanban className="w-4 h-4" />
              Kanban Board
            </Link>
          </div>

          <button
            onClick={() => {
              setNewModalInitialClient('')
              setIsNewModalOpen(true)
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-sm transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Create Project
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search projects by title or client..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Client Filter */}
          <div className="w-44">
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Clients</option>
              {clientsList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Assignee Filter */}
          <div className="w-44">
            <select
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Team Members</option>
              {membersList.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Showing <span className="font-semibold text-slate-900 dark:text-white">{filteredProjects.length}</span> projects ({formatCurrency(totalAmount)})
        </div>
      </div>

      {/* Kanban Board Horizontal Scroll Container */}
      <div className="overflow-x-auto pb-6">
        <div className="flex gap-5 min-w-[1250px]">
          {COLUMNS.map((col) => {
            const Icon = col.icon

            // Filter cards matching this column status
            const colProjects = filteredProjects.filter((p) => {
              const norm = (p.status || '').toLowerCase()
              return col.statuses.some((s) => s.toLowerCase() === norm)
            })

            const colTotalAmount = colProjects.reduce((sum, p) => sum + (p.amount || 0), 0)
            const isDragTarget = dragOverColId === col.id

            return (
              <div
                key={col.id}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDragLeave={() => handleDragLeave(col.id)}
                onDrop={(e) => handleDrop(e, col.id)}
                className={`flex-1 min-w-[270px] bg-slate-50/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800/80 rounded-2xl flex flex-col transition-all duration-200 ${
                  col.headerBg
                } ${isDragTarget ? 'ring-2 ring-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20' : ''}`}
              >
                {/* Column Header */}
                <div className="p-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`} />
                    <Icon className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      {col.title}
                    </h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${col.badgeColor}`}>
                      {colProjects.length}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setNewModalInitialClient('')
                      setIsNewModalOpen(true)
                    }}
                    className="p-1 hover:bg-slate-200/60 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-md transition"
                    title={`Add project to ${col.title}`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Column Budget Sub-header */}
                <div className="px-4 py-2 bg-slate-100/50 dark:bg-slate-800/30 border-b border-slate-200/50 dark:border-slate-800/50 flex justify-between items-center text-[11px] text-slate-500 dark:text-slate-400">
                  <span>Column Total:</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {formatCurrency(colTotalAmount) || '$0'}
                  </span>
                </div>

                {/* Project Cards List */}
                <div className="p-3 space-y-3 flex-1 min-h-[350px]">
                  {colProjects.length === 0 ? (
                    <div className="h-32 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center text-xs text-slate-400 dark:text-slate-600">
                      Drag project here
                    </div>
                  ) : (
                    colProjects.map((project) => {
                      const isDraggingThis = draggedProjectId === project.id

                      return (
                        <div
                          key={project.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, project.id)}
                          className={`group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs hover:shadow-md transition-all cursor-grab active:cursor-grabbing relative ${
                            isDraggingThis ? 'opacity-40 scale-95' : ''
                          }`}
                        >
                          {/* Card Header: Title & Actions */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="font-semibold text-sm text-slate-900 dark:text-white line-clamp-2">
                              {project.title}
                            </div>

                            <div className="relative">
                              <button
                                onClick={() =>
                                  setActiveMenuId(activeMenuId === project.id ? null : project.id)
                                }
                                className="p-1 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>

                              {activeMenuId === project.id && (
                                <div className="absolute right-0 top-6 z-20 w-44 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg py-1 text-xs">
                                  <button
                                    onClick={() => {
                                      setActiveMenuId(null)
                                      setEditingProject(project)
                                    }}
                                    className="w-full text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-2"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" /> Quick Edit
                                  </button>
                                  <div className="border-t border-slate-100 dark:border-slate-700 my-1" />
                                  <div className="px-3 py-1 text-[10px] uppercase font-semibold text-slate-400">
                                    Move to status
                                  </div>
                                  {COLUMNS.map((c) => (
                                    <button
                                      key={c.id}
                                      onClick={() => {
                                        setActiveMenuId(null)
                                        handleMoveStatus(project.id, c.id)
                                      }}
                                      className="w-full text-left px-3 py-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-1.5"
                                    >
                                      <MoveRight className="w-3 h-3 text-slate-400" /> {c.title}
                                    </button>
                                  ))}
                                  <div className="border-t border-slate-100 dark:border-slate-700 my-1" />
                                  <button
                                    onClick={() => {
                                      setActiveMenuId(null)
                                      handleDelete(project.id)
                                    }}
                                    className="w-full text-left px-3 py-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 flex items-center gap-2"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" /> Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Client badge */}
                          {project.client_name && (
                            <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                              <Building2 className="w-3 h-3 text-slate-400" />
                              <span className="truncate max-w-[180px]">{project.client_name}</span>
                            </div>
                          )}

                          {/* Metadata row: Budget & Deadline */}
                          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                            <div className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                              <DollarSign className="w-3.5 h-3.5 text-amber-500" />
                              <span>{formatCurrency(project.amount, project.currency) || '$0'}</span>
                            </div>

                            {project.deadline && (
                              <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                                <Calendar className="w-3 h-3 text-slate-400" />
                                <span>{new Date(project.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                              </div>
                            )}
                          </div>

                          {/* Assignee Footer */}
                          {project.assigned_name && (
                            <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                              <User className="w-3 h-3 text-slate-400" />
                              <span>{project.assigned_name}</span>
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

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
          initialClientId={newModalInitialClient}
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
