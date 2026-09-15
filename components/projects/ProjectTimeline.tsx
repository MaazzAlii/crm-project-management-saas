'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckSquare,
  Square,
  Plus,
  Clock,
  User,
  Calendar,
  Activity,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import {
  TaskRecord,
  ProjectActivityLogRecord,
  createProjectTaskAction,
  updateTaskStatusAction
} from '@/app/(dashboard)/projects/actions'

interface ProjectTimelineProps {
  projectId: string
  tasks: TaskRecord[]
  activityLogs: ProjectActivityLogRecord[]
  membersList: { id: string; name: string }[]
}

export function ProjectTimeline({
  projectId,
  tasks: initialTasks,
  activityLogs,
  membersList
}: ProjectTimelineProps) {
  const router = useRouter()
  const [tasks, setTasks] = useState<TaskRecord[]>(initialTasks)
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false)
  const [taskTitle, setTaskTitle] = useState('')
  const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium')
  const [taskDueDate, setTaskDueDate] = useState('')
  const [taskAssignee, setTaskAssignee] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Toggle Task Status
  const handleTaskToggle = async (taskId: string, currentStatus: string) => {
    const newStatus: 'todo' | 'in_progress' | 'review' | 'done' =
      currentStatus === 'done' ? 'todo' : 'done'

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: newStatus,
              completed_at: newStatus === 'done' ? new Date().toISOString() : null
            }
          : t
      )
    )

    try {
      const res = await updateTaskStatusAction(taskId, projectId, newStatus)
      if (!res.success) {
        alert(res.error || 'Failed to update task status')
      }
    } catch (err: any) {
      alert(err.message || 'Error updating task status')
    }
  }

  // Create Task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!taskTitle.trim()) return

    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('title', taskTitle)
      formData.append('priority', taskPriority)
      if (taskDueDate) formData.append('due_date', taskDueDate)
      if (taskAssignee) formData.append('assigned_to', taskAssignee)

      const res = await createProjectTaskAction(projectId, formData)
      if (res.success) {
        setTaskTitle('')
        setTaskDueDate('')
        setTaskAssignee('')
        setIsAddTaskOpen(false)
        router.refresh()
      } else {
        alert(res.error || 'Failed to create task')
      }
    } catch (err: any) {
      alert(err.message || 'Error creating task')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Task Completion Stats
  const completedTasks = tasks.filter((t) => t.status === 'done').length
  const totalTasks = tasks.length
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Tasks & Milestones Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
        {/* Task Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Project Milestones & Task Checklist
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Track project deliverables, execution tasks, and completion rate.
            </p>
          </div>

          <button
            onClick={() => setIsAddTaskOpen(!isAddTaskOpen)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-xs transition"
          >
            <Plus className="w-4 h-4" />
            Add Task
          </button>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex justify-between items-center text-xs font-medium">
            <span className="text-slate-600 dark:text-slate-400">
              Task Completion Progress ({completedTasks} of {totalTasks} done)
            </span>
            <span className="font-bold text-slate-900 dark:text-white">
              {completionPercentage}%
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
            <div
              className="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        {/* Add Task Form */}
        {isAddTaskOpen && (
          <form onSubmit={handleCreateTask} className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
            <h3 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
              Create New Task
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-3">
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Task title..."
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium">
                  Priority
                </label>
                <select
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value as any)}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium">
                  Due Date
                </label>
                <input
                  type="date"
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium">
                  Assigned Team Member
                </label>
                <select
                  value={taskAssignee}
                  onChange={(e) => setTaskAssignee(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
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

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddTaskOpen(false)}
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
                Save Task
              </button>
            </div>
          </form>
        )}

        {/* Task List */}
        {tasks.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400">
            No tasks created yet for this project.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {tasks.map((t) => {
              const isDone = t.status === 'done'

              return (
                <div
                  key={t.id}
                  className="py-3 flex items-start gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 px-2 rounded-lg transition"
                >
                  <button
                    onClick={() => handleTaskToggle(t.id, t.status)}
                    className="mt-0.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                  >
                    {isDone ? (
                      <CheckSquare className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>

                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-semibold ${
                          isDone
                            ? 'line-through text-slate-400 dark:text-slate-500'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {t.title}
                      </span>
                      {t.priority === 'urgent' && (
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 bg-red-500/10 text-red-500 rounded">
                          Urgent
                        </span>
                      )}
                      {t.priority === 'high' && (
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 bg-amber-500/10 text-amber-500 rounded">
                          High
                        </span>
                      )}
                    </div>
                    {t.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {t.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-400 shrink-0">
                    {t.assigned_name && (
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span>{t.assigned_name}</span>
                      </div>
                    )}
                    {t.due_date && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(t.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Activity Log Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          Project Activity History & Audit Trail
        </h2>

        {activityLogs.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400">
            No activity logged yet.
          </div>
        ) : (
          <div className="space-y-3 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
            {activityLogs.map((log) => (
              <div key={log.id} className="relative pl-8 flex items-start justify-between text-xs">
                <span className="absolute left-1.5 top-1.5 w-3 h-3 rounded-full bg-indigo-600 ring-4 ring-white dark:ring-slate-900" />
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">
                    {log.actor_name || 'System User'}{' '}
                    <span className="font-normal text-slate-500 dark:text-slate-400">
                      performed action <span className="font-medium text-indigo-600 dark:text-indigo-400">{log.action}</span>
                    </span>
                  </div>
                  {log.details && (
                    <div className="text-slate-500 dark:text-slate-400 mt-0.5">
                      {JSON.stringify(log.details)}
                    </div>
                  )}
                </div>
                <div className="text-slate-400 shrink-0 text-[11px]">
                  {new Date(log.created_at).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
