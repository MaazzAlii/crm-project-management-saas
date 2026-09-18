/**
 * N8N Automation & Webhook Contract Types
 * Used across the SaaS platform for event emission to the self-hosted n8n instance on Contabo VPS.
 */

export type AutomationEventType =
  | 'project.delivered'
  | 'task.deadline_approaching'
  | 'project.overdue'
  | 'weekly.summary_ready'
  | 'ping'

export interface ProjectDeliveredData {
  project_id: string
  project_name: string
  client_id: string
  client_name: string
  client_email?: string | null
  budget?: number | null
  delivered_at: string
  completed_by_id?: string | null
  completed_by_name?: string | null
  completed_by_email?: string | null
}

export interface TaskDeadlineApproachingData {
  task_id: string
  task_title: string
  project_id: string
  project_name: string
  due_date: string
  priority?: string
  assignee_id?: string | null
  assignee_name?: string | null
  assignee_email?: string | null
}

export interface ProjectOverdueData {
  project_id: string
  project_name: string
  client_id: string
  client_name: string
  deadline: string
  days_overdue: number
  status: string
  owner_id?: string | null
  owner_name?: string | null
  owner_email?: string | null
}

export interface WeeklySummaryReadyData {
  report_id?: string
  period_start: string
  period_end: string
  metrics: {
    tasks_completed: number
    active_projects: number
    new_clients: number
    revenue: number
    communication_volume: number
    overdue_items: number
  }
  narrative_summary?: string
}

export type AutomationPayloadMap = {
  'project.delivered': ProjectDeliveredData
  'task.deadline_approaching': TaskDeadlineApproachingData
  'project.overdue': ProjectOverdueData
  'weekly.summary_ready': WeeklySummaryReadyData
  'ping': { message: string; timestamp: string }
}

export interface AutomationEventPayload<T = any> {
  id: string
  event: AutomationEventType
  organization_id: string
  timestamp: string
  data: T
}

export interface AutomationEmitOptions<T = any> {
  organizationId: string
  event: AutomationEventType
  data: T
  targetUrl?: string
  secret?: string
  timeoutMs?: number
}

export interface AutomationEmitResult {
  success: boolean
  deliveryId: string
  statusCode?: number
  skipped?: boolean
  reason?: string
  error?: string
}
