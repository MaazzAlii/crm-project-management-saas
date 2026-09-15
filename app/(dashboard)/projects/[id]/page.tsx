import {
  fetchProjectDetailAction,
  fetchProjectDeliverablesAction,
  fetchProjectTasksAction,
  fetchProjectActivityLogAction
} from '../actions'
import { ProjectHeader } from '@/components/projects/ProjectHeader'
import { DeliverablesList } from '@/components/projects/DeliverablesList'
import { ProjectTimeline } from '@/components/projects/ProjectTimeline'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: { id: string } }) {
  const project = await fetchProjectDetailAction(params.id)
  return {
    title: project ? `${project.title} | Projects | INNOVENTIX Hub` : 'Project Detail',
    description: 'Detailed agency project profile, deliverables, tasks, and audit log.'
  }
}

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const [project, deliverables, tasks, activityLogs] = await Promise.all([
    fetchProjectDetailAction(params.id),
    fetchProjectDeliverablesAction(params.id),
    fetchProjectTasksAction(params.id),
    fetchProjectActivityLogAction(params.id)
  ])

  if (!project) {
    notFound()
  }

  // Fetch team members list
  let membersList: { id: string; name: string }[] = []
  try {
    const supabase = await createClient()
    const { data } = await supabase.from('profiles').select('id, full_name, email').order('full_name')
    if (data) {
      membersList = data.map((p) => ({
        id: p.id,
        name: p.full_name || p.email || 'Team Member'
      }))
    }
  } catch (e) {}

  if (membersList.length === 0) {
    membersList = [
      { id: 'usr_1', name: 'Alex Johnson' },
      { id: 'usr_2', name: 'Sarah Smith' },
      { id: 'usr_3', name: 'Michael Brown' }
    ]
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <ProjectHeader
        project={project}
        membersList={membersList}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DeliverablesList
          projectId={project.id}
          deliverables={deliverables}
        />

        <ProjectTimeline
          projectId={project.id}
          tasks={tasks}
          activityLogs={activityLogs}
          membersList={membersList}
        />
      </div>
    </div>
  )
}
