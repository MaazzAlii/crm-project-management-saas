import { query, queryOne } from '@/lib/db'

export const AUDIT_ACTIONS = {
  // Auth
  USER_LOGGED_IN: 'USER_LOGGED_IN',
  USER_LOGGED_OUT: 'USER_LOGGED_OUT',
  USER_LOGIN_FAILED: 'USER_LOGIN_FAILED',
  USER_SIGNUP: 'USER_SIGNUP',
  PASSWORD_RESET_REQUESTED: 'PASSWORD_RESET_REQUESTED',
  PASSWORD_RESET_COMPLETED: 'PASSWORD_RESET_COMPLETED',

  // Organization
  ORGANIZATION_CREATED: 'ORGANIZATION_CREATED',
  ORGANIZATION_PROFILE_UPDATE: 'ORGANIZATION_PROFILE_UPDATE',
  ORGANIZATION_SUSPENDED: 'ORGANIZATION_SUSPENDED',
  ORGANIZATION_RESUMED: 'ORGANIZATION_RESUMED',
  ORGANIZATION_PLAN_OVERRIDDEN: 'ORGANIZATION_PLAN_OVERRIDDEN',

  // Team & Permissions
  TEAM_MEMBER_INVITED: 'TEAM_MEMBER_INVITED',
  TEAM_MEMBER_ROLE_UPDATED: 'TEAM_MEMBER_ROLE_UPDATED',
  TEAM_MEMBER_REMOVED: 'TEAM_MEMBER_REMOVED',
  INVITATION_REVOKED: 'INVITATION_REVOKED',

  // CRM
  CLIENT_CREATED: 'CLIENT_CREATED',
  CLIENT_UPDATED: 'CLIENT_UPDATED',
  CLIENT_DELETED: 'CLIENT_DELETED',
  LEAD_CREATED: 'LEAD_CREATED',
  LEAD_STATUS_CHANGED: 'LEAD_STATUS_CHANGED',
  LEAD_DELETED: 'LEAD_DELETED',
  CLIENT_COMMUNICATION_LOGGED: 'CLIENT_COMMUNICATION_LOGGED',

  // Projects & Tasks
  PROJECT_CREATED: 'PROJECT_CREATED',
  PROJECT_UPDATED: 'PROJECT_UPDATED',
  PROJECT_STATUS_UPDATED: 'PROJECT_STATUS_UPDATED',
  PROJECT_DELETED: 'PROJECT_DELETED',
  PROJECT_DELIVERED_INVOICE_TRIGGERED: 'PROJECT_DELIVERED_INVOICE_TRIGGERED',
  TASK_CREATED: 'TASK_CREATED',
  TASK_UPDATED: 'TASK_UPDATED',
  TASK_STATUS_CHANGED: 'TASK_STATUS_CHANGED',
  TASK_DELETED: 'TASK_DELETED',
  DELIVERABLE_CREATED: 'DELIVERABLE_CREATED',
  DELIVERABLE_STATUS_UPDATED: 'DELIVERABLE_STATUS_UPDATED',
  DELIVERABLE_DELETED: 'DELIVERABLE_DELETED',

  // Billing
  CHECKOUT_SESSION_INITIATED: 'CHECKOUT_SESSION_INITIATED',
  STRIPE_CHECKOUT_COMPLETED: 'STRIPE_CHECKOUT_COMPLETED',
  STRIPE_SUBSCRIPTION_UPDATED: 'STRIPE_SUBSCRIPTION_UPDATED',
  STRIPE_SUBSCRIPTION_CANCELED: 'STRIPE_SUBSCRIPTION_CANCELED',
  STRIPE_PAYMENT_FAILED: 'STRIPE_PAYMENT_FAILED',
  BILLING_PORTAL_OPENED: 'BILLING_PORTAL_OPENED',

  // Super Admin
  SUPER_ADMIN_IMPERSONATION_START: 'SUPER_ADMIN_IMPERSONATION_START',
  SUPER_ADMIN_IMPERSONATION_END: 'SUPER_ADMIN_IMPERSONATION_END',
  SUPER_ADMIN_SETTINGS_UPDATED: 'SUPER_ADMIN_SETTINGS_UPDATED',

  // AI & Automation
  AI_FEATURE_TOGGLED: 'AI_FEATURE_TOGGLED',
  AI_PROVIDER_UPDATED: 'AI_PROVIDER_UPDATED',
  AUTOMATION_TRIGGERED: 'AUTOMATION_TRIGGERED',
  WEBHOOK_CONFIGURED: 'WEBHOOK_CONFIGURED',

  // Client Portal & Security
  PORTAL_SETTINGS_UPDATED: 'PORTAL_SETTINGS_UPDATED',
  PORTAL_USER_INVITED: 'PORTAL_USER_INVITED',
  PORTAL_USER_REVOKED: 'PORTAL_USER_REVOKED',
  API_KEY_ROTATED: 'API_KEY_ROTATED',
  DATA_EXPORTED: 'DATA_EXPORTED',
} as const

export type AuditActionType = keyof typeof AUDIT_ACTIONS | string

export interface AuditLogEvent {
  organizationId?: string | null
  actorId?: string | null
  actorEmail?: string | null
  actorName?: string | null
  actorIsSuperAdmin?: boolean
  action: AuditActionType
  targetType?: string
  entityType?: string
  targetId?: string
  entityId?: string
  details?: Record<string, any>
  metadata?: Record<string, any>
  ipAddress?: string | null
  userAgent?: string | null
}

export interface AuditLogRecord {
  id: string
  organization_id: string | null
  actor_user_id: string | null
  actor_is_super_admin: boolean
  actor_email: string | null
  actor_name: string | null
  action: string
  entity_type: string | null
  entity_id: string | null
  target_type: string | null
  target_id: string | null
  metadata: Record<string, any>
  details: Record<string, any>
  ip_address: string | null
  user_agent: string | null
  created_at: string
}


/**
 * Log a sensitive system, org, or super-admin event into the immutable audit_logs store.
 * Automatically injects impersonation provenance (impersonated_by, impersonated_as)
 * from the active session context if an impersonation session is active.
 */
export async function logAuditEvent(
  event: AuditLogEvent,
  explicitSession?: any
): Promise<boolean> {
  try {
    let actorId = event.actorId
    let actorEmail = event.actorEmail
    let actorName = event.actorName
    let actorIsSuperAdmin = event.actorIsSuperAdmin ?? false
    let organizationId = event.organizationId ?? null

    // Attempt to resolve session if not passed explicitly
    let session: any = explicitSession || null
    if (!session) {
      try {
        const { getCurrentSessionContext } = await import('@/lib/auth/session')
        session = await getCurrentSessionContext()
      } catch {
        // Fallback gracefully if request context is not standard
      }
    }

    if (session?.user) {
      if (!actorId) actorId = session.user.id
      if (!actorEmail) actorEmail = session.user.email || null
      if (!actorName) actorName = session.user.full_name || session.user.email?.split('@')[0] || null
      if (session.isSuperAdmin) actorIsSuperAdmin = true
      if (!organizationId && session.organization?.id) {
        organizationId = session.organization.id
      }
    }

    const effectiveEntityType = event.entityType || event.targetType || 'unknown'
    const effectiveEntityId = event.entityId || event.targetId || null
    const mergedDetails = { ...(event.details || {}), ...(event.metadata || {}) }

    // Guardrail 3: Auto-inject impersonation metadata at the helper level
    if (session?.impersonation?.isImpersonated) {
      mergedDetails.impersonated_by = session.impersonation.impersonatedBy
      mergedDetails.impersonated_by_email = session.impersonation.impersonatedByEmail
      mergedDetails.impersonated_as = session.impersonation.impersonatedAs
      mergedDetails.impersonated_org_id = session.impersonation.impersonatedOrgId
      if (!organizationId && session.impersonation.impersonatedOrgId) {
        organizationId = session.impersonation.impersonatedOrgId
      }
    }

    const record: AuditLogRecord = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      organization_id: organizationId,
      actor_user_id: actorId || null,
      actor_is_super_admin: actorIsSuperAdmin,
      actor_email: actorEmail || null,
      actor_name: actorName || null,
      action: event.action,
      entity_type: effectiveEntityType,
      entity_id: effectiveEntityId,
      target_type: effectiveEntityType,
      target_id: effectiveEntityId,
      metadata: mergedDetails,
      details: mergedDetails,
      ip_address: event.ipAddress || null,
      user_agent: event.userAgent || null,
      created_at: new Date().toISOString(),
    }


    // Persist to PostgreSQL Database
    try {
      await query(
        `INSERT INTO audit_logs (
          id, organization_id, actor_user_id, actor_is_super_admin,
          actor_email, actor_name, action, entity_type, entity_id,
          target_type, target_id, metadata, details, ip_address, user_agent, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
        [
          record.id,
          record.organization_id,
          record.actor_user_id,
          record.actor_is_super_admin,
          record.actor_email,
          record.actor_name,
          record.action,
          record.entity_type,
          record.entity_id,
          record.target_type,
          record.target_id,
          JSON.stringify(record.metadata || {}),
          JSON.stringify(record.details || {}),
          record.ip_address,
          record.user_agent,
          record.created_at,
        ]
      )
    } catch (dbErr) {
      // Non-blocking in dev if DB is offline
      console.warn('[AUDIT_LOG_DB_FALLBACK]', (dbErr as Error)?.message || dbErr)
    }

    // Log structured log entry to stdout for observability
    console.log('[AUDIT_LOG]', {
      timestamp: record.created_at,
      action: record.action,
      org: record.organization_id || 'PLATFORM_GLOBAL',
      actor: record.actor_email || record.actor_user_id || 'SYSTEM',
      isSuperAdmin: record.actor_is_super_admin,
      entity: `${record.entity_type}:${record.entity_id}`,
      details: record.details,
    })

    return true
  } catch (error) {
    console.error('Failed to log audit event:', error)
    return false
  }
}
