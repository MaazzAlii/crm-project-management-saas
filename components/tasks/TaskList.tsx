'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  CheckSquare,
  Square,
  Plus,
  Search,
  Filter,
  User,
  Calendar,
  Briefcase,
  AlertCircle,
  Edit2,
  Trash2,
  Users,
  CheckCircle2,
  Clock,
  ChevronDown
} from 'lucide-react'
import {
  GlobalTaskRecord,
  TeamWorkloadRecord,
  toggleGlobalTaskStatusAction,
  deleteGlobalTaskAction
} from '@/app/(dashboard)/tasks/actions'
import { NewTaskModal } from './NewTaskModal'
import { EditTaskModal } from './EditTaskModal'
import { WorkloadCard } from './WorkloadCard'

interface TaskListProps {
  initialTasks: GlobalTaskRecord[]
  workloadList: TeamWorkloadRecord[]
  projectsList: { id: string; title: string }[]
  membersList: { id: string; name: string }[]
  currentUserId?: string
}

export function TaskList({
  initialTasks,
  workloadList,
  projectsList,
  membersList,
  currentUserId
}: TaskListProps) {
  const router = useRouter()
  const [tasks, setTasks] = useState<GlobalTaskRecord[]>(initialTasks)
  const [viewMode, setViewMode] = useState<'all' | 'my' | 'workload'>('all')

  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [priorityFilter, setPriorityFilter] = useState('ALL')
  const [projectFilter, setProjectFilter] = useState('ALL')
  const [assigneeFilter, setAssigneeFilter] = useState('ALL')

  // Modals
  const [isNewModalOpen, setIsNewModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<GlobalTaskRecord | null>(null)
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null)

  const todayStr = new Date().toISOString().slice(0, 10)

  // Filter logic
  const filteredTasks = tasks.filter((task) => {
    // View mode: My Tasks vs All Tasks
    if (viewMode === 'my' && currentUserId && task.assigned_to !== currentUserId) {
      return false
    }

    // Search query
    if (search) {
      const q = search.toLowerCase()
      const matchTitle = task.title.toLowerCase().includes(q)
      const matchDesc = task.description?.toLowerCase().includes(q) ?? false
      const matchProject = task.project_title?.toLowerCase().includes(q) ?? false
      if (!matchTitle && !matchDesc && !matchProject) return false
    }

    // Status filter
    if (statusFilter !== 'ALL' && task.status !== statusFilter) {
      return false
    }

    // Priority filter
    if (priorityFilter !== 'ALL' && task.priority !== priorityFilter) {
      return false
    }

    // Project filter
    if (projectFilter !== 'ALL' && task.project_id !== projectFilter) {
      return false
    }

    // Assignee filter
    if (assigneeFilter !== 'ALL' && task.assigned_to !== assigneeFilter) {
      return false
    }

    return true
  })

  // Toggle status
  const handleToggleStatus = async (taskId: string, currentStatus: string) => {
    const newStatus: 'todo' | 'in_progress' | 'review' | 'done' =
      currentStatus === 'done' ? 'todo' : 'done'

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, status: newStatus, completed_at: newStatus === 'done' ? new Date().toISOString() : null }
          : t
      )
    )

    try {
      const res = await toggleGlobalTaskStatusAction(taskId, newStatus)
      if (!res.success) {
        alert(res.error || 'Failed to update task status')
      }
    } catch (err: any) {
      alert(err.message || 'Error toggling task status')
    }
  }

  // Delete task
  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return

    setIsDeletingId(taskId)
    setTasks((prev) => prev.filter((t) => t.id !== taskId))
    try {
      const res = await deleteGlobalTaskAction(taskId)
      if (!res.success) {
        alert(res.error || 'Failed to delete task')
      }
    } catch (err: any) {
      alert(err.message || 'Error deleting task')
    } finally {
      setIsDeletingId(null)
    }
  }

  // KPI counters
  const totalCount = tasks.length
  const activeCount = tasks.filter((t) => t.status !== 'done').length
  const doneCount = tasks.filter((t) => t.status === 'done').length
  const overdueCount = tasks.filter((t) => t.status !== 'done' && t.due_date && t.due_date < todayStr).length

  return (
    <div className="space-y-6">
      {/* Header & View Mode Switcher */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CheckSquare className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            Tasks & Workload Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track agency tasks, set priorities, assign team members, and monitor capacity.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Tabs */}
          <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                viewMode === 'all'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All Tasks ({totalCount})
            </button>
            <button
              onClick={() => setViewMode('my')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                viewMode === 'my'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              My Tasks
            </button>
            <button
              onClick={() => setViewMode('workload')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition ${
                viewMode === 'workload'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" /> Workload View
            </button>
          </div>

          <button
            onClick={() => setIsNewModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-sm transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Create Task
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Agency Tasks
            </span>
            <CheckSquare className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {totalCount}
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Active / Pending
            </span>
            <Clock className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-2">
            {activeCount}
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Completed
            </span>
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            {doneCount}
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Overdue Tasks
            </span>
            <AlertCircle className="w-5 h-5 text-red-500" />
          </div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400 mt-2">
            {overdueCount}
          </div>
        </div>
      </div>

      {/* WORKLOAD VIEW */}
      {viewMode === 'workload' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Team Member Workload & Capacity Breakdown
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {workloadList.map((mw) => (
              <WorkloadCard key={mw.id} memberWorkload={mw} />
            ))}
          </div>
        </div>
      ) : (
        /* TASKS LIST VIEW */
        <div className="space-y-4">
          {/* Filters Toolbar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search tasks or projects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="review">Review</option>
              <option value="done">Done</option>
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>

            {/* Project Filter */}
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Projects</option>
              {projectsList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>

            {/* Assignee Filter */}
            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Assignees</option>
              {membersList.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tasks Data List */}
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <CheckSquare className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-600" />
              <h3 className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                No tasks found
              </h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {search || statusFilter !== 'ALL' || priorityFilter !== 'ALL'
                  ? 'Try adjusting your search query or filters.'
                  : 'Get started by creating your first agency task.'}
              </p>
              <div className="mt-6">
                <button
                  onClick={() => setIsNewModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition"
                >
                  <Plus className="w-4 h-4" />
                  Create Task
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
              {filteredTasks.map((t) => {
                const isDone = t.status === 'done'
                const isOverdue = !isDone && t.due_date && t.due_date < todayStr

                return (
                  <div
                    key={t.id}
                    className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition ${
                      isOverdue ? 'bg-red-500/5' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {/* Quick check toggle */}
                      <button
                        onClick={() => handleToggleStatus(t.id, t.status)}
                        className="mt-0.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition shrink-0"
                      >
                        {isDone ? (
                          <CheckSquare className="w-5 h-5 text-emerald-500" />
                        ) : (
                          <Square className="w-5 h-5" />
                        )}
                      </button>

                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`font-semibold text-sm ${
                              isDone
                                ? 'line-through text-slate-400 dark:text-slate-500'
                                : 'text-slate-900 dark:text-white'
                            }`}
                          >
                            {t.title}
                          </span>

                          {/* Priority Pill */}
                          {t.priority === 'urgent' && (
                            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded">
                              Urgent
                            </span>
                          )}
                          {t.priority === 'high' && (
                            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded">
                              High
                            </span>
                          )}

                          {/* Overdue Flag */}
                          {isOverdue && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 bg-red-600 text-white rounded">
                              <AlertCircle className="w-3 h-3" /> Overdue
                            </span>
                          )}
                        </div>

                        {t.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                            {t.description}
                          </p>
                        )}

                        {/* Project Tag */}
                        {t.project_title && (
                          <Link
                            href={`/projects/${t.project_id}`}
                            className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium"
                          >
                            <Briefcase className="w-3 h-3 text-slate-400" />
                            <span>{t.project_title}</span>
                          </Link>
                        )}
                      </div>
                    </div>

                    {/* Metadata & Actions */}
                    <div className="flex items-center justify-between sm:justify-end gap-4 text-xs text-slate-500 dark:text-slate-400 shrink-0">
                      {/* Assignee */}
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{t.assigned_name || 'Unassigned'}</span>
                      </div>

                      {/* Due Date */}
                      {t.due_date && (
                        <div
                          className={`flex items-center gap-1 font-medium ${
                            isOverdue
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {new Date(t.due_date).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditingTask(t)}
                          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                          title="Edit Task"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTask(t.id)}
                          className="p-1 text-red-400 hover:text-red-600 transition"
                          title="Delete Task"
                          disabled={isDeletingId === t.id}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {isNewModalOpen && (
        <NewTaskModal
          isOpen={isNewModalOpen}
          onClose={() => setIsNewModalOpen(false)}
          onSuccess={() => {
            setIsNewModalOpen(false)
            router.refresh()
          }}
          projectsList={projectsList}
          membersList={membersList}
          currentUserId={currentUserId}
        />
      )}

      {editingTask && (
        <EditTaskModal
          isOpen={!!editingTask}
          onClose={() => setEditingTask(null)}
          onSuccess={() => {
            setEditingTask(null)
            router.refresh()
          }}
          task={editingTask}
          membersList={membersList}
        />
      )}
    </div>
  )
}
