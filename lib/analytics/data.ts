import { query, queryOne } from '@/lib/db'

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
  daysDiff: number
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

export interface RevenueByClientMetric {
  clientId: string
  clientName: string
  company?: string | null
  email?: string | null
  totalBilled: number
  paidAmount: number
  invoicedAmount: number
  activeAmount: number
  projectsCount: number
  activeProjectsCount: number
  status: string
}

export interface RevenueByProjectTypeMetric {
  projectType: string
  totalRevenue: number
  projectsCount: number
  averageValue: number
  percentage: number
}

export interface MonthlyTrendMetric {
  month: string
  monthShort: string
  year: number
  deliveredRevenue: number
  invoicedRevenue: number
  activeProjects: number
  teamSize: number
  closedTasks: number
}

export interface RevenueReportData {
  range: AnalyticsDateRange
  totalRevenue: number
  paidRevenue: number
  invoicedRevenue: number
  pipelineRevenue: number
  averageDealSize: number
  clientsBreakdown: RevenueByClientMetric[]
  typeBreakdown: RevenueByProjectTypeMetric[]
  monthlyTrends: MonthlyTrendMetric[]
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
  planning: { label: 'Planning', color: '#818CF8' },
  in_progress: { label: 'In Progress', color: '#38BDF8' },
  review: { label: 'In Review', color: '#FBBF24' },
  delivered: { label: 'Delivered', color: '#34D399' },
  invoiced: { label: 'Invoiced', color: '#2DD4BF' },
  paid: { label: 'Paid', color: '#10B981' },
  blocked: { label: 'Blocked', color: '#F87171' },
  on_hold: { label: 'On Hold', color: '#94A3B8' },
}

export async function fetchOrganizationAnalytics(
  organizationId: string,
  range: AnalyticsDateRange = '30d'
): Promise<OrganizationAnalyticsData> {
  const now = new Date()
  let rangeStart: Date | null = null

  if (range === '30d') {
    rangeStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  } else if (range === '90d') {
    rangeStart = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
  } else if (range === 'ytd') {
    rangeStart = new Date(now.getFullYear(), 0, 1)
  }

  const projectsSql = rangeStart
    ? `SELECT p.id, COALESCE(p.title, p.name) as name, p.status, COALESCE(p.amount, p.budget, 0) as budget, p.deadline, p.created_at, p.delivered_at, p.client_id, c.name as client_name
       FROM projects p
       LEFT JOIN clients c ON c.id = p.client_id
       WHERE p.organization_id = $1 AND p.created_at >= $2`
    : `SELECT p.id, COALESCE(p.title, p.name) as name, p.status, COALESCE(p.amount, p.budget, 0) as budget, p.deadline, p.created_at, p.delivered_at, p.client_id, c.name as client_name
       FROM projects p
       LEFT JOIN clients c ON c.id = p.client_id
       WHERE p.organization_id = $1`

  const projectsParams = rangeStart ? [organizationId, rangeStart.toISOString()] : [organizationId]

  const [
    projectsRes,
    tasksRes,
    deliverablesRes,
    membersRes,
    clientsCountRes,
  ] = await Promise.all([
    query<{
      id: string
      name: string
      status: string
      budget: string | number
      deadline: string | null
      created_at: string
      delivered_at: string | null
      client_id: string | null
      client_name: string | null
    }>(projectsSql, projectsParams),

    query<{
      id: string
      title: string
      status: string
      priority: string
      due_date: string | null
      assigned_to: string | null
      project_id: string | null
      created_at: string
      completed_at: string | null
      project_name: string | null
    }>(
      `SELECT t.id, t.title, t.status, t.priority, t.due_date, t.assigned_to, t.project_id, t.created_at, t.completed_at,
              COALESCE(p.title, p.name) as project_name
       FROM tasks t
       LEFT JOIN projects p ON p.id = t.project_id
       WHERE t.organization_id = $1`,
      [organizationId]
    ),

    query<{
      id: string
      title: string
      status: string
      created_at: string
      updated_at: string | null
      project_id: string | null
    }>(
      'SELECT id, title, status, created_at, updated_at, project_id FROM deliverables WHERE organization_id = $1',
      [organizationId]
    ),

    query<{
      id: string
      user_id: string
      role: string
      full_name: string | null
      email: string | null
      avatar_url: string | null
    }>(
      `SELECT m.id, m.user_id, m.role, u.full_name, u.email, u.avatar_url
       FROM organization_members m
       LEFT JOIN users u ON u.id = m.user_id
       WHERE m.organization_id = $1`,
      [organizationId]
    ),

    queryOne<{ count: string }>(
      'SELECT COUNT(*) as count FROM clients WHERE organization_id = $1',
      [organizationId]
    ),
  ])

  const projects = projectsRes.rows
  const tasks = tasksRes.rows
  const deliverables = deliverablesRes.rows
  const members = membersRes.rows
  const clientsCount = parseInt(clientsCountRes?.count || '0', 10)

  // METRIC A: Projects by Status
  const totalProjects = projects.length
  const statusCounts: Record<string, number> = {}

  projects.forEach((p) => {
    const s = p.status || 'planning'
    statusCounts[s] = (statusCounts[s] || 0) + 1
  })

  const projectStatuses: ProjectStatusMetric[] = Object.entries(statusCounts)
    .map(([status, count]) => {
      const config = STATUS_LABELS[status] || { label: status, color: '#64748B' }
      return {
        status,
        label: config.label,
        count,
        percentage: totalProjects > 0 ? Math.round((count / totalProjects) * 100) : 0,
        color: config.color,
      }
    })
    .sort((a, b) => b.count - a.count)

  // METRIC B: Revenue Pipeline
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

  const byStage: RevenueStageMetric[] = Object.entries(stageValues)
    .map(([stage, val]) => {
      const config = STATUS_LABELS[stage] || { label: stage, color: '#64748B' }
      return {
        stage,
        label: config.label,
        count: val.count,
        totalValue: val.totalValue,
        color: config.color,
      }
    })
    .sort((a, b) => b.totalValue - a.totalValue)

  const revenue: RevenuePipelineStats = {
    totalActiveValue,
    totalInvoicedValue,
    totalPaidValue,
    totalHistoricalValue,
    averageProjectBudget,
    activeProjectsCount,
    byStage,
  }

  // METRIC C: Team Workload
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

  const teamWorkload: TeamWorkloadMember[] = members
    .map((m) => {
      const userId = m.user_id || m.id
      const userName = m.full_name || m.email?.split('@')[0] || 'Team Member'
      const counts = taskCountsByUser[userId] || { active: 0, completed: 0 }

      const activeTasksCount = counts.active
      const completedTasksCount = counts.completed
      const totalAssignedCount = activeTasksCount + completedTasksCount
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
        email: m.email || '',
        role: m.role || 'member',
        avatarUrl: m.avatar_url,
        activeTasksCount,
        completedTasksCount,
        totalAssignedCount,
        capacityPercentage,
        loadStatus,
      }
    })
    .sort((a, b) => b.activeTasksCount - a.activeTasksCount)

  // METRIC D: Deadlines & Overdue Items
  const upcomingDeadlines: DeadlineItem[] = []
  const overdueItems: DeadlineItem[] = []

  const todayMidnight = new Date()
  todayMidnight.setHours(0, 0, 0, 0)

  projects.forEach((p) => {
    if (!p.deadline) return
    if (['paid', 'delivered'].includes(p.status)) return

    const d = new Date(p.deadline)
    const diffDays = Math.ceil((d.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24))

    const item: DeadlineItem = {
      id: p.id,
      type: 'project',
      title: p.name,
      relatedName: p.client_name || 'Project',
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

  tasks.forEach((t) => {
    if (!t.due_date) return
    if (t.status === 'completed') return

    const d = new Date(t.due_date)
    const diffDays = Math.ceil((d.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24))

    const item: DeadlineItem = {
      id: t.id,
      type: 'task',
      title: t.title,
      relatedName: t.project_name || 'Task',
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

  upcomingDeadlines.sort((a, b) => a.daysDiff - b.daysDiff)
  overdueItems.sort((a, b) => a.daysDiff - b.daysDiff)

  // METRIC E: Monthly Completion Rate (Trailing 6 Months)
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

  deliverables.forEach((del) => {
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

  projects.forEach((p) => {
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

  tasks.forEach((t) => {
    if (t.status !== 'completed' || !t.completed_at) return
    const d = new Date(t.completed_at)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (monthsMap[key]) {
      monthsMap[key].completedTasks += 1
      monthsMap[key].totalClosed += 1
    }
  })

  const monthlyVelocity = Object.values(monthsMap)
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
    totalClientsCount: clientsCount,
    activeClientsCount: new Set(projects.map((p) => p.client_id).filter(Boolean)).size,
  }
}

export async function fetchRevenueReport(
  organizationId: string,
  range: AnalyticsDateRange = '30d'
): Promise<RevenueReportData> {
  const now = new Date()
  let rangeStart: Date | null = null

  if (range === '30d') {
    rangeStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  } else if (range === '90d') {
    rangeStart = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
  } else if (range === 'ytd') {
    rangeStart = new Date(now.getFullYear(), 0, 1)
  }

  const projectsSql = rangeStart
    ? `SELECT id, COALESCE(title, name) as name, client_id, COALESCE(amount, budget, 0) as budget, amount, status, type, created_at, delivered_at
       FROM projects
       WHERE organization_id = $1 AND created_at >= $2`
    : `SELECT id, COALESCE(title, name) as name, client_id, COALESCE(amount, budget, 0) as budget, amount, status, type, created_at, delivered_at
       FROM projects
       WHERE organization_id = $1`

  const projectsParams = rangeStart ? [organizationId, rangeStart.toISOString()] : [organizationId]

  const [clientsRes, projectsRes, teamCountRes, tasksRes] = await Promise.all([
    query<{ id: string; name: string; company: string | null; email: string | null; status: string }>(
      'SELECT id, name, company, email, status FROM clients WHERE organization_id = $1',
      [organizationId]
    ),

    query<{
      id: string
      name: string
      client_id: string | null
      budget: string | number
      amount: string | number
      status: string
      type: string | null
      created_at: string
      delivered_at: string | null
    }>(projectsSql, projectsParams),

    queryOne<{ count: string }>(
      'SELECT COUNT(*) as count FROM organization_members WHERE organization_id = $1',
      [organizationId]
    ),

    query<{ id: string; status: string; completed_at: string | null }>(
      "SELECT id, status, completed_at FROM tasks WHERE organization_id = $1 AND status = 'completed'",
      [organizationId]
    ),
  ])

  const clients = clientsRes.rows
  const projects = projectsRes.rows
  const currentTeamSize = parseInt(teamCountRes?.count || '1', 10)
  const tasks = tasksRes.rows

  const clientMap = new Map<string, any>(clients.map((c) => [c.id, c]))

  const clientAggregates: Record<string, RevenueByClientMetric> = {}

  clients.forEach((c) => {
    clientAggregates[c.id] = {
      clientId: c.id,
      clientName: c.name,
      company: c.company,
      email: c.email,
      totalBilled: 0,
      paidAmount: 0,
      invoicedAmount: 0,
      activeAmount: 0,
      projectsCount: 0,
      activeProjectsCount: 0,
      status: c.status || 'active',
    }
  })

  let totalRevenue = 0
  let paidRevenue = 0
  let invoicedRevenue = 0
  let pipelineRevenue = 0

  const typeAggregates: Record<string, { totalRevenue: number; projectsCount: number }> = {}

  projects.forEach((p) => {
    const val = Number(p.budget || p.amount || 0)
    const status = p.status || 'planning'
    const type = p.type || 'Standard Project'

    totalRevenue += val

    if (!typeAggregates[type]) {
      typeAggregates[type] = { totalRevenue: 0, projectsCount: 0 }
    }
    typeAggregates[type].totalRevenue += val
    typeAggregates[type].projectsCount += 1

    if (p.client_id) {
      if (!clientAggregates[p.client_id]) {
        const clientInfo = clientMap.get(p.client_id)
        clientAggregates[p.client_id] = {
          clientId: p.client_id,
          clientName: clientInfo?.name || 'Unknown Client',
          company: clientInfo?.company,
          email: clientInfo?.email,
          totalBilled: 0,
          paidAmount: 0,
          invoicedAmount: 0,
          activeAmount: 0,
          projectsCount: 0,
          activeProjectsCount: 0,
          status: clientInfo?.status || 'active',
        }
      }

      const c = clientAggregates[p.client_id]
      c.projectsCount += 1
      c.totalBilled += val

      if (status === 'paid') {
        c.paidAmount += val
        paidRevenue += val
      } else if (status === 'invoiced') {
        c.invoicedAmount += val
        invoicedRevenue += val
      } else {
        c.activeAmount += val
        c.activeProjectsCount += 1
        pipelineRevenue += val
      }
    }
  })

  const clientsBreakdown = Object.values(clientAggregates)
    .filter((c) => c.projectsCount > 0 || c.totalBilled > 0)
    .sort((a, b) => b.totalBilled - a.totalBilled)

  const typeBreakdown: RevenueByProjectTypeMetric[] = Object.entries(typeAggregates)
    .map(([projectType, item]) => ({
      projectType,
      totalRevenue: item.totalRevenue,
      projectsCount: item.projectsCount,
      averageValue: item.projectsCount > 0 ? Math.round(item.totalRevenue / item.projectsCount) : 0,
      percentage: totalRevenue > 0 ? Math.round((item.totalRevenue / totalRevenue) * 100) : 0,
    }))
    .sort((a, b) => b.totalRevenue - a.totalRevenue)

  const monthlyTrendsMap: Record<string, MonthlyTrendMetric> = {}

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const monthShort = d.toLocaleString('default', { month: 'short' })
    const monthFull = `${monthShort} ${d.getFullYear()}`

    monthlyTrendsMap[key] = {
      month: monthFull,
      monthShort,
      year: d.getFullYear(),
      deliveredRevenue: 0,
      invoicedRevenue: 0,
      activeProjects: 0,
      teamSize: currentTeamSize,
      closedTasks: 0,
    }
  }

  projects.forEach((p) => {
    const dateStr = p.delivered_at || p.created_at
    if (!dateStr) return
    const d = new Date(dateStr)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const val = Number(p.budget || p.amount || 0)

    if (monthlyTrendsMap[key]) {
      if (['delivered', 'paid'].includes(p.status)) {
        monthlyTrendsMap[key].deliveredRevenue += val
      } else if (p.status === 'invoiced') {
        monthlyTrendsMap[key].invoicedRevenue += val
      }
      monthlyTrendsMap[key].activeProjects += 1
    }
  })

  tasks.forEach((t) => {
    if (!t.completed_at) return
    const d = new Date(t.completed_at)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (monthlyTrendsMap[key]) {
      monthlyTrendsMap[key].closedTasks += 1
    }
  })

  const monthlyTrends = Object.values(monthlyTrendsMap)
  const averageDealSize = projects.length > 0 ? Math.round(totalRevenue / projects.length) : 0

  return {
    range,
    totalRevenue,
    paidRevenue,
    invoicedRevenue,
    pipelineRevenue,
    averageDealSize,
    clientsBreakdown,
    typeBreakdown,
    monthlyTrends,
  }
}
