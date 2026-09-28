/**
 * =============================================================================
 * Innoventix Platform v2 — CRM & Sales Pipeline Service
 * =============================================================================
 * Business logic layer for Multi-Tenant CRM, Kanban Pipeline, Client Management,
 * Communication Logs, Tags, and CRM Analytics.
 */

import { clientRepo } from '../db/repositories/client-repo';
import { auditRepo } from '../db/repositories/audit-repo';
import { query, queryOne } from '../db';
import { NotFoundError, ValidationError } from '../utils/error-handler';
import { Client, LeadStatus, PaginationOptions } from '../types/database';

export class CrmService {
  /**
   * Get client by ID scoped to organization
   */
  async getClient(clientId: string, orgId: string): Promise<Client> {
    const client = await clientRepo.findById(clientId, orgId);
    if (!client) {
      throw new NotFoundError('Client not found');
    }
    return client;
  }

  /**
   * Create a new client
   */
  async createClient(
    orgId: string,
    actorUserId: string,
    data: {
      name: string;
      company?: string | null;
      email?: string | null;
      phone?: string | null;
      platform?: string | null;
      status?: 'active' | 'paused' | 'completed' | 'archived';
      communicationMode?: 'manual' | 'connected';
      notes?: string | null;
    }
  ): Promise<Client> {
    const client = await clientRepo.create(orgId, data);

    await auditRepo.log({
      organizationId: orgId,
      userId: actorUserId,
      action: 'CLIENT_CREATED',
      resourceType: 'client',
      resourceId: client.id,
      metadata: { name: client.name, email: client.email },
    });

    return client;
  }

  /**
   * Update client details with strict communication mode rules
   */
  async updateClient(
    clientId: string,
    orgId: string,
    actorUserId: string,
    data: Partial<Omit<Client, 'id' | 'organization_id' | 'created_at'>>
  ): Promise<Client> {
    const current = await this.getClient(clientId, orgId);

    // Enforce strict one-way promotion: once 'connected', client cannot be reverted to 'manual'
    if (current.communication_mode === 'connected' && data.communication_mode === 'manual') {
      throw new ValidationError('A connected communication channel cannot be reverted to manual mode.');
    }

    const updated = await clientRepo.update(clientId, orgId, data);
    if (!updated) {
      throw new NotFoundError('Client not found');
    }

    await auditRepo.log({
      organizationId: orgId,
      userId: actorUserId,
      action: 'CLIENT_UPDATED',
      resourceType: 'client',
      resourceId: clientId,
      metadata: data,
    });

    return updated;
  }

  /**
   * Delete a client
   */
  async deleteClient(clientId: string, orgId: string, actorUserId: string): Promise<boolean> {
    await this.getClient(clientId, orgId);
    const deleted = await clientRepo.delete(clientId, orgId);

    await auditRepo.log({
      organizationId: orgId,
      userId: actorUserId,
      action: 'CLIENT_DELETED',
      resourceType: 'client',
      resourceId: clientId,
    });

    return deleted;
  }

  /**
   * List clients for an organization
   */
  async listClients(
    orgId: string,
    options?: PaginationOptions & { status?: string; search?: string; communicationMode?: 'manual' | 'connected' }
  ) {
    return await clientRepo.list(orgId, options);
  }

  /**
   * Get Kanban Leads pipeline
   */
  async getLeadsPipeline(orgId: string) {
    return await clientRepo.getLeadsPipeline(orgId);
  }

  /**
   * Create a new lead / deal in the CRM pipeline
   */
  async createLead(
    orgId: string,
    actorUserId: string,
    data: {
      clientId: string;
      title: string;
      status?: LeadStatus;
      value?: number;
      currency?: string;
      aiScore?: number;
    }
  ) {
    const lead = await clientRepo.createLead(orgId, data);

    await auditRepo.log({
      organizationId: orgId,
      userId: actorUserId,
      action: 'LEAD_CREATED',
      resourceType: 'lead',
      resourceId: lead.id,
      metadata: { title: lead.title, clientId: lead.client_id, value: lead.value },
    });

    return lead;
  }

  /**
   * Transition lead status in the sales pipeline
   */
  async updateLeadStage(
    leadId: string,
    orgId: string,
    actorUserId: string,
    status: LeadStatus,
    stageOrder?: number
  ) {
    const updated = await clientRepo.updateLeadStage(leadId, orgId, status, stageOrder);
    if (!updated) {
      throw new NotFoundError('Lead not found');
    }

    await auditRepo.log({
      organizationId: orgId,
      userId: actorUserId,
      action: 'LEAD_STAGE_UPDATED',
      resourceType: 'lead',
      resourceId: leadId,
      metadata: { newStatus: status, stageOrder },
    });

    return updated;
  }

  /**
   * Log an interaction or communication entry for a client
   */
  async createInteraction(
    orgId: string,
    actorUserId: string,
    data: {
      clientId: string;
      type: 'call' | 'email' | 'meeting' | 'note' | 'whatsapp';
      subject?: string;
      content: string;
    }
  ) {
    await this.getClient(data.clientId, orgId);

    const sql = `
      INSERT INTO communication_logs (organization_id, client_id, logged_by, type, subject, content)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const res = await query(sql, [
      orgId,
      data.clientId,
      actorUserId,
      data.type,
      data.subject || null,
      data.content,
    ]);

    const entry = res.rows[0];

    await auditRepo.log({
      organizationId: orgId,
      userId: actorUserId,
      action: 'COMMUNICATION_LOGGED',
      resourceType: 'communication_log',
      resourceId: entry.id,
      metadata: { clientId: data.clientId, type: data.type },
    });

    return entry;
  }

  /**
   * Get interactions / communication log for an organization or client
   */
  async getInteractions(orgId: string, clientId?: string, pagination?: PaginationOptions) {
    let sql = 'SELECT * FROM communication_logs WHERE organization_id = $1';
    const values: any[] = [orgId];

    if (clientId) {
      values.push(clientId);
      sql += ` AND client_id = $${values.length}`;
    }

    sql += ' ORDER BY created_at DESC';

    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const offset = (page - 1) * limit;

    values.push(limit, offset);
    sql += ` LIMIT $${values.length - 1} OFFSET $${values.length}`;

    const res = await query(sql, values);
    return res.rows;
  }

  /**
   * Get all tags for an organization
   */
  async getTags(orgId: string) {
    const res = await query('SELECT * FROM client_tags WHERE organization_id = $1 ORDER BY name ASC', [orgId]);
    return res.rows;
  }

  /**
   * Create a new client tag
   */
  async createTag(orgId: string, data: { name: string; color?: string }) {
    const res = await query(
      `INSERT INTO client_tags (organization_id, name, color)
       VALUES ($1, $2, $3)
       ON CONFLICT (organization_id, name) DO UPDATE SET color = EXCLUDED.color
       RETURNING *`,
      [orgId, data.name, data.color || '#6366f1']
    );
    return res.rows[0];
  }

  /**
   * Get CRM analytics metrics (pipeline total, deal counts, conversion rates)
   */
  async getCrmAnalytics(orgId: string) {
    const [pipelineRes, clientCounts, recentDeals] = await Promise.all([
      query(
        `SELECT 
           status, 
           COUNT(*) as count, 
           COALESCE(SUM(value), 0) as total_value 
         FROM leads_pipeline 
         WHERE organization_id = $1 
         GROUP BY status`,
        [orgId]
      ),
      queryOne<{ total: string; active: string }>(
        `SELECT 
           COUNT(*) as total, 
           COUNT(*) FILTER (WHERE status = 'active') as active 
         FROM clients 
         WHERE organization_id = $1`,
        [orgId]
      ),
      query(
        `SELECT * FROM leads_pipeline 
         WHERE organization_id = $1 
         ORDER BY created_at DESC 
         LIMIT 5`,
        [orgId]
      ),
    ]);

    const totalPipelineValue = pipelineRes.rows.reduce(
      (acc, r) => acc + parseFloat(r.total_value || '0'),
      0
    );

    return {
      totalPipelineValue,
      stages: pipelineRes.rows,
      clients: {
        total: parseInt(clientCounts?.total || '0', 10),
        active: parseInt(clientCounts?.active || '0', 10),
      },
      recentDeals: recentDeals.rows,
    };
  }
}

export const crmService = new CrmService();
