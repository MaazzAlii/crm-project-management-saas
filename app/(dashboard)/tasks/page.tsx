import { fetchAllTasksAction, fetchTeamWorkloadAction } from './actions'
import { fetchProjectsAction } from '../projects/actions'
import { TaskList } from '@/components/tasks/TaskList'
import { getCurrentSessionContext } from '@/lib/auth/session'
import { query } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  return {
    title: 'Tasks & Team Workload | INNOVENTIX Hub',
    description: 'Manage agency tasks, set priorities, track due dates, and monitor team workload.'
  }
}

export default async function TasksPage() {
  const session = await getCurrentSessionContext()

  const [allTasks, workloadList, projects] = await Promise.all([
    fetchAllTasksAction(),
    fetchTeamWorkloadAction(),
    fetchProjectsAction()
  ])

  // Projects list for dropdowns
  const projectsList = projects.map((p) => ({
    id: p.id,
    title: p.title
  }))

  // Members list for dropdowns
  let membersList: { id: string; name: string }[] = []
  try {
    if (session?.organization?.id) {
      const data = await query<{ id: string; full_name: string | null; email: string }>(
        `SELECT u.id, u.full_name, u.email
         FROM users u
         JOIN organization_members om ON om.user_id = u.id
         WHERE om.organization_id = $1
         ORDER BY u.full_name ASC`,
        [session.organization.id]
      )
      if (data && data.length > 0) {
        membersList = data.map((p) => ({
          id: p.id,
          name: p.full_name || p.email || 'Team Member'
        }))
      }
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
    <div className="p-6 max-w-7xl mx-auto">
      <TaskList
        initialTasks={allTasks}
        workloadList={workloadList}
        projectsList={projectsList}
        membersList={membersList}
        currentUserId={session?.user?.id}
      />
    </div>
  )
}
