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
import { DeliverProjectConfirmModal } from './DeliverProjectConfirmModal'
import { ProjectStatusBadge } from './ProjectStatusBadge'
import { ProjectHealthBadge } from '@/components/shared/ProjectHealthBadge'

interface ProjectHeaderProps {
  project: ProjectRecord
  membersList: { id: string; name: string }[]
  onProjectUpdated?: () => void
}

const STATUS_OPTIONS = [
  'Planning',
  'Active',
  'In Review',
  'Delivered',
  'Invoiced',
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
  const [isDeliverModalOpen, setIsDeliverModalOpen] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<string | null>(null)

  const executeStatusChange = async (newStatus: string) => {
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
      setIsDeliverModalOpen(false)
      setPendingStatus(null)
    }
  }

  // Handle status update
  const handleStatusChange = async (newStatus: string) => {
    if (newStatus.toLowerCase() === 'delivered') {
      setPendingStatus(newStatus)
      setIsDeliverModalOpen(true)
      return
    }
    await executeStatusChange(newStatus)
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
    <div className="bg-card border border-border rounded-2xl p-6 shadow-xs space-y-6">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </Link>

        {/* Status Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium">Status:</span>
          <select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value)}
            disabled={isUpdatingStatus}
            className="px-3 py-1.5 bg-background border border-border rounded-lg text-xs font-semibold text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary"
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
            <h1 className="text-2xl font-bold text-foreground">
              {project.title}
            </h1>
            <ProjectStatusBadge status={status} />
            <ProjectHealthBadge deadline={project.deadline} status={status} />
          </div>
          {project.description && (
            <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
              {project.description}
            </p>
          )}
        </div>

        {/* Budget Highlight */}
        <div className="bg-muted/50 border border-border px-4 py-2.5 rounded-xl text-right shrink-0">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Contract Value
          </div>
          <div className="text-xl font-bold text-foreground mt-0.5">
            {formatCurrency(project.amount, project.currency)}
          </div>
        </div>
      </div>

      {/* Key Info Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-border">
        {/* Client */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 rounded-lg text-primary">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-medium">Client</div>
            <Link
              href={`/clients/${project.client_id}`}
              className="text-sm font-semibold text-foreground hover:underline truncate block"
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
            <div className="text-xs text-muted-foreground font-medium">Assigned Member</div>
            <select
              value={assignedTo}
              onChange={(e) => handleAssigneeChange(e.target.value)}
              disabled={isUpdatingAssignee}
              className="mt-0.5 w-full bg-transparent text-xs font-semibold text-foreground focus:outline-hidden"
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
            <div className="text-xs text-muted-foreground font-medium">Start Date</div>
            <div className="text-sm font-semibold text-foreground">
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
            <div className="text-xs text-muted-foreground font-medium">Target Deadline</div>
            <div className="text-sm font-semibold text-foreground">
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

      {/* Confirmation Modal on Delivered Transition */}
      <DeliverProjectConfirmModal
        isOpen={isDeliverModalOpen}
        onClose={() => {
          setIsDeliverModalOpen(false)
          setPendingStatus(null)
        }}
        onConfirm={() => executeStatusChange(pendingStatus || 'Delivered')}
        isLoading={isUpdatingStatus}
        projectTitle={project.title}
        clientName={project.client_name || 'Client Profile'}
        amount={project.amount || 0}
        currency={project.currency || 'USD'}
      />
    </div>
  )
}
