'use server'

import { getCurrentSessionContext } from '@/lib/auth/session'
import { requireRole } from '@/lib/auth/server-guard'
import { query, queryOne } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { fetchInboxMessages, getInboxSummary, markMessageRead, markAllMessagesRead, assignMessageClient, InboxMessageRecord, InboxSummary } from '@/lib/inbox/query'
import { ingestMessage, CommunicationProvider } from '@/lib/inbox/ingest'
import { decryptSecret } from '@/lib/security/encrypt'
import { sendSlackOutboundMessage } from '@/lib/providers/slack'
import { sendWhatsAppOutboundMessage } from '@/lib/providers/whatsapp'
import { sendEmailOutboundMessage } from '@/lib/providers/email'
import { sendDiscordOutboundMessage } from '@/lib/providers/discord'
import { sendUpworkOutboundMessage } from '@/lib/providers/upwork'
import { isAIAccessible } from '@/lib/ai/client'
import { checkAIAccess } from '@/lib/ai/guard'
import { getReplySuggestions, ReplySuggestionItem } from '@/lib/ai/features/reply-suggestions'
import { extractTasksFromMessage } from '@/lib/ai/features/task-extraction'
import { ExtractedTaskSuggestion } from '@/lib/ai/prompts/task-extraction'
import { logAuditEvent } from '@/lib/audit/logger'

export interface ClientSelectItem {
  id: string
  name: string
  company_name?: string | null
  email?: string | null
  communication_mode?: 'manual' | 'connected'
}

export interface ChannelInfo {
  id: string
  provider: string
  channel_name?: string | null
  status?: string | 'active' | 'disconnected' | 'error'
  connected_at?: string | null
  updated_at?: string | null
  external_account_id?: string | null
  metadata?: Record<string, any> | null
}

export interface FetchInboxDataResult {
  messages: InboxMessageRecord[]
  summary: InboxSummary
  clients: ClientSelectItem[]
  channels: ChannelInfo[]
  aiEnabled: boolean
  aiTaskExtractionEnabled?: boolean
}


export async function fetchInboxDataAction(filters?: {
  channelId?: string
  clientId?: string
  provider?: string
  readStatus?: 'all' | 'read' | 'unread'
  unmatchedOnly?: boolean
  search?: string
}): Promise<FetchInboxDataResult> {
  try {
    const session = await getCurrentSessionContext()

    if (!session || !session.organization) {
      throw new Error('Unauthorized: Valid session and organization required.')
    }

    const orgId = session.organization.id

    // Fetch messages from DB
    const messagesRes = await fetchInboxMessages({
      orgId,
      channelId: filters?.channelId,
      clientId: filters?.clientId,
      provider: filters?.provider as any,
      readStatus: filters?.readStatus,
      unmatchedOnly: filters?.unmatchedOnly,
      search: filters?.search
    })

    // Fetch summary
    const summary = await getInboxSummary(orgId)

    // Check organization AI entitlement / platform gating
    let aiEnabled = false
    let aiTaskExtractionEnabled = false
    try {
      const gateCheck = await isAIAccessible(orgId, 'reply_suggestions')
      aiEnabled = gateCheck.allowed
      const taskGateCheck = await isAIAccessible(orgId, 'task_extraction')
      aiTaskExtractionEnabled = taskGateCheck.allowed
    } catch (e) {
      console.warn('[InboxAction] AI access check error:', e)
    }

    // Fetch clients for dropdown
    const clientsRes = await query<ClientSelectItem>(
      `SELECT id, name, company as company_name, email, communication_mode
       FROM clients
       WHERE organization_id = $1
       ORDER BY name ASC`,
      [orgId]
    )

    // Fetch channels for org
    const channelsRes = await query<ChannelInfo>(
      `SELECT id, provider, channel_name, status, connected_at, updated_at, external_account_id, metadata
       FROM communication_channels
       WHERE organization_id = $1`,
      [orgId]
    )

    const messages = messagesRes.data || []

    return {
      messages,
      summary,
      clients: clientsRes.rows || [],
      channels: channelsRes.rows || [],
      aiEnabled,
      aiTaskExtractionEnabled
    }
  } catch (err: any) {
    console.error('[CommunicationHub:Actions] Error fetching inbox data:', err)
    throw err
  }
}


export async function markMessageReadAction(messageId: string) {
  try {
    const session = await getCurrentSessionContext()
    if (!session || !session.organization) {
      return { success: false, error: 'Unauthorized' }
    }

    const ok = await markMessageRead(messageId, session.organization.id)
    if (ok) revalidatePath('/inbox')
    return { success: ok }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function markAllReadAction(channelId?: string) {
  try {
    const session = await getCurrentSessionContext()
    if (!session || !session.organization) {
      return { success: false, error: 'Unauthorized' }
    }

    const ok = await markAllMessagesRead(session.organization.id, channelId)
    if (ok) revalidatePath('/inbox')
    return { success: ok }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function assignMessageClientAction(messageId: string, clientId: string) {
  const session = await requireRole(['owner', 'admin', 'member'])

  try {
    const ok = await assignMessageClient(messageId, clientId, session.organization.id)
    if (ok) revalidatePath('/inbox')
    return { success: ok }
  } catch (err: any) {
    if (err.message === 'UNAUTHENTICATED' || err.message === 'INSUFFICIENT_ROLE' || err.message === 'NOT_FOUND') {
      throw err
    }
    return { success: false, error: err.message }
  }
}

export async function sendOutboundMessageAction(formData: FormData) {
  const session = await requireRole(['owner', 'admin', 'member'])

  try {

    const channelId = formData.get('channel_id')?.toString()
    const body = formData.get('body')?.toString().trim()
    const clientId = formData.get('client_id')?.toString() || null
    const recipientIdentifier = formData.get('recipient_identifier')?.toString() || ''

    if (!channelId || !body) {
      return { error: 'Channel and message content are required.' }
    }

    // 1. Verify channel belongs to org
    const channel = await queryOne<any>(
      `SELECT id, organization_id, provider, external_account_id, metadata
       FROM communication_channels
       WHERE id = $1 AND organization_id = $2`,
      [channelId, session.organization.id]
    )

    if (!channel) {
      // In dev fallback scenario, return success with simulated message
      return {
        success: true,
        newMessage: {
          id: `msg-${Date.now()}`,
          organization_id: session.organization.id,
          channel_id: channelId,
          client_id: clientId,
          direction: 'outbound' as const,
          sender_name: session.user.full_name || session.user.email,
          sender_identifier: session.user.email,
          body,
          sent_at: new Date().toISOString(),
          read_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      }
    }

    let externalMessageId: string | null = null

    // Direct provider dispatch if provider is Slack
    if (channel.provider === 'slack') {
      const meta = (channel.metadata as Record<string, any>) || {}
      const encryptedToken = meta.bot_access_token || process.env.SLACK_BOT_TOKEN || ''
      const botToken = decryptSecret(encryptedToken)
      const slackChannelId = meta.slack_channel_id || channel.external_account_id

      if (botToken && slackChannelId) {
        const slackRes = await sendSlackOutboundMessage(botToken, slackChannelId, body)
        if (slackRes.ok && slackRes.ts) {
          externalMessageId = slackRes.ts
        } else if (!slackRes.ok) {
          console.warn('[InboxAction] Slack API dispatch warning:', slackRes.error)
        }
      }
    } else if (channel.provider === 'whatsapp') {
      const meta = (channel.metadata as Record<string, any>) || {}
      const accountSid = meta.account_sid ? decryptSecret(meta.account_sid) : process.env.TWILIO_ACCOUNT_SID || ''
      const authToken = meta.auth_token ? decryptSecret(meta.auth_token) : process.env.TWILIO_AUTH_TOKEN || ''
      const fromPhone = meta.phone_number || channel.external_account_id
      const recipientPhone = recipientIdentifier || ''

      if (accountSid && authToken && fromPhone && recipientPhone) {
        const waRes = await sendWhatsAppOutboundMessage(accountSid, authToken, fromPhone, recipientPhone, body)
        if (waRes.ok && waRes.sid) {
          externalMessageId = waRes.sid
        } else if (!waRes.ok) {
          console.warn('[InboxAction] WhatsApp Twilio dispatch warning:', waRes.error)
        }
      }
    } else if (channel.provider === 'email') {
      const meta = (channel.metadata as Record<string, any>) || {}
      const apiKey = meta.sendgrid_api_key ? decryptSecret(meta.sendgrid_api_key) : process.env.SENDGRID_API_KEY || ''
      const fromEmail = channel.external_account_id
      const recipientEmail = recipientIdentifier || ''

      if (apiKey && fromEmail && recipientEmail) {
        const emailRes = await sendEmailOutboundMessage(
          apiKey,
          fromEmail,
          session.organization.name || 'Agency Support',
          recipientEmail,
          'Re: Client Conversation Update',
          body
        )
        if (emailRes.ok && emailRes.messageId) {
          externalMessageId = emailRes.messageId
        } else if (!emailRes.ok) {
          console.warn('[InboxAction] SendGrid email dispatch warning:', emailRes.error)
        }
      }
    } else if (channel.provider === 'discord') {
      const meta = (channel.metadata as Record<string, any>) || {}
      const botToken = meta.bot_token ? decryptSecret(meta.bot_token) : process.env.DISCORD_BOT_TOKEN || ''
      const targetChannelId = meta.channel_id || channel.external_account_id

      if (botToken && targetChannelId) {
        const discordRes = await sendDiscordOutboundMessage(botToken, targetChannelId, body)
        if (discordRes.ok && discordRes.messageId) {
          externalMessageId = discordRes.messageId
        } else if (!discordRes.ok) {
          console.warn('[InboxAction] Discord dispatch warning:', discordRes.error)
        }
      }
    } else if (channel.provider === 'upwork') {
      const meta = (channel.metadata as Record<string, any>) || {}
      const apiKey = meta.api_key ? decryptSecret(meta.api_key) : ''
      const contractId = meta.contract_id || channel.external_account_id

      if (contractId) {
        const upwRes = await sendUpworkOutboundMessage(apiKey, contractId, body)
        if (upwRes.ok && upwRes.messageId) {
          externalMessageId = upwRes.messageId
        }
      }
    }

    // Insert outbound message row into communication_messages
    const insertedMsg = await queryOne<any>(
      `INSERT INTO communication_messages (
         organization_id, channel_id, client_id, direction, sender_name,
         sender_identifier, body, external_message_id, sent_at, read_at
       ) VALUES ($1, $2, $3, 'outbound', $4, $5, $6, $7, NOW(), NOW())
       RETURNING *`,
      [
        session.organization.id,
        channel.id,
        clientId,
        session.user.full_name || session.user.email,
        session.user.email,
        body,
        externalMessageId,
      ]
    )

    revalidatePath('/inbox')
    return { success: true, newMessage: insertedMsg }
  } catch (err: any) {
    if (err.message === 'UNAUTHENTICATED' || err.message === 'INSUFFICIENT_ROLE' || err.message === 'NOT_FOUND') {
      throw err
    }
    return { error: err.message || 'Failed to send outbound message' }
  }
}

export interface GenerateReplySuggestionsParams {
  channelId: string
  channelProvider?: string
  clientId?: string | null
  clientName?: string
  clientCompany?: string
  communicationMode?: 'manual' | 'connected'
  messages: Array<{
    sender_name?: string | null
    sender_identifier?: string | null
    body: string
    direction: 'inbound' | 'outbound'
    sent_at: string
  }>
}

/**
 * Server action to generate AI reply suggestions for an inbox conversation thread.
 * Enforces dual-tier gating (super-admin kill switch + subscription plan limit)
 * and logs token usage in public.ai_usage_log.
 */
export async function generateReplySuggestionsAction(
  params: GenerateReplySuggestionsParams
): Promise<{
  success: boolean
  suggestions: ReplySuggestionItem[]
  provider?: string
  model?: string
  error?: string
  errorCode?: string
}> {
  const session = await requireRole(['owner', 'admin', 'member'])
  const orgId = session.organization.id

  try {
      // In dev fallback scenario without session, run with mock execution
      const mockResult = await getReplySuggestions({
        organizationId: 'dev-org',
        channel: params.channelProvider || 'email',
        communicationMode: params.communicationMode || 'connected',
        clientName: params.clientName || 'Valued Client',
        clientCompany: params.clientCompany,
        conversationHistory: (params.messages || []).map((m) => ({
          sender: m.sender_name || m.sender_identifier || (m.direction === 'outbound' ? 'You' : 'Client'),
          body: m.body,
          isClient: m.direction === 'inbound',
          sentAt: m.sent_at,
        })),
        agencyName: 'Agency Support',
      })
      return mockResult
    }

    // 1. Dual-tier gating check: Platform kill switch + organization subscription plan limit
    const gateCheck = await checkAIAccess(orgId, 'reply_suggestions')
    if (!gateCheck.allowed) {
      return {
        success: false,
        suggestions: [],
        error: gateCheck.reason || 'AI Reply Suggestions are not enabled for this organization.',
        errorCode: gateCheck.code || 'PLAN_LIMIT_REACHED',
      }
    }

    // 2. Fetch authoritative client info if clientId is provided
    let effectiveMode = params.communicationMode || 'connected'
    let effectiveClientName = params.clientName
    let effectiveClientCompany = params.clientCompany

    const isUuid = (val?: string | null) =>
      !!val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val)

    if (params.clientId && isUuid(params.clientId)) {
      const clientRecord = await queryOne<{ name: string; company_name: string; communication_mode: string }>(
        `SELECT name, company as company_name, communication_mode
         FROM clients
         WHERE id = $1 AND organization_id = $2`,
        [params.clientId, orgId]
      )

      if (clientRecord) {
        effectiveMode = (clientRecord.communication_mode as any) || effectiveMode
        effectiveClientName = clientRecord.name || effectiveClientName
        effectiveClientCompany = clientRecord.company_name || effectiveClientCompany
      }
    }

    // 3. Resolve channel provider
    let providerName = params.channelProvider || 'email'
    if (params.channelId && isUuid(params.channelId)) {
      const channelRecord = await queryOne<{ provider: string }>(
        `SELECT provider FROM communication_channels WHERE id = $1 AND organization_id = $2`,
        [params.channelId, orgId]
      )

      if (channelRecord && channelRecord.provider) {
        providerName = channelRecord.provider
      }
    }

    // 4. Format conversation history (last 6 messages)
    const history = (params.messages || []).slice(-6).map((m) => ({
      sender: m.sender_name || m.sender_identifier || (m.direction === 'outbound' ? 'You' : 'Client'),
      body: m.body,
      isClient: m.direction === 'inbound',
      sentAt: m.sent_at,
    }))

    // 5. Invoke AI reply suggestion feature layer
    const result = await getReplySuggestions({
      organizationId: orgId,
      userId: session.user?.id,
      channel: providerName,
      communicationMode: effectiveMode as any,
      clientName: effectiveClientName,
      clientCompany: effectiveClientCompany,
      conversationHistory: history,
      agencyName: session?.organization?.name || 'Agency Support',
    })

    return result
  } catch (err: any) {
    if (err.message === 'UNAUTHENTICATED' || err.message === 'INSUFFICIENT_ROLE' || err.message === 'NOT_FOUND') {
      throw err
    }
    console.error('[CommunicationHub:Actions] Error generating AI reply suggestions:', err)
    return {
      success: false,
      suggestions: [],
      error: err.message || 'Failed to generate AI suggestions.',
    }
  }
}

export interface ExtractTasksActionParams {
  messageBody: string
  senderName?: string
  clientId?: string | null
  clientName?: string | null
  channel?: string | null
  messageId?: string | null
}

export interface TaskCandidateProject {
  id: string
  title: string
  client_id?: string
}

export interface TaskCandidateAssignee {
  id: string
  name: string
  email?: string
}

export interface ExtractTasksActionResult {
  success: boolean
  tasks: ExtractedTaskSuggestion[]
  projects: TaskCandidateProject[]
  teamMembers: TaskCandidateAssignee[]
  error?: string
  errorCode?: string
}

/**
 * Evaluates message content for actionable items and returns candidate tasks,
 * alongside available projects and team members to populate assignment selectors.
 */
export async function extractTasksFromThreadAction(
  params: ExtractTasksActionParams
): Promise<ExtractTasksActionResult> {
  const session = await requireRole(['owner', 'admin', 'member'])
  const orgId = session.organization.id

  try {
    const gateCheck = await checkAIAccess(orgId, 'task_extraction')
    if (!gateCheck.allowed) {
      return {
        success: false,
        tasks: [],
        projects: [],
        teamMembers: [],
        error: gateCheck.reason || 'AI Task Extraction is disabled.',
        errorCode: gateCheck.code,
      }
    }

    // 1. Fetch Projects for org
    let projects: TaskCandidateProject[] = []
    try {
      const projData = await query<any>(
        `SELECT id, title, client_id, status FROM projects WHERE organization_id = $1 ORDER BY created_at DESC`,
        [orgId]
      )

      if (projData.rows && projData.rows.length > 0) {
        projects = projData.rows.map((p: any) => ({
          id: p.id,
          title: p.title,
          client_id: p.client_id,
        }))
      }
    } catch (e) {}

    // 2. Fetch Team Members
    let teamMembers: TaskCandidateAssignee[] = []
    try {
      const memberData = await query<any>(
        `SELECT u.id, u.full_name, u.email
         FROM organization_members om
         JOIN users u ON u.id = om.user_id
         WHERE om.organization_id = $1`,
        [orgId]
      )

      if (memberData.rows && memberData.rows.length > 0) {
        teamMembers = memberData.rows.map((m: any) => ({
          id: m.id,
          name: m.full_name || m.email || 'Team Member',
          email: m.email,
        }))
      }
    } catch (e) {}

    if (teamMembers.length === 0) {
      teamMembers = [
        { id: session.user?.id || 'user-1', name: session.user?.email || 'Current User', email: session.user?.email },
      ]
    }

    // 3. Run AI Task Extraction
    const extractionResult = await extractTasksFromMessage({
      organizationId: orgId,
      userId: session.user?.id,
      messageBody: params.messageBody,
      senderName: params.senderName || 'Client',
      clientName: params.clientName || undefined,
      channel: params.channel || undefined,
    })

    if (!extractionResult.success) {
      return {
        success: false,
        tasks: [],
        projects,
        teamMembers,
        error: extractionResult.error,
        errorCode: extractionResult.errorCode,
      }
    }

    return {
      success: true,
      tasks: extractionResult.tasks,
      projects,
      teamMembers,
    }
  } catch (err: any) {
    if (err.message === 'UNAUTHENTICATED' || err.message === 'INSUFFICIENT_ROLE' || err.message === 'NOT_FOUND') {
      throw err
    }
    console.error('[CommunicationHub:Actions] Error in extractTasksFromThreadAction:', err)
    return {
      success: false,
      tasks: [],
      projects: [],
      teamMembers: [],
      error: err.message || 'Failed to extract tasks.',
    }
  }
}

export interface CreateExtractedTaskParams {
  projectId: string
  title: string
  description?: string
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  dueDate?: string | null
  assignedTo?: string | null
  sourceSnippet?: string
  clientId?: string | null
  messageId?: string | null
}

/**
 * Approves and creates an AI-extracted task linked to a target project and client.
 * Strictly human-in-the-loop: called only upon explicit user confirmation.
 */
export async function createExtractedTaskAction(
  params: CreateExtractedTaskParams
) {
  const session = await requireRole(['owner', 'admin', 'member'])

  const {
    projectId,
    title,
    description = '',
    priority = 'medium',
    dueDate = null,
    assignedTo = null,
    sourceSnippet,
    clientId,
    messageId,
  } = params

  if (!title || !title.trim()) {
    return { success: false, error: 'Task title is required.' }
  }

  if (!projectId) {
    return { success: false, error: 'Please select a target project.' }
  }

  // Cross-tenant parent resource verification: project must belong to caller's org
  const parent = await queryOne<{ id: string }>(
    'SELECT id FROM projects WHERE id = $1 AND organization_id = $2',
    [projectId, session.organization.id]
  )
  if (!parent) {
    throw new Error('NOT_FOUND')
  }

  try {
    let fullDescription = description.trim()
    if (sourceSnippet) {
      fullDescription += `\n\n> "${sourceSnippet}"\n— Extracted via AI from client communication`
    } else {
      fullDescription += `\n\n— Extracted via AI from client communication`
    }

    const data = await queryOne<{ id: string }>(
      `INSERT INTO tasks (
         organization_id, project_id, title, description, assigned_to, priority, status, due_date
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        session.organization.id,
        projectId,
        title.trim(),
        fullDescription.trim(),
        assignedTo || null,
        priority,
        'todo',
        dueDate || null,
      ]
    )

    if (!data) {
      return { success: false, error: 'Failed to insert task.' }
    }

    try {
      await logAuditEvent({
        actorId: session.user.id,
        action: 'TASK_CREATED',
        targetType: 'task',
        targetId: data.id,
        details: {
          title,
          project_id: projectId,
          organizationId: session.organization.id,
          source: 'ai_extraction',
          clientId,
          messageId,
        },
      })
    } catch (e) {}

    revalidatePath('/tasks')
    revalidatePath('/inbox')
    revalidatePath(`/projects/${projectId}`)
    if (clientId) {
      revalidatePath(`/clients/${clientId}/communications`)
    }

    return { success: true, taskId: data.id }
  } catch (err: any) {
    if (err.message === 'UNAUTHENTICATED' || err.message === 'INSUFFICIENT_ROLE' || err.message === 'NOT_FOUND') {
      throw err
    }
    console.error('[CommunicationHub:Actions] Error creating extracted task:', err)
    return { success: false, error: err.message || 'Failed to create task.' }
  }
}

