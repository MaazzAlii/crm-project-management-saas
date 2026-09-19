import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const AUDIT_ACTIONS = {
  // Auth
  USER_LOGGED_IN: 'USER_LOGGED_IN',
  USER_LOGGED_OUT: 'USER_LOGGED_OUT',
  USER_LOGIN_FAILED: 'USER_LOGIN_FAILED',
  USER_SIGNUP: 'USER_SIGNUP',

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

// Global in-memory storage fallback for dev and test environments
declare global {
  // eslint-disable-next-line no-var
  var __DEV_AUDIT_LOGS: AuditLogRecord[] | undefined
}

if (!global.__DEV_AUDIT_LOGS) {
  global.__DEV_AUDIT_LOGS = []
}

/**
 * Log a sensitive system, org, or super-admin event into the immutable audit_logs store.
 */
export async function logAuditEvent(event: AuditLogEvent): Promise<boolean> {
  try {
    let actorId = event.actorId
    let actorEmail = event.actorEmail
    let actorName = event.actorName
    let actorIsSuperAdmin = event.actorIsSuperAdmin ?? false
    let organizationId = event.organizationId ?? null

    // If actor details are not supplied, attempt to resolve from current Supabase session
    if (!actorId || !actorEmail) {
      try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          actorId = actorId || user.id
          actorEmail = actorEmail || user.email || null
          actorName = actorName || user.user_metadata?.full_name || user.email?.split('@')[0] || null

          if (!actorIsSuperAdmin) {
            const { data: sa } = await supabase
              .from('super_admins')
              .select('id')
              .eq('user_id', user.id)
              .maybeSingle()
            if (sa) actorIsSuperAdmin = true
          }
        }
      } catch {
        // Fallback gracefully if request context is not standard
      }
    }

    const effectiveEntityType = event.entityType || event.targetType || 'unknown'
    const effectiveEntityId = event.entityId || event.targetId || null
    const mergedDetails = { ...(event.details || {}), ...(event.metadata || {}) }

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

    // Always maintain dev store for fast integration testing
    if (global.__DEV_AUDIT_LOGS) {
      global.__DEV_AUDIT_LOGS.unshift(record)
      if (global.__DEV_AUDIT_LOGS.length > 500) {
        global.__DEV_AUDIT_LOGS.pop()
      }
    }

    // Persist to Supabase Database
    try {
      const adminClient = createAdminClient()
      const { error } = await adminClient.from('audit_logs').insert({
        id: record.id,
        organization_id: record.organization_id,
        actor_user_id: record.actor_user_id,
        actor_is_super_admin: record.actor_is_super_admin,
        actor_email: record.actor_email,
        actor_name: record.actor_name,
        action: record.action,
        entity_type: record.entity_type,
        entity_id: record.entity_id,
        target_type: record.target_type,
        target_id: record.target_id,
        metadata: record.metadata,
        details: record.details,
        ip_address: record.ip_address,
        user_agent: record.user_agent,
        created_at: record.created_at,
      })

      if (error) {
        console.warn('[AUDIT_LOG_INSERT_WARN] Supabase table insert skipped or error:', error.message)
      }
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
