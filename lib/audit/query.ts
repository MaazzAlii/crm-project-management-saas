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

    return {
      logs: dataRes.rows || [],
      totalCount: parseInt(countRes?.count || '0', 10),
    }
  } catch (err) {
    console.warn('[AUDIT_LOG_QUERY_WARN] Error querying DB audit logs:', err)
    return {
      logs: [],
      totalCount: 0,
    }
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

    return {
      logs: dataRes.rows || [],
      totalCount: parseInt(countRes?.count || '0', 10),
    }
  } catch (err) {
    console.warn('[SUPER_ADMIN_AUDIT_LOG_QUERY_WARN] Error querying audit logs:', err)
    return {
      logs: [],
      totalCount: 0,
    }
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

