import { getCurrentSessionContext } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { fetchClientCommunicationsAction } from './actions'
import { ClientCommunicationsView } from '@/components/communications/ClientCommunicationsView'
import { isAIAccessible } from '@/lib/ai/client'

export async function generateMetadata({ params }: { params: { id: string } }) {
  return {
    title: `Client Communications Log | INNOVENTIX Hub`,
    description: 'Unified communication log thread, auto-synced messages, and manual call/email logs.',
  }
}

export default async function ClientCommunicationsPage({ params }: { params: { id: string } }) {
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
      .select('id, name, company, email, phone, communication_mode, organization_id')
      .eq('id', params.id)
      .eq('organization_id', session.organization.id)
      .maybeSingle()

    rawClient = data
  } catch (err) {
    console.error('Error fetching client for communications:', err)
  }

  if (!rawClient && process.env.DEV_SUPER_ADMIN === 'true') {
    if ((global as any).__DEV_CLIENTS && (global as any).__DEV_CLIENTS.length > 0) {
      rawClient = (global as any).__DEV_CLIENTS.find((c: any) => c.id === params.id) || (global as any).__DEV_CLIENTS[0]
    }
    if (!rawClient) {
      rawClient = {
        id: params.id,
        organization_id: session.organization.id,
        name: 'Acme Global Ventures',
        company: 'Acme Global Group',
        email: 'contact@acme-global.com',
        phone: '+1 (555) 789-0123',
        platform: 'Slack',
        communication_mode: 'connected',
      }
    }
  }

  if (!rawClient) {
    notFound()
  }

  const communications = await fetchClientCommunicationsAction(rawClient.id)

  let aiEnabled = false
  try {
    const aiCheck = await isAIAccessible(session.organization.id, 'task_extraction')
    aiEnabled = aiCheck.allowed
  } catch (e) {}

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <ClientCommunicationsView
        client={{
          id: rawClient.id,
          name: rawClient.name,
          company: rawClient.company,
          email: rawClient.email,
          phone: rawClient.phone,
          communication_mode: rawClient.communication_mode,
        }}
        initialCommunications={communications}
        aiEnabled={aiEnabled}
        showBackLink={true}
      />
    </div>
  )
}
