'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Briefcase,
  Building2,
  Calendar,
  DollarSign,
  User,
  Clock,
  Edit2,
  CheckCircle2
} from 'lucide-react'
import { ProjectRecord, updateProjectStatusAction, updateProjectTeamAssigneeAction } from '@/app/(dashboard)/projects/actions'
import { ProjectStatusBadge } from './ProjectStatusBadge'

interface ProjectHeaderProps {
  project: ProjectRecord
  membersList: { id: string; name: string }[]
  onProjectUpdated?: () => void
}

const STATUS_OPTIONS = [
  'Planning',
  'Active',
  'In Review',
  'Completed',
  'On Hold',
  'Archived'
]

export function ProjectHeader({ project, membersList, onProjectUpdated }: ProjectHeaderProps) {
  const router = useRouter()
  const [status, setStatus] = useState(project.status || 'Planning')
  const [assignedTo, setAssignedTo] = useState(project.assigned_to || '')
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [isUpdatingAssignee, setIsUpdatingAssignee] = useState(false)

  // Handle status update
  const handleStatusChange = async (newStatus: string) => {
    setStatus(newStatus)
    setIsUpdatingStatus(true)
    try {
      const res = await updateProjectStatusAction(project.id, newStatus)
      if (res.success) {
        if (onProjectUpdated) onProjectUpdated()
        router.refresh()
      } else {
        setStatus(project.status)
        alert(res.error || 'Failed to update status')
      }
    } catch (err: any) {
      setStatus(project.status)
      alert(err.message || 'Error updating status')
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  // Handle assignee change
  const handleAssigneeChange = async (newAssigneeId: string) => {
    setAssignedTo(newAssigneeId)
    setIsUpdatingAssignee(true)
    try {
      const res = await updateProjectTeamAssigneeAction(project.id, newAssigneeId || null)
      if (res.success) {
        if (onProjectUpdated) onProjectUpdated()
        router.refresh()
      } else {
        setAssignedTo(project.assigned_to || '')
        alert(res.error || 'Failed to update team member')
      }
    } catch (err: any) {
      setAssignedTo(project.assigned_to || '')
      alert(err.message || 'Error updating team member')
    } finally {
      setIsUpdatingAssignee(false)
    }
  }

  const formatCurrency = (amount?: number | null, curr = 'USD') => {
    if (amount == null) return '$0'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: curr,
      maximumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </Link>

        {/* Status Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Status:</span>
          <select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value)}
            disabled={isUpdatingStatus}
            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          >
            {STATUS_OPTIONS.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Title Banner */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {project.title}
            </h1>
            <ProjectStatusBadge status={status} />
          </div>
          {project.description && (
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-3xl">
              {project.description}
            </p>
          )}
        </div>

        {/* Budget Highlight */}
        <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl text-right shrink-0">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Contract Value
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
            {formatCurrency(project.amount, project.currency)}
          </div>
        </div>
      </div>

      {/* Key Info Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
        {/* Client */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg text-indigo-600 dark:text-indigo-400">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Client</div>
            <Link
              href={`/clients/${project.client_id}`}
              className="text-sm font-semibold text-slate-900 dark:text-white hover:underline truncate block"
            >
              {project.client_name || 'Client Profile'}
            </Link>
          </div>
        </div>

        {/* Assigned Lead */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg text-emerald-600 dark:text-emerald-400">
            <User className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="text-xs text-slate-400 font-medium">Assigned Member</div>
            <select
              value={assignedTo}
              onChange={(e) => handleAssigneeChange(e.target.value)}
              disabled={isUpdatingAssignee}
              className="mt-0.5 w-full bg-transparent text-xs font-semibold text-slate-900 dark:text-white focus:outline-hidden"
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

        {/* Start Date */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 rounded-lg text-amber-600 dark:text-amber-400">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Start Date</div>
            <div className="text-sm font-semibold text-slate-900 dark:text-white">
              {project.start_date
                ? new Date(project.start_date).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })
                : 'Not set'}
            </div>
          </div>
        </div>

        {/* Deadline */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-50 dark:bg-purple-950/40 rounded-lg text-purple-600 dark:text-purple-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Target Deadline</div>
            <div className="text-sm font-semibold text-slate-900 dark:text-white">
              {project.deadline
                ? new Date(project.deadline).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })
                : 'Not set'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
