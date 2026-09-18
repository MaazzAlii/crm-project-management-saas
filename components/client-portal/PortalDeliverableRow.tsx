import Link from 'next/link'
import { FileCheck, FileClock, FileX, Download, ExternalLink, ArrowRight } from 'lucide-react'

interface PortalDeliverableRowProps {
  id: string
  title: string
  status: 'pending' | 'approved' | 'revision_required'
  fileUrl?: string | null
  driveLink?: string | null
  projectId: string
  projectTitle: string
  submittedAt: string
}

const STATUS_CONFIG = {
  pending: {
    label: 'Awaiting Review',
    icon: FileClock,
    className: 'portal-badge-status-pending',
  },
  approved: {
    label: 'Approved',
    icon: FileCheck,
    className: 'portal-badge-status-active',
  },
  revision_required: {
    label: 'Revision Requested',
    icon: FileX,
    className: 'inline-flex items-center gap-1.5 rounded-full bg-red-500/15 px-2.5 py-1 text-xs font-medium text-red-400 ring-1 ring-red-500/20',
  },
}

export function PortalDeliverableRow({
  id, title, status, fileUrl, driveLink, projectId, projectTitle, submittedAt,
}: PortalDeliverableRowProps) {
  const cfg = STATUS_CONFIG[status]
  const Icon = cfg.icon
  const date = new Date(submittedAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-800/60 bg-slate-900/40 px-5 py-4 transition-colors hover:border-slate-700/60">
      <div className="flex items-start gap-3 min-w-0">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-800/60">
          <Icon className="h-4 w-4 text-slate-400" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-white truncate">{title}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className={cfg.className}>
              <Icon className="h-3 w-3" />
              {cfg.label}
            </span>
            <span className="text-xs text-slate-500">{date}</span>
            <Link
              href={`/client/projects/${projectId}`}
              className="text-xs text-slate-500 hover:text-violet-400 transition-colors flex items-center gap-1"
            >
              {projectTitle}
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {fileUrl && (
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-slate-700/60 bg-slate-800/40 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-slate-600 hover:text-white"
          >
            <Download className="h-3.5 w-3.5" />
            Download
          </a>
        )}
        {driveLink && !fileUrl && (
          <a
            href={driveLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-slate-700/60 bg-slate-800/40 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-slate-600 hover:text-white"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            View
          </a>
        )}
        {status === 'pending' && (
          <Link
            href={`/client/projects/${projectId}#deliverable-${id}`}
            className="portal-btn-primary py-1.5 px-4 text-xs"
          >
            Review
          </Link>
        )}
      </div>
    </div>
  )
}
