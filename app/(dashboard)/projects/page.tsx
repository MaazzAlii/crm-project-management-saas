import { fetchProjectsAction } from './actions'
import { fetchProjectTemplatesAction } from '@/app/(dashboard)/settings/templates/actions'
import { ProjectsList } from '@/components/projects/ProjectsList'
import { query } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function ProjectsPage() {
  const [projects, templates] = await Promise.all([
    fetchProjectsAction(),
    fetchProjectTemplatesAction()
  ])

  // Fetch clients and profiles for filter & select dropdowns
  let clientsList: { id: string; name: string }[] = []
  let membersList: { id: string; name: string }[] = []

  try {
    const [clientsRes, usersRes] = await Promise.all([
      query<any>(`SELECT id, name FROM clients WHERE organization_id = $1 ORDER BY name ASC`, [sessionContext.organization.id]),
      query<any>(
        `SELECT u.id, u.full_name, u.email 
         FROM users u 
         JOIN organization_members om ON om.user_id = u.id 
         WHERE om.organization_id = $1 
         ORDER BY u.full_name ASC`,
        [sessionContext.organization.id]
      ),
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
    console.error('Failed to fetch clients/profiles for projects page:', e)
  }

  const templatesList = templates.map((t) => ({
    id: t.id,
    name: t.name,
    type: t.type,
    default_amount: t.default_amount,
    description: t.description
  }))

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <ProjectsList
        initialProjects={projects}
        clientsList={clientsList}
        membersList={membersList}
        templatesList={templatesList}
      />
    </div>
  )
}
