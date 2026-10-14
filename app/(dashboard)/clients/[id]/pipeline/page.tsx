import { getCurrentSessionContext } from '@/lib/auth/session'
import { queryOne } from '@/lib/db'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { KanbanBoard } from '@/components/leads/KanbanBoard'
import { isAIAccessible } from '@/lib/ai/client'
import { ArrowLeft, Kanban } from 'lucide-react'

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
      <div className="rounded-2xl border border-border bg-card/50 p-8 text-center text-muted-foreground">
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

  let rawClient: any = null
  try {
    rawClient = await queryOne<any>(
      `SELECT * FROM clients WHERE id = $1 AND organization_id = $2`,
      [params.id, session.organization.id]
    )
  } catch (err) {}

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
      <div className="flex flex-col gap-2 border-b border-border pb-4">
        <Link
          href={`/clients/${clientDeal.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to {clientDeal.name} Profile</span>
        </Link>

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary">
            <Kanban className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">
              {clientDeal.name} — Deal Pipeline
            </h1>
            <p className="text-xs text-muted-foreground">
              Manage stage progress and deal status for this client.
            </p>
          </div>
        </div>
      </div>

      <KanbanBoard initialDeals={[clientDeal]} aiEnabled={aiEnabled} />
    </div>
  )
}
