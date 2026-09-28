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
    userId?: string | null;
    action: AuditAction | string;
    resourceType: string;
    resourceId?: string | null;
    metadata?: Record<string, any>;
    ipAddress?: string | null;
    userAgent?: string | null;
  }): Promise<AuditLog> {
    try {
      const insertData = {
        organization_id: data.organizationId || null,
        user_id: data.userId || null,
        action: data.action,
        resource_type: data.resourceType,
        resource_id: data.resourceId || null,
        metadata: JSON.stringify(data.metadata || {}),
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
      userId?: string;
      action?: string;
      resourceType?: string;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<{ logs: AuditLog[]; total: number }> {
    try {
      const where: any[] = [];
      if (options?.userId) {
        where.push({ field: 'user_id', operator: '=', value: options.userId });
      }
      if (options?.action) {
        where.push({ field: 'action', operator: '=', value: options.action });
      }
      if (options?.resourceType) {
        where.push({ field: 'resource_type', operator: '=', value: options.resourceType });
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
    title: string;
    message: string;
    type?: 'info' | 'success' | 'warning' | 'error';
    link?: string | null;
  }): Promise<InAppNotification> {
    try {
      const insertData = {
        organization_id: data.organizationId,
        user_id: data.userId,
        title: data.title.trim(),
        message: data.message.trim(),
        type: data.type || 'info',
        link: data.link || null,
        is_read: false,
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
        WHERE user_id = $1 AND organization_id = $2 ${unreadOnly ? 'AND is_read = false' : ''}
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
        'UPDATE in_app_notifications SET is_read = true, updated_at = NOW() WHERE id = $1 AND user_id = $2',
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
