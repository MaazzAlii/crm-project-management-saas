/**
 * TASK 66 — Multi-Tenant Scale & Load Test Seeding Script
 * 
 * Generates synthetic benchmark dataset:
 * - 1 Primary Scale Benchmark Organization ("Apex Growth Agency")
 * - 4 Additional Multi-Tenant Organizations ("Nexus Studio", "Vortex Digital", "Pulse Creative", "Echo Labs")
 * - 65 Clients in benchmark org + 20 across other tenants (85 total)
 * - 250 Projects in benchmark org + 40 across other tenants (290 total)
 * - 750 Tasks distributed across projects
 * - 1,500 Communication Messages across channels (Slack, WhatsApp, Email, Discord, Upwork)
 */

import { createClient } from '@supabase/supabase-js'

if (typeof (globalThis as any).WebSocket === 'undefined') {
  ;(globalThis as any).WebSocket = class MockWebSocket {}
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvY2FsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTYwMDAwMDAwMCwiZXhwIjoyMDAwMDAwMDAwfQ.jh8w9WNdFpBjW6Cwx9ngZtcbJBcBDMJKFephRo60naU'

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

export const BENCHMARK_ORG_ID = '99999999-0000-0000-0000-000000000001'
export const TENANT_ORG_IDS = [
  '99999999-0000-0000-0000-000000000002',
  '99999999-0000-0000-0000-000000000003',
  '99999999-0000-0000-0000-000000000004',
  '99999999-0000-0000-0000-000000000005',
]

const PIPELINE_STAGES = ['lead', 'contacted', 'proposal', 'negotiation', 'won', 'lost']
const PROJECT_STATUSES = ['brief_received', 'in_progress', 'in_review', 'delivered', 'invoiced', 'paid']
const CHANNELS = ['slack', 'whatsapp', 'email', 'discord', 'upwork']

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

export async function seedLoadTestData() {
  console.log('🚀 Starting synthetic data generation for Load & Scale Testing...')
  const startTime = Date.now()

  // 1. Seed Organizations
  console.log('📦 Seeding 5 multi-tenant organizations...')
  const orgsToInsert = [
    {
      id: BENCHMARK_ORG_ID,
      name: 'Apex Growth Agency (Target Scale)',
      slug: 'apex-growth-scale',
      plan_tier: 'enterprise',
      billing_status: 'active',
    },
    {
      id: TENANT_ORG_IDS[0],
      name: 'Nexus Studio',
      slug: 'nexus-studio',
      plan_tier: 'pro',
      billing_status: 'active',
    },
    {
      id: TENANT_ORG_IDS[1],
      name: 'Vortex Digital',
      slug: 'vortex-digital',
      plan_tier: 'pro',
      billing_status: 'active',
    },
    {
      id: TENANT_ORG_IDS[2],
      name: 'Pulse Creative',
      slug: 'pulse-creative',
      plan_tier: 'starter',
      billing_status: 'active',
    },
    {
      id: TENANT_ORG_IDS[3],
      name: 'Echo Labs',
      slug: 'echo-labs',
      plan_tier: 'starter',
      billing_status: 'active',
    },
  ]

  const { error: orgError } = await supabase
    .from('organizations')
    .upsert(orgsToInsert, { onConflict: 'id' })

  if (orgError) {
    throw new Error(`Failed to upsert organizations: ${orgError.message}`)
  }

  // 2. Seed Communication Channels for Benchmark Org
  console.log('📡 Seeding communication channels...')
  const channelsToInsert = CHANNELS.map((provider, i) => ({
    id: `99990000-0000-0000-0000-00000000000${i + 1}`,
    organization_id: BENCHMARK_ORG_ID,
    provider,
    channel_name: `${provider.toUpperCase()} Enterprise Stream`,
    external_account_id: `ext_${provider}_bench_${i + 1}`,
    status: 'active',
  }))

  const { error: chanError } = await supabase
    .from('communication_channels')
    .upsert(channelsToInsert, { onConflict: 'id' })

  if (chanError) {
    throw new Error(`Failed to upsert communication channels: ${chanError.message}`)
  }

  // 3. Seed 65 Clients for Benchmark Org + 20 for other tenants
  console.log('👥 Seeding 85 clients across organizations...')
  const clientsToInsert: any[] = []

  for (let i = 1; i <= 65; i++) {
    const stage = PIPELINE_STAGES[i % PIPELINE_STAGES.length]
    const mode = i % 2 === 0 ? 'connected' : 'manual'
    clientsToInsert.push({
      id: `99991000-0000-0000-0000-${String(i).padStart(12, '0')}`,
      organization_id: BENCHMARK_ORG_ID,
      name: `Benchmark Client ${i}`,
      company: `Client Corporation ${i}`,
      email: `client${i}@benchmark-corp.com`,
      phone: `+15550100${String(i).padStart(4, '0')}`,
      pipeline_stage: stage,
      lead_score: Math.floor(Math.random() * 100),
      communication_mode: mode,
      notes: `Seeded scale testing client #${i}`,
      created_at: new Date(Date.now() - (70 - i) * 86400000).toISOString(),
    })
  }

  TENANT_ORG_IDS.forEach((tenantId, tIdx) => {
    for (let j = 1; j <= 5; j++) {
      const idx = 65 + tIdx * 5 + j
      clientsToInsert.push({
        id: `99991000-0000-0000-0000-${String(idx).padStart(12, '0')}`,
        organization_id: tenantId,
        name: `Tenant ${tIdx + 1} Client ${j}`,
        company: `Tenant ${tIdx + 1} Corp ${j}`,
        email: `t${tIdx + 1}c${j}@tenant-sample.com`,
        pipeline_stage: PIPELINE_STAGES[j % PIPELINE_STAGES.length],
        lead_score: Math.floor(Math.random() * 90),
        communication_mode: 'connected',
        created_at: new Date(Date.now() - j * 86400000).toISOString(),
      })
    }
  })

  const { error: clientError } = await supabase
    .from('clients')
    .upsert(clientsToInsert, { onConflict: 'id' })

  if (clientError) {
    throw new Error(`Failed to upsert clients: ${clientError.message}`)
  }

  // 4. Seed 250 Projects for Benchmark Org + 40 for other tenants
  console.log('📁 Seeding 290 projects across organizations...')
  const projectsToInsert: any[] = []

  for (let i = 1; i <= 250; i++) {
    const clientIdx = (i % 65) + 1
    const clientId = `99991000-0000-0000-0000-${String(clientIdx).padStart(12, '0')}`
    const status = PROJECT_STATUSES[i % PROJECT_STATUSES.length]
    const dayOffset = (i % 30) - 10
    const deadline = formatDate(new Date(Date.now() + dayOffset * 86400000))

    projectsToInsert.push({
      id: `99992000-0000-0000-0000-${String(i).padStart(12, '0')}`,
      organization_id: BENCHMARK_ORG_ID,
      client_id: clientId,
      title: `Scale Project ${i} — ${status.toUpperCase()}`,
      description: `Comprehensive project deliverable suite #${i}`,
      status,
      amount: (i * 250) + 1500,
      currency: 'USD',
      deadline,
      created_at: new Date(Date.now() - (260 - i) * 86400000).toISOString(),
    })
  }

  TENANT_ORG_IDS.forEach((tenantId, tIdx) => {
    for (let j = 1; j <= 10; j++) {
      const idx = 250 + tIdx * 10 + j
      const clientIdx = 65 + tIdx * 5 + ((j % 5) + 1)
      const clientId = `99991000-0000-0000-0000-${String(clientIdx).padStart(12, '0')}`
      projectsToInsert.push({
        id: `99992000-0000-0000-0000-${String(idx).padStart(12, '0')}`,
        organization_id: tenantId,
        client_id: clientId,
        title: `Tenant ${tIdx + 1} Project ${j}`,
        status: PROJECT_STATUSES[j % PROJECT_STATUSES.length],
        amount: 3500,
        deadline: formatDate(new Date(Date.now() + j * 86400000 * 3)),
        created_at: new Date(Date.now() - j * 86400000).toISOString(),
      })
    }
  })

  for (let c = 0; c < projectsToInsert.length; c += 100) {
    const chunk = projectsToInsert.slice(c, c + 100)
    const { error: projError } = await supabase
      .from('projects')
      .upsert(chunk, { onConflict: 'id' })
    if (projError) {
      throw new Error(`Failed to upsert projects chunk: ${projError.message}`)
    }
  }

  // 5. Seed 750 Tasks
  console.log('✅ Seeding 750 tasks across projects...')
  const tasksToInsert: any[] = []

  for (let i = 1; i <= 750; i++) {
    const projIdx = (i % 250) + 1
    const projectId = `99992000-0000-0000-0000-${String(projIdx).padStart(12, '0')}`
    const isDone = i % 3 === 0
    const priority = i % 4 === 0 ? 'urgent' : i % 3 === 0 ? 'high' : 'medium'
    const dueDate = formatDate(new Date(Date.now() + ((i % 15) - 3) * 86400000))

    tasksToInsert.push({
      id: `99993000-0000-0000-0000-${String(i).padStart(12, '0')}`,
      organization_id: BENCHMARK_ORG_ID,
      project_id: projectId,
      title: `Task #${i}: Feature Implementation & Quality Review`,
      status: isDone ? 'done' : 'todo',
      priority,
      due_date: dueDate,
      created_at: new Date(Date.now() - (760 - i) * 3600000).toISOString(),
    })
  }

  for (let c = 0; c < tasksToInsert.length; c += 100) {
    const chunk = tasksToInsert.slice(c, c + 100)
    const { error: taskError } = await supabase
      .from('tasks')
      .upsert(chunk, { onConflict: 'id' })
    if (taskError) {
      throw new Error(`Failed to upsert tasks chunk: ${taskError.message}`)
    }
  }

  // 6. Seed 1,500 Communication Messages
  console.log('💬 Seeding 1,500 communication messages...')
  const messagesToInsert: any[] = []

  for (let i = 1; i <= 1500; i++) {
    const chanIdx = (i % CHANNELS.length) + 1
    const channelId = `99990000-0000-0000-0000-00000000000${chanIdx}`
    const clientIdx = (i % 65) + 1
    const isUnmatched = i % 5 === 0
    const clientId = isUnmatched ? null : `99991000-0000-0000-0000-${String(clientIdx).padStart(12, '0')}`
    const direction = i % 2 === 0 ? 'inbound' : 'outbound'
    const isRead = i % 3 !== 0

    messagesToInsert.push({
      id: `99994000-0000-0000-0000-${String(i).padStart(12, '0')}`,
      organization_id: BENCHMARK_ORG_ID,
      channel_id: channelId,
      client_id: clientId,
      direction,
      sender_name: direction === 'inbound' ? `Client Representative ${clientIdx}` : 'Apex Account Exec',
      sender_identifier: direction === 'inbound' ? `client_${clientIdx}@corp.com` : 'support@apexgrowth.com',
      body: `Message #${i}: Project status update and feedback discussion regarding milestones and deliverables.`,
      read_at: isRead ? new Date(Date.now() - (1500 - i) * 60000).toISOString() : null,
      sent_at: new Date(Date.now() - (1500 - i) * 1800000).toISOString(),
    })
  }

  for (let c = 0; c < messagesToInsert.length; c += 150) {
    const chunk = messagesToInsert.slice(c, c + 150)
    const { error: msgError } = await supabase
      .from('communication_messages')
      .upsert(chunk, { onConflict: 'id' })
    if (msgError) {
      throw new Error(`Failed to upsert messages chunk: ${msgError.message}`)
    }
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2)
  console.log(`✨ Successfully seeded dataset in ${durationSec}s:`)
  console.log(`   - 5 Organizations (1 target scale, 4 multi-tenant neighbors)`)
  console.log(`   - ${clientsToInsert.length} Clients (65 in benchmark org)`)
  console.log(`   - ${projectsToInsert.length} Projects (250 in benchmark org)`)
  console.log(`   - ${tasksToInsert.length} Tasks`)
  console.log(`   - ${messagesToInsert.length} Communication Messages`)
}

// Auto-run if executed directly
if (require.main === module || process.argv[1]?.endsWith('seed-load-test.ts')) {
  seedLoadTestData().catch((err) => {
    console.error('❌ Seeding failed:', err)
    process.exit(1)
  })
}
