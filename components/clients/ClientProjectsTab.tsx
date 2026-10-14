'use client'

import { Briefcase, FolderPlus, ArrowRight } from 'lucide-react'

interface ProjectRecord {
  id: string
  name: string
  status: string
  budget?: number | null
  created_at: string
}

interface ClientProjectsTabProps {
  projects?: ProjectRecord[]
}

export function ClientProjectsTab({ projects = [] }: ClientProjectsTabProps) {
  if (projects.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-12 text-center space-y-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary mx-auto">
          <Briefcase className="h-6 w-6" />
        </div>
        <div className="space-y-1 max-w-sm mx-auto">
          <h3 className="text-base font-bold text-foreground">No Linked Projects Yet</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            There are no active or archived projects associated with this client record yet.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
          Client Projects ({projects.length})
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.map((p) => (
          <div
            key={p.id}
            className="rounded-2xl border border-border bg-card p-5 space-y-3 hover:border-border/80 transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-foreground">{p.name}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20 capitalize">
                {p.status}
              </span>
            </div>
            {p.budget && (
              <div className="text-xs text-muted-foreground">
                Budget: <span className="text-foreground font-semibold">${p.budget.toLocaleString()}</span>
              </div>
            )}
            <div className="text-[11px] text-muted-foreground">
              Created: {new Date(p.created_at).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
