import { getCurrentSessionContext } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { KanbanBoard } from '@/components/leads/KanbanBoard'

export const metadata = {
  title: 'Sales Pipeline (Kanban) | INNOVENTIX Hub',
  description: 'Track lead prospects, stage transitions, deal values, and client win conversions.',
}

export default async function LeadsPage() {
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

  let rawDeals: any[] = []
  try {
    const { data: clientsData, error } = await supabase
      .from('clients')
      .select('*')
      .eq('organization_id', session.organization.id)
      .order('stage_updated_at', { ascending: false })

    if (error) {
      console.error('Error fetching pipeline deals:', error)
    }
    rawDeals = clientsData || []
  } catch (err) {
    console.error('Error fetching leads:', err)
  }

  if (process.env.DEV_SUPER_ADMIN === 'true' && (global as any).__DEV_CLIENTS && (global as any).__DEV_CLIENTS.length > 0) {
    const devDeals = (global as any).__DEV_CLIENTS.filter(
      (c: any) => c.organization_id === session.organization?.id
    )
    rawDeals = [...devDeals, ...rawDeals]
  }

  // Map to structured deal records
  const deals = rawDeals.map((c: any) => ({
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
    status: c.status || 'lead',
    communication_mode: c.communication_mode || 'manual',
    pipeline_stage: c.pipeline_stage || (c.status === 'active' ? 'won' : 'new'),
    deal_value: c.deal_value || 5000,
    lost_reason: c.lost_reason || null,
    notes: c.notes,
    created_at: c.created_at,
    updated_at: c.updated_at,
    stage_updated_at: c.stage_updated_at || c.created_at,
  }))

  return (
    <div className="space-y-6">
      <KanbanBoard initialDeals={deals} />
    </div>
  )
}
