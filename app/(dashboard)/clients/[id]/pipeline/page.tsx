import { getCurrentSessionContext } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { KanbanBoard } from '@/components/leads/KanbanBoard'
import { isAIAccessible } from '@/lib/ai/client'
import { ArrowLeft, Kanban, Clock, ShieldCheck } from 'lucide-react'

export async function generateMetadata({ params }: { params: { id: string } }) {
  return {
    title: `Client Deal Pipeline | INNOVENTIX Hub`,
    description: 'Client-specific sales deal pipeline and stage history timeline.',
  }
}

export default async function ClientPipelinePage({ params }: { params: { id: string } }) {
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

  // Dual-tier gating check for AI lead scoring
  let aiEnabled = false
  try {
    const gateCheck = await isAIAccessible(session.organization.id, 'lead_scoring')
    aiEnabled = gateCheck.allowed
  } catch (e) {
    console.warn('AI lead scoring access check error:', e)
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
  } catch (err) {}

  if (!rawClient && process.env.DEV_SUPER_ADMIN === 'true' && (global as any).__DEV_CLIENTS) {
    rawClient = (global as any).__DEV_CLIENTS.find((c: any) => c.id === params.id)
  }

  if (!rawClient) {
    notFound()
  }

  const clientDeal = {
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
    status: rawClient.status || 'lead',
    communication_mode: rawClient.communication_mode || 'manual',
    pipeline_stage: rawClient.pipeline_stage || (rawClient.status === 'active' ? 'won' : 'new'),
    deal_value: rawClient.deal_value || 5000,
    lost_reason: rawClient.lost_reason || null,
    notes: rawClient.notes,
    lead_score: rawClient.lead_score ?? null,
    lead_score_updated_at: rawClient.lead_score_updated_at ?? null,
    lead_score_breakdown: rawClient.lead_score_breakdown ?? null,
    created_at: rawClient.created_at,
    updated_at: rawClient.updated_at,
    stage_updated_at: rawClient.stage_updated_at || rawClient.created_at,
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col gap-2 border-b border-slate-800 pb-4">
        <Link
          href={`/clients/${clientDeal.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-sky-400 transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to {clientDeal.name} Profile</span>
        </Link>

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
            <Kanban className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              {clientDeal.name} — Deal Pipeline
            </h1>
            <p className="text-xs text-slate-400">
              Manage stage progress and deal status for this client.
            </p>
          </div>
        </div>
      </div>

      <KanbanBoard initialDeals={[clientDeal]} aiEnabled={aiEnabled} />
    </div>
  )
}
