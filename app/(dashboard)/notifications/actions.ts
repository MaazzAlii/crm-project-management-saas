'use server'

import { getCurrentSessionContext } from '@/lib/auth/session'
import { query } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export interface InAppNotificationRecord {
  id: string
  organization_id: string
  user_id?: string | null
  type: string
  title: string
  body?: string | null
  read_at?: string | null
  related_entity_type?: string | null
  related_entity_id?: string | null
  created_at: string
}

export type ProjectHealthStatus = 'On Track' | 'At Risk' | 'Overdue' | 'Completed'

export async function calculateProjectHealthAction(
  deadline?: string | null,
  status?: string | null,
  completionPct?: number
): Promise<ProjectHealthStatus> {
  const normStatus = (status || '').toLowerCase()
  if (normStatus === 'completed' || normStatus === 'delivered' || normStatus === 'invoiced' || normStatus === 'paid') {
    return 'Completed'
  }

  if (!deadline) return 'On Track'

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const targetDate = new Date(deadline)
  targetDate.setHours(0, 0, 0, 0)

  const diffTime = targetDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    return 'Overdue'
  }
  if (diffDays <= 3) {
    return 'At Risk'
  }
  return 'On Track'
}

// Fetch in-app notifications
export async function fetchInAppNotificationsAction(): Promise<InAppNotificationRecord[]> {
  try {
    const session = await getCurrentSessionContext()

    if (!session || !session.organization) {
      return getDevNotifications()
    }

    const { rows } = await query<InAppNotificationRecord>(
      `SELECT * FROM in_app_notifications
       WHERE organization_id = $1
       ORDER BY created_at DESC
       LIMIT 30`,
      [session.organization.id]
    )

    if (!rows || rows.length === 0) {
      return getDevNotifications()
    }

    return rows
  } catch (err) {
    return getDevNotifications()
  }
}

// Mark single notification as read
export async function markNotificationAsReadAction(notificationId: string) {
  try {
    const session = await getCurrentSessionContext()

    if (!session || !session.organization) return { success: true }

    await query(
      `UPDATE in_app_notifications
       SET read_at = NOW()
       WHERE id = $1 AND organization_id = $2`,
      [notificationId, session.organization.id]
    )

    revalidatePath('/')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Failed to mark notification as read.' }
  }
}

// Mark all notifications as read
export async function markAllNotificationsAsReadAction() {
  try {
    const session = await getCurrentSessionContext()

    if (!session || !session.organization) return { success: true }

    await query(
      `UPDATE in_app_notifications
       SET read_at = NOW()
       WHERE organization_id = $1 AND read_at IS NULL`,
      [session.organization.id]
    )

    revalidatePath('/')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Failed to mark all as read.' }
  }
}

// Create notification
export async function createInAppNotificationAction(
  type: string,
  title: string,
  body?: string,
  related_entity_type?: string,
  related_entity_id?: string
) {
  try {
    const session = await getCurrentSessionContext()
    if (!session || !session.organization) return

    await query(
      `INSERT INTO in_app_notifications (organization_id, user_id, type, title, body, related_entity_type, related_entity_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        session.organization.id,
        session.user?.id || null,
        type,
        title,
        body || null,
        related_entity_type || null,
        related_entity_id || null,
      ]
    )
  } catch (e) {}
}

// Dev Fallback Notifications
function getDevNotifications(): InAppNotificationRecord[] {
  const now = new Date()

  return [
    {
      id: 'notif-1',
      organization_id: 'dev-org',
      type: 'deadline_approaching',
      title: 'Project Deadline Approaching',
      body: 'Project "Voice Agent AI Integration" is due in 2 days.',
      read_at: null,
      related_entity_type: 'project',
      related_entity_id: 'proj-1',
      created_at: new Date(now.getTime() - 3600000 * 2).toISOString(),
    },
    {
      id: 'notif-2',
      organization_id: 'dev-org',
      type: 'milestone_completed',
      title: 'Deliverable Approved',
      body: 'Client approved "Voice Bot Dialog Flow Architecture Diagram".',
      read_at: new Date(now.getTime() - 3600000 * 12).toISOString(),
      related_entity_type: 'project',
      related_entity_id: 'proj-1',
      created_at: new Date(now.getTime() - 3600000 * 24).toISOString(),
    },
    {
      id: 'notif-3',
      organization_id: 'dev-org',
      type: 'project_overdue',
      title: 'Task Overdue Alert',
      body: 'Task "Configure Webhook Endpoints" passed its target due date.',
      read_at: null,
      related_entity_type: 'task',
      related_entity_id: 'tsk-101',
      created_at: new Date(now.getTime() - 3600000 * 36).toISOString(),
    },
  ]
}
