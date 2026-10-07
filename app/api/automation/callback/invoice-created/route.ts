import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { verifyAutomationSignature } from '@/lib/automation/emitter'
import { logAuditEvent } from '@/lib/audit/logger'
import { readValidatedBody } from '@/lib/security/payload'

export const dynamic = 'force-dynamic'

/**
 * N8N Flow 1 Callback Webhook
 * Receives confirmation from n8n / Invoice Generator that an invoice has been generated & dispatched.
 * Updates project status to 'invoiced' and notifies the team.
 */
export async function POST(req: NextRequest) {
  try {
    const { body: rawBody, error: bodyError, status: bodyStatus } = await readValidatedBody(req)
    if (bodyError || !rawBody) {
      return NextResponse.json({ error: bodyError || 'Empty request body' }, { status: bodyStatus || 400 })
    }

    const signature = req.headers.get('x-automation-signature') || ''

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

    // 1. Authenticate callback via signature
    let secret = process.env.N8N_WEBHOOK_SECRET || process.env.AUTOMATION_WEBHOOK_SECRET || ''
    if (organization_id) {
      const org = await queryOne<{ automation_webhook_secret: string }>(
        `SELECT automation_webhook_secret FROM organizations WHERE id = $1`,
        [organization_id]
      )

      if (org?.automation_webhook_secret) {
        secret = org.automation_webhook_secret
      }
    }

    if (secret) {
      if (!signature) {
        return NextResponse.json({ error: 'Missing X-Automation-Signature header' }, { status: 401 })
      }

      const isValid = verifyAutomationSignature(rawBody, signature, secret)
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid HMAC signature' }, { status: 401 })
      }
    }

    // 2. Fetch project details
    const project = await queryOne<{ id: string; title: string; organization_id: string }>(
      `SELECT id, title, organization_id FROM projects WHERE id = $1`,
      [project_id]
    )

    const orgId = organization_id || project?.organization_id

    // 3. Update project status to 'invoiced'
    try {
      await query(
        `UPDATE projects
         SET status = 'invoiced', invoice_triggered = true, updated_at = NOW()
         WHERE id = $1`,
        [project_id]
      )
    } catch (updateError) {
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
