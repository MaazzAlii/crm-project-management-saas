import { getCurrentSessionContext } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
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
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center text-slate-400">
        No active organization selected. Please choose or create an organization first.
      </div>
    )
  }

  const supabase = await createClient()

  let rawClient: any = null

  try {
    const { data } = await supabase
      .from('clients')
      .select('*')
      .eq('id', params.id)
      .eq('organization_id', session.organization.id)
      .maybeSingle()

    rawClient = data
  } catch (err) {
    console.error('Error fetching client by id:', err)
  }

  if (!rawClient && process.env.DEV_SUPER_ADMIN === 'true' && (global as any).__DEV_CLIENTS) {
    rawClient = (global as any).__DEV_CLIENTS.find((c: any) => c.id === params.id)
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
    const { data: projectsData } = await supabase
      .from('projects')
      .select('id, name, status, budget, created_at')
      .eq('client_id', client.id)
      .eq('organization_id', session.organization.id)

    projects = projectsData || []
  } catch (err) {}

  // Fetch audit logs
  let auditLogs: any[] = []
  try {
    const { data: auditData } = await supabase
      .from('audit_logs')
      .select('id, action, created_at, details')
      .eq('target_id', client.id)
      .order('created_at', { ascending: false })

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
