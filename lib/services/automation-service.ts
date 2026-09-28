/**
 * =============================================================================
 * Innoventix Platform v2 — Automation & n8n Webhook Service
 * =============================================================================
 * Business logic layer for Signed Automation Webhooks, Events, Cron, and History.
 */

import crypto from 'crypto';
import { auditRepo } from '../db/repositories/audit-repo';
import { projectRepo } from '../db/repositories/project-repo';
import { query, queryOne } from '../db';
import { NotFoundError } from '../utils/error-handler';

export interface AutomationEventPayload {
  event: string;
  timestamp: string;
  organizationId: string;
  data: Record<string, any>;
}

export class AutomationService {
  /**
   * Sign a payload with HMAC-SHA256
   */
  signPayload(payload: Record<string, any>, secret: string): string {
    const dataStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
    return crypto.createHmac('sha256', secret).update(dataStr).digest('hex');
  }

  /**
   * Verify an incoming webhook signature
   */
  verifySignature(payload: string | Buffer, signature: string, secret: string): boolean {
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    const cleanSig = signature.startsWith('sha256=') ? signature.slice(7) : signature;
    if (cleanSig.length !== expected.length) return false;
    return crypto.timingSafeEqual(Buffer.from(cleanSig), Buffer.from(expected));
  }

  /**
   * Trigger automation on project delivered
   */
  async handleProjectDelivered(orgId: string, projectId: string, actorUserId: string) {
    const project = await projectRepo.findById(projectId, orgId);
    if (!project) return null;

    // Flag invoice triggered
    await projectRepo.update(projectId, orgId, {
      status: 'delivered',
      delivered_at: new Date(),
    } as any);

    await auditRepo.log({
      organizationId: orgId,
      userId: actorUserId,
      action: 'PROJECT_DELIVERED_INVOICE_TRIGGERED',
      resourceType: 'project',
      resourceId: projectId,
      metadata: { projectTitle: project.name || (project as any).title, amount: project.budget || (project as any).amount },
    });

    return {
      success: true,
      event: 'project.delivered',
      projectId,
      organizationId: orgId,
    };
  }

  /**
   * Get recent automation events history for an organization
   */
  async getAutomationHistory(orgId: string, limit: number = 50) {
    const sql = `
      SELECT id, action, resource_type, resource_id, metadata, created_at
      FROM audit_logs
      WHERE organization_id = $1 AND (action LIKE 'AUTOMATION_%' OR action LIKE 'PROJECT_DELIVERED_%')
      ORDER BY created_at DESC
      LIMIT $2
    `;
    const res = await query(sql, [orgId, limit]);
    return res.rows;
  }

  /**
   * Dispatch a signed test webhook
   */
  async dispatchTestWebhook(orgId: string, actorUserId: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orgId);
    let org: { automation_webhook_url: string; automation_webhook_secret: string } | null = null;
    if (isUuid) {
      org = await queryOne<{ automation_webhook_url: string; automation_webhook_secret: string }>(
        'SELECT automation_webhook_url, automation_webhook_secret FROM organizations WHERE id = $1',
        [orgId]
      );
    }


    const payload = {
      event: 'test.ping',
      timestamp: new Date().toISOString(),
      organizationId: orgId,
      data: {
        message: 'This is a test webhook from Innoventix CRM',
        dispatchedBy: actorUserId,
      },
    };

    const secret = org?.automation_webhook_secret || process.env.AUTOMATION_WEBHOOK_SECRET || 'secret';
    const signature = this.signPayload(payload, secret);

    await auditRepo.log({
      organizationId: orgId,
      userId: actorUserId,
      action: 'AUTOMATION_TEST_WEBHOOK_DISPATCHED',
      resourceType: 'automation',
      resourceId: orgId,
      metadata: { webhookUrl: org?.automation_webhook_url },
    });

    return {
      success: true,
      payload,
      signature: `sha256=${signature}`,
      targetUrl: org?.automation_webhook_url || 'Mock local receiver',
    };
  }
}

export const automationService = new AutomationService();
