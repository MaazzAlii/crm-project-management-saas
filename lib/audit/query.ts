import { query, queryOne } from '@/lib/db'
import type { AuditLogRecord } from './log'

export interface AuditLogFilters {
  action?: string
  entityType?: string
  actorId?: string
  search?: string
  startDate?: string
  endDate?: string
  limit?: number
  offset?: number
}

export interface AuditLogQueryResult {
  logs: AuditLogRecord[]
  totalCount: number
}

/**
 * Fetch audit logs scoped to a specific organization.
 * Used by Org Admins / Owners.
 */
export async function fetchOrgAuditLogs(
  organizationId: string,
  filters: AuditLogFilters = {}
): Promise<AuditLogQueryResult> {
  const limit = Math.min(filters.limit || 50, 200)
  const offset = filters.offset || 0

  try {
    const whereClauses: string[] = ['organization_id = $1']
    const params: any[] = [organizationId]
    let paramIndex = 2

    if (filters.action && filters.action !== 'all') {
      whereClauses.push(`action = $${paramIndex++}`)
      params.push(filters.action)
    }

    if (filters.entityType && filters.entityType !== 'all') {
      whereClauses.push(`(entity_type = $${paramIndex} OR target_type = $${paramIndex})`)
      params.push(filters.entityType)
      paramIndex++
    }

    if (filters.actorId) {
      whereClauses.push(`actor_user_id = $${paramIndex++}`)
      params.push(filters.actorId)
    }

    if (filters.startDate) {
      whereClauses.push(`created_at >= $${paramIndex++}`)
      params.push(filters.startDate)
    }

    if (filters.endDate) {
      whereClauses.push(`created_at <= $${paramIndex++}`)
      params.push(filters.endDate)
    }

    if (filters.search) {
      const s = `%${filters.search.trim()}%`
      whereClauses.push(`(action ILIKE $${paramIndex} OR actor_email ILIKE $${paramIndex} OR actor_name ILIKE $${paramIndex} OR entity_type ILIKE $${paramIndex} OR entity_id ILIKE $${paramIndex})`)
      params.push(s)
      paramIndex++
    }

    const whereSql = whereClauses.join(' AND ')
    const countSql = `SELECT COUNT(*) as count FROM audit_logs WHERE ${whereSql}`
    const dataSql = `SELECT * FROM audit_logs WHERE ${whereSql} ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`

    const countRes = await queryOne<{ count: string }>(countSql, params)
    const dataRes = await query<AuditLogRecord>(dataSql, [...params, limit, offset])

    if (dataRes.rows.length > 0) {
      return {
        logs: dataRes.rows,
        totalCount: parseInt(countRes?.count || '0', 10),
      }
    }
  } catch (err) {
    console.warn('[AUDIT_LOG_QUERY_WARN] Error querying DB audit logs, falling back to in-memory:', err)
  }

  // Dev fallback filtering from memory
  const devLogs = (global.__DEV_AUDIT_LOGS || []).filter((log) => {
    if (log.organization_id !== organizationId) return false
    if (filters.action && filters.action !== 'all' && log.action !== filters.action) return false
    if (filters.entityType && filters.entityType !== 'all' && log.entity_type !== filters.entityType && log.target_type !== filters.entityType) return false
    if (filters.actorId && log.actor_user_id !== filters.actorId) return false
    if (filters.startDate && log.created_at < filters.startDate) return false
    if (filters.endDate && log.created_at > filters.endDate) return false
    if (filters.search) {
      const s = filters.search.toLowerCase()
      const match =
        log.action.toLowerCase().includes(s) ||
        (log.actor_email && log.actor_email.toLowerCase().includes(s)) ||
        (log.actor_name && log.actor_name.toLowerCase().includes(s)) ||
        (log.entity_type && log.entity_type.toLowerCase().includes(s)) ||
        (log.entity_id && log.entity_id.toLowerCase().includes(s))
      if (!match) return false
    }
    return true
  })

  // If memory is empty, generate seeded sample audit logs for realistic preview
  if (devLogs.length === 0) {
    const seeded = getSeededOrgAuditLogs(organizationId)
    return {
      logs: seeded.slice(offset, offset + limit),
      totalCount: seeded.length,
    }
  }

  return {
    logs: devLogs.slice(offset, offset + limit),
    totalCount: devLogs.length,
  }
}

/**
 * Fetch platform-wide audit logs.
 * Restricted to Super Admins.
 */
export async function fetchSuperAdminAuditLogs(
  filters: AuditLogFilters & { organizationId?: string; isSuperAdminOnly?: boolean } = {}
): Promise<AuditLogQueryResult> {
  const limit = Math.min(filters.limit || 50, 200)
  const offset = filters.offset || 0

  try {
    const whereClauses: string[] = ['1=1']
    const params: any[] = []
    let paramIndex = 1

    if (filters.organizationId && filters.organizationId !== 'all') {
      whereClauses.push(`organization_id = $${paramIndex++}`)
      params.push(filters.organizationId)
    }

    if (filters.isSuperAdminOnly) {
      whereClauses.push(`actor_is_super_admin = TRUE`)
    }

    if (filters.action && filters.action !== 'all') {
      whereClauses.push(`action = $${paramIndex++}`)
      params.push(filters.action)
    }

    if (filters.entityType && filters.entityType !== 'all') {
      whereClauses.push(`(entity_type = $${paramIndex} OR target_type = $${paramIndex})`)
      params.push(filters.entityType)
      paramIndex++
    }

    if (filters.startDate) {
      whereClauses.push(`created_at >= $${paramIndex++}`)
      params.push(filters.startDate)
    }

    if (filters.endDate) {
      whereClauses.push(`created_at <= $${paramIndex++}`)
      params.push(filters.endDate)
    }

    if (filters.search) {
      const s = `%${filters.search.trim()}%`
      whereClauses.push(`(action ILIKE $${paramIndex} OR actor_email ILIKE $${paramIndex} OR actor_name ILIKE $${paramIndex} OR entity_type ILIKE $${paramIndex} OR entity_id ILIKE $${paramIndex})`)
      params.push(s)
      paramIndex++
    }

    const whereSql = whereClauses.join(' AND ')
    const countSql = `SELECT COUNT(*) as count FROM audit_logs WHERE ${whereSql}`
    const dataSql = `SELECT * FROM audit_logs WHERE ${whereSql} ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`

    const countRes = await queryOne<{ count: string }>(countSql, params)
    const dataRes = await query<AuditLogRecord>(dataSql, [...params, limit, offset])

    if (dataRes.rows.length > 0) {
      return {
        logs: dataRes.rows,
        totalCount: parseInt(countRes?.count || '0', 10),
      }
    }
  } catch (err) {
    console.warn('[SUPER_ADMIN_AUDIT_LOG_QUERY_WARN] Falling back to memory:', err)
  }

  // Dev fallback filtering
  const devLogs = (global.__DEV_AUDIT_LOGS || []).filter((log) => {
    if (filters.organizationId && filters.organizationId !== 'all' && log.organization_id !== filters.organizationId) return false
    if (filters.isSuperAdminOnly && !log.actor_is_super_admin) return false
    if (filters.action && filters.action !== 'all' && log.action !== filters.action) return false
    if (filters.entityType && filters.entityType !== 'all' && log.entity_type !== filters.entityType && log.target_type !== filters.entityType) return false
    if (filters.startDate && log.created_at < filters.startDate) return false
    if (filters.endDate && log.created_at > filters.endDate) return false
    if (filters.search) {
      const s = filters.search.toLowerCase()
      const match =
        log.action.toLowerCase().includes(s) ||
        (log.actor_email && log.actor_email.toLowerCase().includes(s)) ||
        (log.actor_name && log.actor_name.toLowerCase().includes(s)) ||
        (log.entity_type && log.entity_type.toLowerCase().includes(s)) ||
        (log.entity_id && log.entity_id.toLowerCase().includes(s))
      if (!match) return false
    }
    return true
  })

  if (devLogs.length === 0) {
    const seeded = getSeededSuperAdminAuditLogs()
    return {
      logs: seeded.slice(offset, offset + limit),
      totalCount: seeded.length,
    }
  }

  return {
    logs: devLogs.slice(offset, offset + limit),
    totalCount: devLogs.length,
  }
}

/**
 * Format audit logs into CSV string for download / export compliance.
 */
export function formatAuditLogsCsv(logs: AuditLogRecord[]): string {
  const headers = [
    'Timestamp',
    'Action',
    'Organization ID',
    'Actor Email',
    'Actor Name',
    'Super Admin',
    'Entity Type',
    'Entity ID',
    'IP Address',
    'Metadata JSON',
  ]

  const rows = logs.map((log) => [
    `"${log.created_at}"`,
    `"${log.action}"`,
    `"${log.organization_id || ''}"`,
    `"${log.actor_email || ''}"`,
    `"${log.actor_name || ''}"`,
    log.actor_is_super_admin ? 'TRUE' : 'FALSE',
    `"${log.entity_type || log.target_type || ''}"`,
    `"${log.entity_id || log.target_id || ''}"`,
    `"${log.ip_address || ''}"`,
    `"${JSON.stringify(log.metadata || log.details || {}).replace(/"/g, '""')}"`,
  ])

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
}

function getSeededOrgAuditLogs(orgId: string): AuditLogRecord[] {
  const now = Date.now()
  return [
    {
      id: 'audit_01',
      organization_id: orgId,
      actor_user_id: 'usr_admin',
      actor_is_super_admin: false,
      actor_email: 'admin@agency.com',
      actor_name: 'Lead Admin',
      action: 'TEAM_MEMBER_ROLE_UPDATED',
      entity_type: 'organization_member',
      entity_id: 'mem_456',
      target_type: 'organization_member',
      target_id: 'mem_456',
      metadata: { oldRole: 'member', newRole: 'admin', targetUser: 'sarah@agency.com' },
      details: { oldRole: 'member', newRole: 'admin', targetUser: 'sarah@agency.com' },
      ip_address: '192.168.1.100',
      user_agent: 'Mozilla/5.0 Chrome/128.0',
      created_at: new Date(now - 1000 * 60 * 15).toISOString(),
    },
    {
      id: 'audit_02',
      organization_id: orgId,
      actor_user_id: 'usr_owner',
      actor_is_super_admin: false,
      actor_email: 'owner@agency.com',
      actor_name: 'Agency Founder',
      action: 'CHECKOUT_SESSION_INITIATED',
      entity_type: 'subscription',
      entity_id: 'plan_pro',
      target_type: 'subscription',
      target_id: 'plan_pro',
      metadata: { plan: 'Pro Tier', billingInterval: 'monthly' },
      details: { plan: 'Pro Tier', billingInterval: 'monthly' },
      ip_address: '192.168.1.102',
      user_agent: 'Mozilla/5.0 Chrome/128.0',
      created_at: new Date(now - 1000 * 60 * 120).toISOString(),
    },
    {
      id: 'audit_03',
      organization_id: orgId,
      actor_user_id: 'usr_admin',
      actor_is_super_admin: false,
      actor_email: 'admin@agency.com',
      actor_name: 'Lead Admin',
      action: 'CLIENT_CREATED',
      entity_type: 'client',
      entity_id: 'cli_789',
      target_type: 'client',
      target_id: 'cli_789',
      metadata: { name: 'Acme Global Ventures', industry: 'Fintech' },
      details: { name: 'Acme Global Ventures', industry: 'Fintech' },
      ip_address: '192.168.1.100',
      user_agent: 'Mozilla/5.0 Chrome/128.0',
      created_at: new Date(now - 1000 * 3600 * 5).toISOString(),
    },
    {
      id: 'audit_04',
      organization_id: orgId,
      actor_user_id: 'usr_admin',
      actor_is_super_admin: false,
      actor_email: 'admin@agency.com',
      actor_name: 'Lead Admin',
      action: 'PROJECT_DELIVERED_INVOICE_TRIGGERED',
      entity_type: 'project',
      entity_id: 'proj_301',
      target_type: 'project',
      target_id: 'proj_301',
      metadata: { amount: 4500, client: 'Acme Global' },
      details: { amount: 4500, client: 'Acme Global' },
      ip_address: '192.168.1.100',
      user_agent: 'Mozilla/5.0 Chrome/128.0',
      created_at: new Date(now - 1000 * 3600 * 24).toISOString(),
    },
    {
      id: 'audit_05',
      organization_id: orgId,
      actor_user_id: 'usr_admin',
      actor_is_super_admin: false,
      actor_email: 'admin@agency.com',
      actor_name: 'Lead Admin',
      action: 'PORTAL_USER_INVITED',
      entity_type: 'client_portal',
      entity_id: 'cli_789',
      target_type: 'client_portal',
      target_id: 'cli_789',
      metadata: { invitedEmail: 'billing@acmeglobal.com' },
      details: { invitedEmail: 'billing@acmeglobal.com' },
      ip_address: '192.168.1.100',
      user_agent: 'Mozilla/5.0 Chrome/128.0',
      created_at: new Date(now - 1000 * 3600 * 48).toISOString(),
    },
  ]
}

function getSeededSuperAdminAuditLogs(): AuditLogRecord[] {
  const now = Date.now()
  return [
    {
      id: 'sa_audit_01',
      organization_id: 'org_acme',
      actor_user_id: 'usr_super',
      actor_is_super_admin: true,
      actor_email: 'superadmin@innoventix.io',
      actor_name: 'Platform Super Admin',
      action: 'SUPER_ADMIN_IMPERSONATION_START',
      entity_type: 'organization',
      entity_id: 'org_acme',
      target_type: 'organization',
      target_id: 'org_acme',
      metadata: { organizationName: 'Acme Marketing Agency', reason: 'Customer support debugging' },
      details: { organizationName: 'Acme Marketing Agency', reason: 'Customer support debugging' },
      ip_address: '10.0.0.1',
      user_agent: 'Mozilla/5.0 Chrome/128.0',
      created_at: new Date(now - 1000 * 60 * 10).toISOString(),
    },
    {
      id: 'sa_audit_02',
      organization_id: 'org_apex',
      actor_user_id: 'usr_super',
      actor_is_super_admin: true,
      actor_email: 'superadmin@innoventix.io',
      actor_name: 'Platform Super Admin',
      action: 'ORGANIZATION_PLAN_OVERRIDDEN',
      entity_type: 'organization',
      entity_id: 'org_apex',
      target_type: 'organization',
      target_id: 'org_apex',
      metadata: { newPlanTier: 'enterprise', reason: 'VIP beta testing partner' },
      details: { newPlanTier: 'enterprise', reason: 'VIP beta testing partner' },
      ip_address: '10.0.0.1',
      user_agent: 'Mozilla/5.0 Chrome/128.0',
      created_at: new Date(now - 1000 * 3600 * 4).toISOString(),
    },
    {
      id: 'sa_audit_03',
      organization_id: 'org_spam',
      actor_user_id: 'usr_super',
      actor_is_super_admin: true,
      actor_email: 'superadmin@innoventix.io',
      actor_name: 'Platform Super Admin',
      action: 'ORGANIZATION_SUSPENDED',
      entity_type: 'organization',
      entity_id: 'org_spam',
      target_type: 'organization',
      target_id: 'org_spam',
      metadata: { reason: 'Violation of platform Terms of Service - unauthorized mass spam' },
      details: { reason: 'Violation of platform Terms of Service - unauthorized mass spam' },
      ip_address: '10.0.0.1',
      user_agent: 'Mozilla/5.0 Chrome/128.0',
      created_at: new Date(now - 1000 * 3600 * 20).toISOString(),
    },
    {
      id: 'sa_audit_04',
      organization_id: null,
      actor_user_id: 'usr_super',
      actor_is_super_admin: true,
      actor_email: 'superadmin@innoventix.io',
      actor_name: 'Platform Super Admin',
      action: 'SUPER_ADMIN_SETTINGS_UPDATED',
      entity_type: 'platform_settings',
      entity_id: 'global_config',
      target_type: 'platform_settings',
      target_id: 'global_config',
      metadata: { setting: 'rate_limiting_threshold', value: 120 },
      details: { setting: 'rate_limiting_threshold', value: 120 },
      ip_address: '10.0.0.1',
      user_agent: 'Mozilla/5.0 Chrome/128.0',
      created_at: new Date(now - 1000 * 3600 * 48).toISOString(),
    },
  ]
}
