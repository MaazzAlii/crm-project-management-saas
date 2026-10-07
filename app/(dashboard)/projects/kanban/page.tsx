import { fetchProjectsAction } from '../actions'
import { ProjectsKanban } from '@/components/projects/ProjectsKanban'
import { query } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  return {
    title: 'Projects Kanban Board | INNOVENTIX Hub',
    description: 'Visual project status pipeline and Kanban board for agency projects.'
  }
}

export default async function ProjectsKanbanPage() {
  const projects = await fetchProjectsAction()

  // Fetch clients & profiles for dropdowns
  let clientsList: { id: string; name: string }[] = []
  let membersList: { id: string; name: string }[] = []

  try {
    const [clientsRes, usersRes] = await Promise.all([
      query<any>(`SELECT id, name FROM clients ORDER BY name ASC`),
      query<any>(`SELECT id, full_name, email FROM users ORDER BY full_name ASC`),
    ])

    if (clientsRes.rows) {
      clientsList = clientsRes.rows
    }
    if (usersRes.rows) {
      membersList = usersRes.rows.map((p) => ({
        id: p.id,
        name: p.full_name || p.email || 'Team Member'
      }))
    }
  } catch (e) {
    console.error('Failed to fetch clients/profiles for kanban page:', e)
  }

  if (clientsList.length === 0) {
    clientsList = [
      { id: 'cli_1', name: 'Acme Corp' },
      { id: 'cli_2', name: 'Stark Industries' },
      { id: 'cli_3', name: 'Wayne Enterprises' }
    ]
  }

  if (membersList.length === 0) {
    membersList = [
      { id: 'usr_1', name: 'Alex Johnson' },
      { id: 'usr_2', name: 'Sarah Smith' },
      { id: 'usr_3', name: 'Michael Brown' }
    ]
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <ProjectsKanban
        initialProjects={projects}
        clientsList={clientsList}
        membersList={membersList}
      />
    </div>
  )
}
