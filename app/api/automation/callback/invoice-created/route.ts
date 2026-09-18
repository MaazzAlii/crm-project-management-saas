import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyAutomationSignature } from '@/lib/automation/emitter'
import { logAuditEvent } from '@/lib/audit/logger'

export const dynamic = 'force-dynamic'

/**
 * N8N Flow 1 Callback Webhook
 * Receives confirmation from n8n / Invoice Generator that an invoice has been generated & dispatched.
 * Updates project status to 'invoiced' and notifies the team.
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    const signature = req.headers.get('x-automation-signature') || ''

    if (!rawBody) {
      return NextResponse.json({ error: 'Empty request body' }, { status: 400 })
    }

    let payload: any
    try {
      payload = JSON.parse(rawBody)
    } catch {
      return NextResponse.json({ error: 'Malformed JSON payload' }, { status: 400 })
    }

    const {
      project_id,
      organization_id,
      invoice_id,
      invoice_url,
      amount,
      status = 'invoiced',
    } = payload

    if (!project_id) {
      return NextResponse.json({ error: 'Missing project_id in payload' }, { status: 400 })
    }

    const supabase = await createClient()

    // 1. Authenticate callback via signature
    let secret = process.env.N8N_WEBHOOK_SECRET || process.env.AUTOMATION_WEBHOOK_SECRET || ''
    if (organization_id) {
      const { data: org } = await supabase
        .from('organizations')
        .select('automation_webhook_secret')
        .eq('id', organization_id)
        .maybeSingle()

      if (org?.automation_webhook_secret) {
        secret = org.automation_webhook_secret
      }
    }

    if (secret) {
      if (!signature) {
        return NextResponse.json(
          { error: 'Missing X-Automation-Signature header' },
          { status: 401 }
        )
      }

      const isValid = verifyAutomationSignature(rawBody, signature, secret)
      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid HMAC signature' },
          { status: 401 }
        )
      }
    }

    // 2. Fetch project and client details
    const { data: project } = await supabase
      .from('projects')
      .select('id, title, organization_id, client:clients(id, name, email)')
      .eq('id', project_id)
      .maybeSingle()

    const orgId = organization_id || project?.organization_id

    // 3. Update project status to 'invoiced'
    const { error: updateError } = await supabase
      .from('projects')
      .update({
        status: 'invoiced',
        invoice_triggered: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', project_id)

    if (updateError) {
      console.error('[Automation:Callback] Database update failed:', updateError)
      return NextResponse.json(
        { error: 'Failed to update project status in database' },
        { status: 500 }
      )
    }

    // 4. Log Audit Event
    try {
      await logAuditEvent({
        action: 'INVOICE_CREATED_CONFIRMED',
        targetType: 'project',
        targetId: project_id,
        details: {
          organizationId: orgId,
          invoiceId: invoice_id,
          invoiceUrl: invoice_url,
          amount,
          status: 'invoiced',
        },
      })
    } catch (e) {}

    console.log('[Automation:Callback] Successfully confirmed invoice creation for project:', {
      project_id,
      invoice_id,
      status: 'invoiced',
    })

    return NextResponse.json({
      success: true,
      project_id,
      status: 'invoiced',
      invoice_id,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('[Automation:Callback] Error processing invoice callback:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
