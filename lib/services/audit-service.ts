/**
 * =============================================================================
 * Innoventix Platform v2 — Audit & Notification Service
 * =============================================================================
 * Business logic layer for Immutable Audit Logging and In-App Notifications.
 */

import { auditRepo } from '../db/repositories/audit-repo';
import { query, queryOne } from '../db';
import { NotFoundError, ValidationError } from '../utils/error-handler';
import { AuditLog, InAppNotification, AuditAction, PaginationOptions } from '../types/database';

export class AuditService {
  /**
   * Record an immutable audit log event
   */
  async logEvent(data: {
    organizationId?: string | null;
    userId?: string | null;
    actorUserId?: string | null;
    actorIsSuperAdmin?: boolean;
    actorEmail?: string | null;
    actorName?: string | null;
    action: AuditAction | string;
    entityType?: string | null;
    resourceType?: string | null;
    entityId?: string | null;
    resourceId?: string | null;
    metadata?: Record<string, any>;
    ipAddress?: string | null;
    userAgent?: string | null;
  }): Promise<AuditLog> {
    return await auditRepo.log(data);
  }

  /**
   * Query tenant audit logs with pagination and filters
   */
  async getAuditLogs(
    orgId?: string,
    options?: PaginationOptions & {
      actorUserId?: string;
      action?: string;
      entityType?: string;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<{ logs: AuditLog[]; total: number }> {
    return await auditRepo.queryLogs(orgId, options);
  }

  /**
   * Create an in-app notification for a user
   */
  async createNotification(
    orgId: string,
    userId: string,
    data: {
      type: string;
      title: string;
      message: string;
      linkUrl?: string | null;
      metadata?: Record<string, any>;
    }
  ): Promise<InAppNotification> {
    if (!data.title || !data.message) {
      throw new ValidationError('Notification title and message are required');
    }

    return await auditRepo.createNotification(orgId, userId, data);
  }

  /**
   * Get notifications for a user
   */
  async getUserNotifications(
    userId: string,
    orgId?: string,
    options?: PaginationOptions & { unreadOnly?: boolean }
  ): Promise<{ notifications: InAppNotification[]; total: number; unreadCount: number }> {
    return await auditRepo.getUserNotifications(userId, orgId, options);
  }

  /**
   * Mark a single notification as read
   */
  async markNotificationAsRead(notificationId: string, userId: string): Promise<boolean> {
    return await auditRepo.markAsRead(notificationId, userId);
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllNotificationsAsRead(userId: string, orgId?: string): Promise<number> {
    return await auditRepo.markAllAsRead(userId, orgId);
  }
}

export const auditService = new AuditService();
