import { getCurrentSessionContext } from '@/lib/auth/session'
import { queryOne } from '@/lib/db'
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

  let rawClient: any = null

  try {
    rawClient = await queryOne<any>(
      `SELECT id, name, company, email, phone, communication_mode, organization_id
       FROM clients
       WHERE id = $1 AND organization_id = $2`,
      [params.id, session.organization.id]
    )
  } catch (err) {
    console.error('Error fetching client for communications:', err)
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
