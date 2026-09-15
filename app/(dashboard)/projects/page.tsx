import { fetchProjectsAction } from './actions'
import { ProjectsList } from '@/components/projects/ProjectsList'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function ProjectsPage() {
  const projects = await fetchProjectsAction()

  // Fetch clients and profiles for filter & select dropdowns
  let clientsList: { id: string; name: string }[] = []
  let membersList: { id: string; name: string }[] = []

  try {
    const supabase = await createClient()

    const [clientsRes, profilesRes] = await Promise.all([
      supabase.from('clients').select('id, name').order('name'),
      supabase.from('profiles').select('id, full_name, email').order('full_name')
    ])

    if (clientsRes.data) {
      clientsList = clientsRes.data
    }
    if (profilesRes.data) {
      membersList = profilesRes.data.map((p) => ({
        id: p.id,
        name: p.full_name || p.email || 'Team Member'
      }))
    }
  } catch (e) {
    console.error('Failed to fetch clients/profiles for projects page:', e)
  }

  // Fallbacks if db is empty or disconnected
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
      <ProjectsList
        initialProjects={projects}
        clientsList={clientsList}
        membersList={membersList}
      />
    </div>
  )
}
