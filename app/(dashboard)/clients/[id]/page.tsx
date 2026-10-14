import { getCurrentSessionContext } from '@/lib/auth/session'
import { query, queryOne } from '@/lib/db'
import { redirect, notFound } from 'next/navigation'
import { ClientRecord } from '@/components/clients/ClientsList'
import { ClientDetailHeader } from '@/components/clients/ClientDetailHeader'
import { ClientDetailTabs } from '@/components/clients/ClientDetailTabs'
import { fetchClientCommunicationsAction } from './communications/actions'

export async function generateMetadata({ params }: { params: { id: string } }) {
  return {
    title: `Client Details | INNOVENTIX Hub`,
    description: '360-degree agency client view, projects, notes, and communication logs.',
  }
}

export default async function ClientDetailPage({ params }: { params: { id: string } }) {
  const session = await getCurrentSessionContext()

  if (!session || !session.user) {
    redirect('/auth/signin')
  }

  if (!session.organization) {
    return (
      <div className="rounded-2xl border border-border bg-card/50 p-8 text-center text-muted-foreground">
        No active organization selected. Please choose or create an organization first.
      </div>
    )
  }

  let rawClient: any = null

  try {
    rawClient = await queryOne<any>(
      `SELECT * FROM clients WHERE id = $1 AND organization_id = $2`,
      [params.id, session.organization.id]
    )
  } catch (err) {
    console.error('Error fetching client by id:', err)
  }

  // Cross-tenant RLS security enforcement
  if (!rawClient) {
    notFound()
  }

  const client: ClientRecord = {
    id: rawClient.id,
    organization_id: rawClient.organization_id,
    name: rawClient.name,
    company: rawClient.company,
    email: rawClient.email,
    phone: rawClient.phone,
    platform: rawClient.platform,
    country: rawClient.country,
    currency: rawClient.currency,
    payment_schedule: rawClient.payment_schedule,
    status: rawClient.status,
    communication_mode: rawClient.communication_mode,
    notes: rawClient.notes,
    tags: rawClient.tags || [],
    created_at: rawClient.created_at,
    updated_at: rawClient.updated_at,
  }

  // Fetch linked projects
  let projects: any[] = []
  try {
    const projectsData = await query<any>(
      `SELECT id, title AS name, status, amount AS budget, created_at
       FROM projects
       WHERE client_id = $1 AND organization_id = $2`,
      [client.id, session.organization.id]
    )
    projects = projectsData || []
  } catch (err) {}

  // Fetch audit logs
  let auditLogs: any[] = []
  try {
    const auditData = await query<any>(
      `SELECT id, action, created_at, details
       FROM audit_logs
       WHERE target_id = $1 AND organization_id = $2
       ORDER BY created_at DESC`,
      [client.id, session.organization.id]
    )
    auditLogs = auditData || []
  } catch (err) {}

  // Fetch communications
  const communications = await fetchClientCommunicationsAction(client.id)

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <ClientDetailHeader
        client={client}
        userRole={session.role}
        isSuperAdmin={session.isSuperAdmin}
      />
      <ClientDetailTabs
        client={client}
        projects={projects}
        auditLogs={auditLogs}
        initialCommunications={communications}
      />
    </div>
  )
}
