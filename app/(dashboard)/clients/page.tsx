import { getCurrentSessionContext } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ClientsList, ClientRecord } from '@/components/clients/ClientsList'

export const metadata = {
  title: 'Clients Directory | INNOVENTIX Hub',
  description: 'Manage agency client records, communication modes, and platform channels.',
}

export default async function ClientsPage() {
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

  let clientsDataRaw: any[] = []
  try {
    const { data: clientsData, error } = await supabase
      .from('clients')
      .select('*')
      .eq('organization_id', session.organization.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching clients:', error)
    }
    clientsDataRaw = clientsData || []
  } catch (err) {
    console.error('Error in clients query:', err)
  }

  if (process.env.DEV_SUPER_ADMIN === 'true' && (global as any).__DEV_CLIENTS && (global as any).__DEV_CLIENTS.length > 0) {
    clientsDataRaw = [...(global as any).__DEV_CLIENTS, ...clientsDataRaw]
  }

  const clients: ClientRecord[] = (clientsDataRaw || []).map((c: any) => ({
    id: c.id,
    organization_id: c.organization_id,
    name: c.name,
    company: c.company,
    email: c.email,
    phone: c.phone,
    platform: c.platform,
    country: c.country,
    currency: c.currency,
    payment_schedule: c.payment_schedule,
    status: c.status,
    communication_mode: c.communication_mode,
    notes: c.notes,
    created_at: c.created_at,
    updated_at: c.updated_at,
  }))

  return (
    <div className="space-y-6">
      <ClientsList
        initialClients={clients}
        userRole={session.role}
        isSuperAdmin={session.isSuperAdmin}
      />
    </div>
  )
}
