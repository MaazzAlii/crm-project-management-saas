/**
 * =============================================================================
 * Innoventix Platform v2 — CRM Client & Leads Repository
 * =============================================================================
 * Domain data access layer for Multi-Tenant Clients, Leads, Pipeline, and Tags.
 */

import { query, queryOne, transaction } from '../index';
import { buildSelectQuery, buildInsertQuery, buildUpdateQuery, buildDeleteQuery, PaginationOptions } from '../query-builder';
import { Client, Lead, LeadStatus, Tag } from '../../types/database';

export class ClientRepository {
  /**
   * Find a client by UUID strictly scoped to an organization
   */
  async findById(id: string, orgId: string): Promise<Client | null> {
    try {
      return await queryOne<Client>(
        'SELECT * FROM clients WHERE id = $1 AND organization_id = $2',
        [id, orgId]
      );
    } catch (error) {
      console.error(`[ClientRepository.findById] Error fetching client ${id} for org ${orgId}:`, error);
      throw error;
    }
  }

  /**
   * Create a new client within an organization
   */
  async create(orgId: string, data: {
    name: string;
    company?: string | null;
    email?: string | null;
    phone?: string | null;
    platform?: string | null;
    country?: string | null;
    status?: 'active' | 'paused' | 'completed' | 'archived';
    communicationMode?: 'manual' | 'connected';
    currency?: string;
    paymentSchedule?: string;
    notes?: string | null;
  }): Promise<Client> {
    try {
      const insertData = {
        organization_id: orgId,
        name: data.name.trim(),
        company: data.company || null,
        email: data.email ? data.email.toLowerCase().trim() : null,
        phone: data.phone || null,
        platform: data.platform || 'Email',
        country: data.country || null,
        status: data.status || 'active',
        communication_mode: data.communicationMode || 'manual',
        currency: data.currency || 'USD',
        payment_schedule: data.paymentSchedule || 'Per Project',
        notes: data.notes || null,
      };

      const q = buildInsertQuery('clients', insertData);
      const res = await query<Client>(q.text, q.values);
      return res.rows[0];
    } catch (error) {
      console.error('[ClientRepository.create] Error creating client:', error);
      throw error;
    }
  }

  /**
   * Update client details with tenant guard
   */
  async update(
    id: string,
    orgId: string,
    data: Partial<Omit<Client, 'id' | 'organization_id' | 'created_at'>>
  ): Promise<Client | null> {
    try {
      const updateData: Record<string, any> = { ...data, updated_at: new Date() };

      const q = buildUpdateQuery({
        table: 'clients',
        data: updateData,
        id,
        orgId,
      });

      const res = await query<Client>(q.text, q.values);
      return res.rows[0] || null;
    } catch (error) {
      console.error(`[ClientRepository.update] Error updating client ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a client with tenant guard
   */
  async delete(id: string, orgId: string): Promise<boolean> {
    try {
      const q = buildDeleteQuery({ table: 'clients', id, orgId });
      const res = await query(q.text, q.values);
      return (res.rowCount ?? 0) > 0;
    } catch (error) {
      console.error(`[ClientRepository.delete] Error deleting client ${id}:`, error);
      throw error;
    }
  }

  /**
   * List clients for an organization with filtering & pagination
   */
  async list(
    orgId: string,
    options?: PaginationOptions & {
      status?: string;
      search?: string;
      communicationMode?: 'manual' | 'connected';
    }
  ): Promise<{ clients: Client[]; total: number }> {
    try {
      const where: any[] = [];
      if (options?.status) {
        where.push({ field: 'status', operator: '=', value: options.status });
      }
      if (options?.communicationMode) {
        where.push({ field: 'communication_mode', operator: '=', value: options.communicationMode });
      }
      if (options?.search) {
        where.push({ field: 'name', operator: 'ILIKE', value: `%${options.search}%` });
      }

      const selectQ = buildSelectQuery({
        table: 'clients',
        orgId,
        where,
        pagination: options || { page: 1, limit: 20, orderBy: 'created_at', orderDirection: 'DESC' },
      });

      const countSql = `SELECT COUNT(*) as count FROM clients WHERE organization_id = $1 ${
        options?.status ? 'AND status = $2' : ''
      }`;
      const countParams = options?.status ? [orgId, options.status] : [orgId];

      const [dataRes, countRes] = await Promise.all([
        query<Client>(selectQ.text, selectQ.values),
        queryOne<{ count: string }>(countSql, countParams),
      ]);

      return {
        clients: dataRes.rows,
        total: parseInt(countRes?.count || '0', 10),
      };
    } catch (error) {
      console.error('[ClientRepository.list] Error listing clients:', error);
      throw error;
    }
  }

  /**
   * Fetch Kanban Leads Pipeline grouped by stage
   */
  async getLeadsPipeline(orgId: string): Promise<Record<LeadStatus, Lead[]>> {
    try {
      const res = await query<Lead>(
        `SELECT * FROM leads 
         WHERE organization_id = $1 
         ORDER BY stage_order ASC, created_at DESC`,
        [orgId]
      );

      const pipeline: Record<LeadStatus, Lead[]> = {
        discovery: [],
        proposal_sent: [],
        negotiation: [],
        won: [],
        lost: [],
      };

      for (const lead of res.rows) {
        if (pipeline[lead.status]) {
          pipeline[lead.status].push(lead);
        }
      }

      return pipeline;
    } catch (error) {
      console.error('[ClientRepository.getLeadsPipeline] Error fetching pipeline:', error);
      throw error;
    }
  }

  /**
   * Update lead status / Kanban stage
   */
  async updateLeadStage(
    leadId: string,
    orgId: string,
    status: LeadStatus,
    stageOrder?: number
  ): Promise<Lead | null> {
    try {
      const sql = `
        UPDATE leads 
        SET status = $1, 
            stage_order = COALESCE($2, stage_order),
            updated_at = NOW() 
        WHERE id = $3 AND organization_id = $4 
        RETURNING *
      `;
      return await queryOne<Lead>(sql, [status, stageOrder || null, leadId, orgId]);
    } catch (error) {
      console.error(`[ClientRepository.updateLeadStage] Error updating lead ${leadId}:`, error);
      throw error;
    }
  }

  /**
   * Assign tags to a client
   */
  async assignTags(clientId: string, orgId: string, tagIds: string[]): Promise<void> {
    await transaction(async (client) => {
      // Clear existing tag associations
      await client.query(
        'DELETE FROM client_tags WHERE client_id = $1',
        [clientId]
      );

      // Insert new tags
      for (const tagId of tagIds) {
        await client.query(
          `INSERT INTO client_tags (client_id, tag_id)
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [clientId, tagId]
        );
      }
    });
  }

  /**
   * Get all tags associated with a client
   */
  async getTags(clientId: string, orgId: string): Promise<Tag[]> {
    try {
      const sql = `
        SELECT t.* FROM tags t
        JOIN client_tags ct ON ct.tag_id = t.id
        WHERE ct.client_id = $1 AND t.organization_id = $2
        ORDER BY t.name ASC
      `;
      const res = await query<Tag>(sql, [clientId, orgId]);
      return res.rows;
    } catch (error) {
      console.error(`[ClientRepository.getTags] Error fetching tags for client ${clientId}:`, error);
      throw error;
    }
  }
}

export const clientRepo = new ClientRepository();
