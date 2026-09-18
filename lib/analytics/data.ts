import { createClient } from '@/lib/supabase/server'

export type AnalyticsDateRange = '30d' | '90d' | 'ytd' | 'all'

export interface ProjectStatusMetric {
  status: string
  label: string
  count: number
  percentage: number
  color: string
}

export interface RevenueStageMetric {
  stage: string
  label: string
  count: number
  totalValue: number
  color: string
}

export interface RevenuePipelineStats {
  totalActiveValue: number
  totalInvoicedValue: number
  totalPaidValue: number
  totalHistoricalValue: number
  averageProjectBudget: number
  activeProjectsCount: number
  byStage: RevenueStageMetric[]
}

export interface TeamWorkloadMember {
  userId: string
  name: string
  email: string
  role: string
  avatarUrl?: string | null
  activeTasksCount: number
  completedTasksCount: number
  totalAssignedCount: number
  capacityPercentage: number
  loadStatus: 'optimal' | 'heavy' | 'light'
}

export interface DeadlineItem {
  id: string
  type: 'project' | 'task'
  title: string
  relatedName?: string
  deadline: string
  status: string
  isOverdue: boolean
  daysDiff: number // Negative if overdue, positive if upcoming
}

export interface MonthlyVelocityItem {
  month: string
  monthShort: string
  year: number
  deliveredProjects: number
  completedDeliverables: number
  completedTasks: number
  totalClosed: number
}

export interface OrganizationAnalyticsData {
  range: AnalyticsDateRange
  revenue: RevenuePipelineStats
  projectStatuses: ProjectStatusMetric[]
  totalProjects: number
  activeProjectsCount: number
  teamWorkload: TeamWorkloadMember[]
  upcomingDeadlines: DeadlineItem[]
  overdueItems: DeadlineItem[]
  monthlyVelocity: MonthlyVelocityItem[]
  monthlyCompletionRate: number
  totalClientsCount: number
  activeClientsCount: number
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  planning: { label: 'Planning', color: '#818CF8' }, // Indigo
  in_progress: { label: 'In Progress', color: '#38BDF8' }, // Sky
  review: { label: 'In Review', color: '#FBBF24' }, // Amber
  delivered: { label: 'Delivered', color: '#34D399' }, // Emerald
  invoiced: { label: 'Invoiced', color: '#2DD4BF' }, // Teal
  paid: { label: 'Paid', color: '#10B981' }, // Green
  blocked: { label: 'Blocked', color: '#F87171' }, // Rose
  on_hold: { label: 'On Hold', color: '#94A3B8' }, // Slate
}

export async function fetchOrganizationAnalytics(
  organizationId: string,
  range: AnalyticsDateRange = '30d'
): Promise<OrganizationAnalyticsData> {
  const supabase = await createClient()

  // Calculate cutoff timestamp based on selected date range
  const now = new Date()
  let rangeStart: Date | null = null

  if (range === '30d') {
    rangeStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  } else if (range === '90d') {
    rangeStart = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
  } else if (range === 'ytd') {
    rangeStart = new Date(now.getFullYear(), 0, 1)
  }

  // 1. Fetch Projects with clients
  let projectsQuery = supabase
    .from('projects')
    .select('id, name, status, budget, deadline, created_at, delivered_at, client_id, clients(name)')
    .eq('organization_id', organizationId)

  if (rangeStart) {
    projectsQuery = projectsQuery.gte('created_at', rangeStart.toISOString())
  }

  const { data: rawProjects } = await projectsQuery
  const projects = rawProjects || []

  // 2. Fetch Tasks with projects
  const { data: rawTasks } = await supabase
    .from('tasks')
    .select('id, title, status, priority, due_date, assigned_to, project_id, created_at, completed_at, projects(name)')
    .eq('organization_id', organizationId)

  const tasks = rawTasks || []

  // 3. Fetch Deliverables
  const { data: rawDeliverables } = await supabase
    .from('deliverables')
    .select('id, title, status, created_at, updated_at, project_id')
    .eq('organization_id', organizationId)

  const deliverables = rawDeliverables || []

  // 4. Fetch Team Members
  const { data: rawMembers } = await supabase
    .from('organization_members')
    .select('id, user_id, role, users(id, full_name, email, avatar_url)')
    .eq('organization_id', organizationId)

  const members = rawMembers || []

  // 5. Fetch Clients count
  const { count: clientsCount } = await supabase
    .from('clients')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organizationId)

  // ==========================================
  // METRIC A: Projects by Status
  // ==========================================
  const totalProjects = projects.length
  const statusCounts: Record<string, number> = {}

  projects.forEach((p) => {
    const s = p.status || 'planning'
    statusCounts[s] = (statusCounts[s] || 0) + 1
  })

  const projectStatuses: ProjectStatusMetric[] = Object.entries(statusCounts).map(
    ([status, count]) => {
      const config = STATUS_LABELS[status] || { label: status, color: '#64748B' }
      return {
        status,
        label: config.label,
        count,
        percentage: totalProjects > 0 ? Math.round((count / totalProjects) * 100) : 0,
        color: config.color,
      }
    }
  ).sort((a, b) => b.count - a.count)

  // ==========================================
  // METRIC B: Revenue Pipeline
  // ==========================================
  let totalActiveValue = 0
  let totalInvoicedValue = 0
  let totalPaidValue = 0
  let totalHistoricalValue = 0
  let activeProjectsCount = 0

  const stageValues: Record<string, { count: number; totalValue: number }> = {}

  projects.forEach((p) => {
    const budget = Number(p.budget) || 0
    const status = p.status || 'planning'

    totalHistoricalValue += budget

    if (!stageValues[status]) {
      stageValues[status] = { count: 0, totalValue: 0 }
    }
    stageValues[status].count += 1
    stageValues[status].totalValue += budget

    if (['planning', 'in_progress', 'review', 'delivered'].includes(status)) {
      totalActiveValue += budget
      activeProjectsCount += 1
    } else if (status === 'invoiced') {
      totalInvoicedValue += budget
    } else if (status === 'paid') {
      totalPaidValue += budget
    }
  })

  const averageProjectBudget =
    activeProjectsCount > 0
      ? Math.round(totalActiveValue / activeProjectsCount)
      : totalProjects > 0
      ? Math.round(totalHistoricalValue / totalProjects)
      : 0

  const byStage: RevenueStageMetric[] = Object.entries(stageValues).map(
    ([stage, val]) => {
      const config = STATUS_LABELS[stage] || { label: stage, color: '#64748B' }
      return {
        stage,
        label: config.label,
        count: val.count,
        totalValue: val.totalValue,
        color: config.color,
      }
    }
  ).sort((a, b) => b.totalValue - a.totalValue)

  const revenue: RevenuePipelineStats = {
    totalActiveValue,
    totalInvoicedValue,
    totalPaidValue,
    totalHistoricalValue,
    averageProjectBudget,
    activeProjectsCount,
    byStage,
  }

  // ==========================================
  // METRIC C: Team Workload
  // ==========================================
  const taskCountsByUser: Record<string, { active: number; completed: number }> = {}

  tasks.forEach((t) => {
    if (!t.assigned_to) return
    if (!taskCountsByUser[t.assigned_to]) {
      taskCountsByUser[t.assigned_to] = { active: 0, completed: 0 }
    }
    if (t.status === 'completed') {
      taskCountsByUser[t.assigned_to].completed += 1
    } else {
      taskCountsByUser[t.assigned_to].active += 1
    }
  })

  const teamWorkload: TeamWorkloadMember[] = members.map((m: any) => {
    const user = Array.isArray(m.users) ? m.users[0] : m.users
    const userId = m.user_id || user?.id || m.id
    const userName = user?.full_name || user?.email?.split('@')[0] || 'Team Member'
    const counts = taskCountsByUser[userId] || { active: 0, completed: 0 }

    const activeTasksCount = counts.active
    const completedTasksCount = counts.completed
    const totalAssignedCount = activeTasksCount + completedTasksCount

    // Capacity reference: 5 active tasks = 100% capacity
    const capacityPercentage = Math.min(Math.round((activeTasksCount / 5) * 100), 100)

    let loadStatus: 'optimal' | 'heavy' | 'light' = 'optimal'
    if (activeTasksCount >= 6) {
      loadStatus = 'heavy'
    } else if (activeTasksCount <= 1) {
      loadStatus = 'light'
    }

    return {
      userId,
      name: userName,
      email: user?.email || '',
      role: m.role || 'member',
      avatarUrl: user?.avatar_url,
      activeTasksCount,
      completedTasksCount,
      totalAssignedCount,
      capacityPercentage,
      loadStatus,
    }
  }).sort((a, b) => b.activeTasksCount - a.activeTasksCount)

  // ==========================================
  // METRIC D: Deadlines & Overdue Items
  // ==========================================
  const upcomingDeadlines: DeadlineItem[] = []
  const overdueItems: DeadlineItem[] = []

  const todayMidnight = new Date()
  todayMidnight.setHours(0, 0, 0, 0)

  const in7Days = new Date(todayMidnight.getTime() + 7 * 24 * 60 * 60 * 1000)
  in7Days.setHours(23, 59, 59, 999)

  // Check projects deadlines
  projects.forEach((p: any) => {
    if (!p.deadline) return
    if (['paid', 'delivered'].includes(p.status)) return

    const d = new Date(p.deadline)
    const diffDays = Math.ceil((d.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24))

    const item: DeadlineItem = {
      id: p.id,
      type: 'project',
      title: p.name,
      relatedName: p.clients?.name || 'Project',
      deadline: p.deadline,
      status: p.status,
      isOverdue: diffDays < 0,
      daysDiff: diffDays,
    }

    if (diffDays < 0) {
      overdueItems.push(item)
    } else if (diffDays <= 7) {
      upcomingDeadlines.push(item)
    }
  })

  // Check tasks deadlines
  tasks.forEach((t: any) => {
    if (!t.due_date) return
    if (t.status === 'completed') return

    const d = new Date(t.due_date)
    const diffDays = Math.ceil((d.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24))

    const item: DeadlineItem = {
      id: t.id,
      type: 'task',
      title: t.title,
      relatedName: t.projects?.name || 'Task',
      deadline: t.due_date,
      status: t.status,
      isOverdue: diffDays < 0,
      daysDiff: diffDays,
    }

    if (diffDays < 0) {
      overdueItems.push(item)
    } else if (diffDays <= 7) {
      upcomingDeadlines.push(item)
    }
  })

  // Sort upcoming chronologically ascending, overdue by severity (most overdue first)
  upcomingDeadlines.sort((a, b) => a.daysDiff - b.daysDiff)
  overdueItems.sort((a, b) => a.daysDiff - b.daysDiff)

  // ==========================================
  // METRIC E: Monthly Completion Rate (Trailing 6 Months)
  // ==========================================
  const monthsMap: Record<string, MonthlyVelocityItem> = {}

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const monthShort = d.toLocaleString('default', { month: 'short' })
    const monthFull = `${monthShort} ${d.getFullYear()}`

    monthsMap[key] = {
      month: monthFull,
      monthShort,
      year: d.getFullYear(),
      deliveredProjects: 0,
      completedDeliverables: 0,
      completedTasks: 0,
      totalClosed: 0,
    }
  }

  // Aggregate deliverables by completed month
  deliverables.forEach((del: any) => {
    if (del.status !== 'approved' && del.status !== 'completed') return
    const dateStr = del.updated_at || del.created_at
    if (!dateStr) return
    const d = new Date(dateStr)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (monthsMap[key]) {
      monthsMap[key].completedDeliverables += 1
      monthsMap[key].totalClosed += 1
    }
  })

  // Aggregate projects delivered by month
  projects.forEach((p: any) => {
    if (!['delivered', 'invoiced', 'paid'].includes(p.status)) return
    const dateStr = p.delivered_at || p.created_at
    if (!dateStr) return
    const d = new Date(dateStr)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (monthsMap[key]) {
      monthsMap[key].deliveredProjects += 1
      monthsMap[key].totalClosed += 1
    }
  })

  // Aggregate tasks completed by month
  tasks.forEach((t: any) => {
    if (t.status !== 'completed' || !t.completed_at) return
    const d = new Date(t.completed_at)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (monthsMap[key]) {
      monthsMap[key].completedTasks += 1
      monthsMap[key].totalClosed += 1
    }
  })

  const monthlyVelocity = Object.values(monthsMap)

  // Overall completion rate: percentage of all non-blocked projects that reached completion
  const completedProjectsCount = projects.filter((p) =>
    ['delivered', 'invoiced', 'paid'].includes(p.status)
  ).length

  const monthlyCompletionRate =
    totalProjects > 0 ? Math.round((completedProjectsCount / totalProjects) * 100) : 0

  return {
    range,
    revenue,
    projectStatuses,
    totalProjects,
    activeProjectsCount,
    teamWorkload,
    upcomingDeadlines,
    overdueItems,
    monthlyVelocity,
    monthlyCompletionRate,
    totalClientsCount: clientsCount || 0,
    activeClientsCount: new Set(projects.map((p) => p.client_id).filter(Boolean)).size,
  }
}
