/**
 * =============================================================================
 * Innoventix Platform v2 — Audit Log & Notification Repository
 * =============================================================================
 * Domain data access layer for Immutable Audit Trail & In-App Notifications.
 */

import { query, queryOne } from '../index';
import { buildSelectQuery, buildInsertQuery, PaginationOptions } from '../query-builder';
import { AuditLog, InAppNotification, AuditAction } from '../../types/database';

export class AuditRepository {
  /**
   * Insert an immutable audit log entry
   */
  async log(data: {
    organizationId?: string | null;
    actorUserId?: string | null;
    actorIsSuperAdmin?: boolean;
    actorEmail?: string | null;
    actorName?: string | null;
    action: AuditAction | string;
    entityType?: string | null;
    entityId?: string | null;
    metadata?: Record<string, any>;
    ipAddress?: string | null;
    userAgent?: string | null;
  }): Promise<AuditLog> {
    try {
      const insertData = {
        organization_id: data.organizationId || null,
        actor_user_id: data.actorUserId || null,
        actor_is_super_admin: data.actorIsSuperAdmin || false,
        actor_email: data.actorEmail || null,
        actor_name: data.actorName || null,
        action: data.action,
        entity_type: data.entityType || null,
        entity_id: data.entityId || null,
        metadata: JSON.stringify(data.metadata || {}),
        details: JSON.stringify(data.metadata || {}),
        ip_address: data.ipAddress || null,
        user_agent: data.userAgent || null,
      };

      const q = buildInsertQuery('audit_logs', insertData);
      const res = await query<AuditLog>(q.text, q.values);
      return res.rows[0];
    } catch (error) {
      console.error('[AuditRepository.log] Error recording audit log:', error);
      throw error;
    }
  }

  /**
   * Query audit logs with multi-tenant filtering & pagination
   */
  async queryLogs(
    orgId?: string,
    options?: PaginationOptions & {
      actorUserId?: string;
      action?: string;
      entityType?: string;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<{ logs: AuditLog[]; total: number }> {
    try {
      const where: any[] = [];
      if (options?.actorUserId) {
        where.push({ field: 'actor_user_id', operator: '=', value: options.actorUserId });
      }
      if (options?.action) {
        where.push({ field: 'action', operator: '=', value: options.action });
      }
      if (options?.entityType) {
        where.push({ field: 'entity_type', operator: '=', value: options.entityType });
      }
      if (options?.startDate) {
        where.push({ field: 'created_at', operator: '>=', value: options.startDate });
      }
      if (options?.endDate) {
        where.push({ field: 'created_at', operator: '<=', value: options.endDate });
      }

      const selectQ = buildSelectQuery({
        table: 'audit_logs',
        orgId,
        where,
        pagination: options || { page: 1, limit: 50, orderBy: 'created_at', orderDirection: 'DESC' },
      });

      const countSql = `SELECT COUNT(*) as count FROM audit_logs ${
        orgId ? 'WHERE organization_id = $1' : ''
      }`;
      const countParams = orgId ? [orgId] : [];

      const [dataRes, countRes] = await Promise.all([
        query<AuditLog>(selectQ.text, selectQ.values),
        queryOne<{ count: string }>(countSql, countParams),
      ]);

      return {
        logs: dataRes.rows,
        total: parseInt(countRes?.count || '0', 10),
      };
    } catch (error) {
      console.error('[AuditRepository.queryLogs] Error querying audit logs:', error);
      throw error;
    }
  }

  /**
   * Create an in-app notification
   */
  async createNotification(data: {
    organizationId: string;
    userId: string;
    type?: string;
    title: string;
    body?: string | null;
    relatedEntityType?: string | null;
    relatedEntityId?: string | null;
  }): Promise<InAppNotification> {
    try {
      const insertData = {
        organization_id: data.organizationId,
        user_id: data.userId,
        type: data.type || 'status_changed',
        title: data.title.trim(),
        body: data.body || null,
        related_entity_type: data.relatedEntityType || null,
        related_entity_id: data.relatedEntityId || null,
      };

      const q = buildInsertQuery('in_app_notifications', insertData);
      const res = await query<InAppNotification>(q.text, q.values);
      return res.rows[0];
    } catch (error) {
      console.error('[AuditRepository.createNotification] Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Get notifications for a user in an organization
   */
  async getNotifications(
    userId: string,
    orgId: string,
    unreadOnly: boolean = false
  ): Promise<InAppNotification[]> {
    try {
      const sql = `
        SELECT * FROM in_app_notifications 
        WHERE user_id = $1 AND organization_id = $2 ${unreadOnly ? 'AND read_at IS NULL' : ''}
        ORDER BY created_at DESC 
        LIMIT 50
      `;
      const res = await query<InAppNotification>(sql, [userId, orgId]);
      return res.rows;
    } catch (error) {
      console.error(`[AuditRepository.getNotifications] Error fetching notifications for ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Mark a notification as read
   */
  async markNotificationRead(notificationId: string, userId: string): Promise<boolean> {
    try {
      const res = await query(
        'UPDATE in_app_notifications SET read_at = NOW() WHERE id = $1 AND user_id = $2',
        [notificationId, userId]
      );
      return (res.rowCount ?? 0) > 0;
    } catch (error) {
      console.error(`[AuditRepository.markNotificationRead] Error marking notification ${notificationId} as read:`, error);
      throw error;
    }
  }
}

export const auditRepo = new AuditRepository();
