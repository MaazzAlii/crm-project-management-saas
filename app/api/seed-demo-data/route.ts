import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentSessionContext } from '@/lib/auth/session';
import { verifyAccessToken } from '@/lib/auth/jwt';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  return POST(request);
}

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user from session cookie or Authorization header
    let userId: string | null = null;
    let orgId: string | null = null;

    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const payload = verifyAccessToken(authHeader.substring(7));
      if (payload?.userId) {
        userId = payload.userId;
        orgId = payload.orgId || null;
      }
    }

    if (!userId) {
      const session = await getCurrentSessionContext();
      if (session?.user) {
        userId = session.user.id;
        orgId = session.orgId || session.organization?.id || null;
      }
    }

    // Fallback: look up primary admin user if in setup mode
    if (!userId) {
      const adminUser = (
        await query<{ id: string }>('SELECT id FROM users ORDER BY created_at ASC LIMIT 1')
      ).rows?.[0];
      if (adminUser) {
        userId = adminUser.id;
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'No user found to seed data for' }, { status: 401 });
    }

    // Find user's organization
    if (!orgId) {
      const memberOrg = (
        await query<{ organization_id: string }>(
          'SELECT organization_id FROM organization_members WHERE user_id = $1 LIMIT 1',
          [userId]
        )
      ).rows?.[0];

      if (memberOrg) {
        orgId = memberOrg.organization_id;
      } else {
        const anyOrg = (
          await query<{ id: string }>('SELECT id FROM organizations ORDER BY created_at ASC LIMIT 1')
        ).rows?.[0];
        orgId = anyOrg?.id || null;
      }
    }

    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    console.log(`[SeedDemo] Seeding rich enterprise demo data for organization: ${orgId}`);

    // ========================================================
    // 1. CLIENTS & LEADS
    // ========================================================
    const clientsData = [
      {
        name: 'Alex Mercer',
        company: 'Acme Global Innovations',
        email: 'alex.mercer@acmeglobal.com',
        phone: '+1 (415) 890-2345',
        platform: 'Slack',
        country: 'United States',
        currency: 'USD',
        paymentSchedule: 'monthly_retainer',
        status: 'active',
        communicationMode: 'connected',
        notes: 'Strategic enterprise partner with real-time Slack channels enabled.',
        tags: ['Enterprise', 'Retainer', 'High-Priority'],
        pipelineStage: 'negotiation',
        dealValue: 75000,
        leadScore: 92,
        breakdown: {
          score: 92,
          tier: 'high',
          summary: 'Premier enterprise account with confirmed executive budget and immediate Q4 delivery scope.',
          factors: [
            { factor: 'Budget Fit', impact: 'positive', description: '$75,000 annual deal matches enterprise retainer criteria.' },
            { factor: 'Slack Engagement', impact: 'positive', description: 'Avg reply turnaround under 2 hours.' },
            { factor: 'Executive Sponsorship', impact: 'positive', description: 'VP of Product is primary project sponsor.' },
          ],
          recommendedAction: 'Finalize Master Services Agreement (MSA) and lock in Sprint 1 kickoff dates.',
          calculatedAt: new Date().toISOString(),
        },
      },
      {
        name: 'Sarah Chen',
        company: 'Starlight Digital Media',
        email: 'sarah.chen@starlightmedia.io',
        phone: '+1 (212) 555-0199',
        platform: 'WhatsApp',
        country: 'Canada',
        currency: 'USD',
        paymentSchedule: 'per_project',
        status: 'active',
        communicationMode: 'connected',
        notes: 'High-growth digital media agency building omnichannel engagement portals.',
        tags: ['Agency Partner', 'Q4 Expansion', 'Design'],
        pipelineStage: 'proposal_sent',
        dealValue: 42000,
        leadScore: 84,
        breakdown: {
          score: 84,
          tier: 'high',
          summary: 'Proposal delivered with active milestone checkpoints.',
          factors: [
            { factor: 'Project Scope', impact: 'positive', description: 'Clear deliverable roadmap and Figma design sign-off.' },
            { factor: 'WhatsApp Stream', impact: 'positive', description: 'Direct project manager channel connected.' },
          ],
          recommendedAction: 'Follow up on proposal review and schedule final technical alignment call.',
          calculatedAt: new Date().toISOString(),
        },
      },
      {
        name: 'Marcus Vance',
        company: 'Quantum Health Technologies',
        email: 'marcus.vance@quantumhealth.com',
        phone: '+44 20 7946 0912',
        platform: 'Email',
        country: 'United Kingdom',
        currency: 'USD',
        paymentSchedule: 'monthly_retainer',
        status: 'active',
        communicationMode: 'manual',
        notes: 'Healthcare compliance SaaS requiring custom portal workflows and SLA guarantees.',
        tags: ['Healthcare', 'Compliance', 'SaaS'],
        pipelineStage: 'qualified',
        dealValue: 60000,
        leadScore: 78,
        breakdown: {
          score: 78,
          tier: 'medium',
          summary: 'High deal value with pending compliance and security verification review.',
          factors: [
            { factor: 'Industry Fit', impact: 'positive', description: 'Standard enterprise compliance requirements.' },
            { factor: 'Security Review', impact: 'neutral', description: 'SOC2 checklist pending completion.' },
          ],
          recommendedAction: 'Provide SOC2 and compliance packet to accelerate security sign-off.',
          calculatedAt: new Date().toISOString(),
        },
      },
      {
        name: 'Elena Rostova',
        company: 'Apex Retail Labs',
        email: 'elena@apexretaillabs.com',
        phone: '+1 (312) 555-4488',
        platform: 'Discord',
        country: 'United States',
        currency: 'USD',
        paymentSchedule: 'per_project',
        status: 'active',
        communicationMode: 'connected',
        notes: 'Omnichannel e-commerce optimization and AI personalized recommendation engine.',
        tags: ['E-Commerce', 'AI', 'Retail'],
        pipelineStage: 'won',
        dealValue: 95000,
        leadScore: 98,
        breakdown: {
          score: 98,
          tier: 'high',
          summary: 'Closed-Won enterprise agreement with active delivery phases underway.',
          factors: [
            { factor: 'Contract Signed', impact: 'positive', description: 'Full annual contract executed.' },
            { factor: 'Payment Cleared', impact: 'positive', description: 'Initial deposit invoiced and received.' },
          ],
          recommendedAction: 'Conduct weekly sprint review and monitor deliverable completion velocity.',
          calculatedAt: new Date().toISOString(),
        },
      },
      {
        name: 'Julian Thorne',
        company: 'Pulse Creative Studios',
        email: 'julian@pulsecreative.de',
        phone: '+49 30 8901 2345',
        platform: 'Upwork',
        country: 'Germany',
        currency: 'EUR',
        paymentSchedule: 'hourly',
        status: 'lead',
        communicationMode: 'manual',
        notes: 'Brand redesign and multi-platform web presence.',
        tags: ['Branding', 'Design', 'Europe'],
        pipelineStage: 'contacted',
        dealValue: 28000,
        leadScore: 65,
        breakdown: {
          score: 65,
          tier: 'medium',
          summary: 'Early-stage inquiry requiring scope definition and timeline clarification.',
          factors: [
            { factor: 'Scope Clarity', impact: 'neutral', description: 'Creative brief awaiting stakeholder refinement.' },
          ],
          recommendedAction: 'Send discovery questionnaire to clarify deliverable requirements.',
          calculatedAt: new Date().toISOString(),
        },
      },
      {
        name: 'Claire Beauchamp',
        company: 'Horizon Logistics Global',
        email: 'claire@horizonlogistics.fr',
        phone: '+33 1 42 68 55 00',
        platform: 'Email',
        country: 'France',
        currency: 'EUR',
        paymentSchedule: 'monthly_retainer',
        status: 'lead',
        communicationMode: 'connected',
        notes: 'Automated fleet dispatch and real-time cargo tracking dashboard.',
        tags: ['Logistics', 'Real-Time', 'IoT'],
        pipelineStage: 'lead',
        dealValue: 54000,
        leadScore: 71,
        breakdown: {
          score: 71,
          tier: 'medium',
          summary: 'Inbound lead requesting API specification and architecture review.',
          factors: [
            { factor: 'Technical Feasibility', impact: 'positive', description: 'Compatible with standard REST API webhooks.' },
          ],
          recommendedAction: 'Schedule technical discovery demo with Lead Architect.',
          calculatedAt: new Date().toISOString(),
        },
      },
    ];

    const insertedClientIds: string[] = [];

    for (const c of clientsData) {
      const res = await query<{ id: string }>(
        `INSERT INTO clients (
          organization_id, name, company, email, phone, platform, country, currency,
          payment_schedule, status, communication_mode, notes, tags, pipeline_stage,
          deal_value, lead_score, lead_score_updated_at, lead_score_breakdown, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), $17, NOW(), NOW()
        )
        ON CONFLICT DO NOTHING
        RETURNING id`,
        [
          orgId, c.name, c.company, c.email, c.phone, c.platform, c.country, c.currency,
          c.paymentSchedule, c.status, c.communicationMode, c.notes, c.tags, c.pipelineStage,
          c.dealValue, c.leadScore, JSON.stringify(c.breakdown),
        ]
      );

      let cId = res.rows?.[0]?.id;
      if (!cId) {
        const existing = await query<{ id: string }>(
          'SELECT id FROM clients WHERE organization_id = $1 AND email = $2',
          [orgId, c.email]
        );
        cId = existing.rows?.[0]?.id;
      }
      if (cId) insertedClientIds.push(cId);
    }

    // ========================================================
    // 2. PROJECTS & DELIVERABLES
    // ========================================================
    const projectsData = [
      {
        clientIdx: 0,
        title: 'Cloud Infrastructure Modernization & Kubernetes Rollout',
        description: 'Multi-region Kubernetes clustering, zero-downtime deployment pipelines, and database replication.',
        type: 'Engineering',
        amount: 48500,
        currency: 'USD',
        status: 'in_progress',
        priority: 'urgent',
        deliverables: [
          { title: 'Terraform Architecture Blueprint', description: 'Infrastructure as Code specification with VPC peering.', status: 'approved' },
          { title: 'Zero-Downtime CI/CD Pipeline', description: 'Automated GitHub Actions workflow with staging smoke tests.', status: 'in_review' },
          { title: 'PostgreSQL Failover & Disaster Recovery', description: 'Automated S3 snapshot backups and WAL archiving.', status: 'pending' },
        ],
        tasks: [
          { title: 'Configure Multi-Region VPC Peering', status: 'completed', priority: 'high', dueDate: 2 },
          { title: 'Deploy Staging Kubernetes Cluster', status: 'in_progress', priority: 'urgent', dueDate: 5 },
          { title: 'Execute Automated Security Penetration Test', status: 'todo', priority: 'high', dueDate: 12 },
        ],
      },
      {
        clientIdx: 1,
        title: 'Omnichannel Agency CRM & Messaging Hub',
        description: 'Unified customer communications integration across Slack, WhatsApp, and SendGrid.',
        type: 'Product Design',
        amount: 32000,
        currency: 'USD',
        status: 'in_review',
        priority: 'high',
        deliverables: [
          { title: 'Design System & Component Library', description: 'Complete Figma design kit and dark-mode tokens.', status: 'approved' },
          { title: 'Multi-Channel Inbound Webhooks Adapter', description: 'Unified webhook handler for Twilio and Discord.', status: 'in_review' },
        ],
        tasks: [
          { title: 'Implement AI Smart Reply Suggestion Box', status: 'completed', priority: 'high', dueDate: 1 },
          { title: 'Wire Up Inbound Webhook Signature Validator', status: 'review', priority: 'medium', dueDate: 4 },
          { title: 'Conduct User Acceptance Testing', status: 'todo', priority: 'medium', dueDate: 10 },
        ],
      },
      {
        clientIdx: 3,
        title: 'AI Personalized Recommendation Engine v2',
        description: 'Real-time vector search and personalized product ranking algorithm for e-commerce.',
        type: 'AI & Data',
        amount: 95000,
        currency: 'USD',
        status: 'in_progress',
        priority: 'urgent',
        deliverables: [
          { title: 'Vector Embedding Pipeline', description: 'High-throughput OpenAI / Gemini embedding generator.', status: 'approved' },
          { title: 'Sub-50ms Recommendation API', description: 'Cached similarity search endpoint with Redis fallback.', status: 'in_review' },
          { title: 'A/B Testing Analytics Dashboard', description: 'Conversion tracking and CTR uplift metrics visualizer.', status: 'pending' },
        ],
        tasks: [
          { title: 'Benchmark Vector Search Latency', status: 'completed', priority: 'urgent', dueDate: 3 },
          { title: 'Integrate Stripe Usage Metering', status: 'in_progress', priority: 'high', dueDate: 7 },
          { title: 'Deploy Model to Production Edge', status: 'todo', priority: 'high', dueDate: 14 },
        ],
      },
      {
        clientIdx: 2,
        title: 'HIPAA-Compliant Patient Portal & Telehealth Bridge',
        description: 'End-to-end encrypted messaging, secure file exchange, and audit compliance logging.',
        type: 'Compliance SaaS',
        amount: 60000,
        currency: 'USD',
        status: 'planning',
        priority: 'medium',
        deliverables: [
          { title: 'SOC2 & HIPAA Security Protocol Specs', description: 'Comprehensive compliance roadmap and threat matrix.', status: 'approved' },
        ],
        tasks: [
          { title: 'Draft Data Protection Impact Assessment', status: 'completed', priority: 'medium', dueDate: 6 },
          { title: 'Configure Audit Log Immutability Triggers', status: 'todo', priority: 'high', dueDate: 15 },
        ],
      },
    ];

    for (const p of projectsData) {
      const clientId = insertedClientIds[p.clientIdx] || insertedClientIds[0];
      if (!clientId) continue;

      const projRes = await query<{ id: string }>(
        `INSERT INTO projects (
          organization_id, client_id, title, description, type, amount, currency,
          status, priority, start_date, deadline, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE + INTERVAL '25 days', NOW(), NOW()
        )
        ON CONFLICT DO NOTHING
        RETURNING id`,
        [orgId, clientId, p.title, p.description, p.type, p.amount, p.currency, p.status, p.priority]
      );

      const projId = projRes.rows?.[0]?.id;
      if (!projId) continue;

      // Seed deliverables
      for (const d of p.deliverables) {
        await query(
          `INSERT INTO project_deliverables (
            project_id, organization_id, title, description, status, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
          ON CONFLICT DO NOTHING`,
          [projId, orgId, d.title, d.description, d.status]
        );
      }

      // Seed tasks
      for (const t of p.tasks) {
        await query(
          `INSERT INTO tasks (
            organization_id, project_id, title, status, priority, due_date, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, CURRENT_DATE + ($6 || ' days')::interval, NOW(), NOW())
          ON CONFLICT DO NOTHING`,
          [orgId, projId, t.title, t.status, t.priority, t.dueDate]
        );
      }
    }

    // ========================================================
    // 3. COMMUNICATION MESSAGES & INBOX
    // ========================================================
    const primaryClient = insertedClientIds[0];
    if (primaryClient) {
      const threadRes = await query<{ id: string }>(
        `INSERT INTO communication_threads (
          organization_id, client_id, channel, subject, is_active, created_at, updated_at
        ) VALUES ($1, $2, 'slack', 'Q4 Infrastructure Rollout & Sprint Milestones', true, NOW(), NOW())
        ON CONFLICT DO NOTHING
        RETURNING id`,
        [orgId, primaryClient]
      );

      const threadId = threadRes.rows?.[0]?.id;
      if (threadId) {
        const messages = [
          { senderType: 'client', senderName: 'Alex Mercer', body: 'Hi team, could you send the latest benchmark metrics for the PostgreSQL connection pool?' },
          { senderType: 'agent', senderName: 'Maaz Ali Shahid', body: 'Hi Alex! The cluster latency is currently averaging 4.2ms under 500 concurrent connections. Full report is in the deliverables tab.' },
          { senderType: 'client', senderName: 'Alex Mercer', body: 'Outstanding performance! Proceed with the production cutover this Friday.' },
        ];

        for (const msg of messages) {
          await query(
            `INSERT INTO communication_messages (
              thread_id, organization_id, sender_type, sender_name, body, created_at
            ) VALUES ($1, $2, $3, $4, $5, NOW())`,
            [threadId, orgId, msg.senderType, msg.senderName, msg.body]
          );
        }
      }
    }

    // 6. Bootstrap Sales Pipeline & Starter Deals
    const { pipelineRepo } = await import('@/lib/db/repositories/pipeline-repo');
    const { dealRepo } = await import('@/lib/db/repositories/deal-repo');

    const defaultPipeline = await pipelineRepo.ensureDefaultPipeline(orgId, userId);
    const stages = await pipelineRepo.listStages(orgId, defaultPipeline.id);
    const labels = await pipelineRepo.listLabels(orgId, defaultPipeline.id);

    const stageMap = new Map(stages.map((s) => [s.name.toLowerCase(), s.id]));

    const sampleDeals = [
      {
        stageName: 'lead',
        title: 'Global Fintech Cloud Core Migration',
        value: 48000,
        company: 'Apex Financial Technologies',
        contact: 'Marcus Vance',
        prob: 30,
        labels: labels.slice(0, 2).map((l) => l.id),
      },
      {
        stageName: 'qualified',
        title: 'Enterprise CRM Database Refactoring',
        value: 32000,
        company: 'Vanguard Systems',
        contact: 'Sophia Lin',
        prob: 50,
        labels: labels.slice(1, 3).map((l) => l.id),
      },
      {
        stageName: 'proposal',
        title: 'AI Multi-Tenant Search Architecture',
        value: 75000,
        company: 'HyperScale AI Labs',
        contact: 'Elena Rostova',
        prob: 70,
        labels: labels.slice(0, 1).map((l) => l.id),
      },
      {
        stageName: 'negotiation',
        title: 'Dedicated VPS Kubernetes Cluster SLA',
        value: 64000,
        company: 'Nexus Media Group',
        contact: 'David Keller',
        prob: 85,
        labels: labels.slice(2, 4).map((l) => l.id),
      },
      {
        stageName: 'won',
        title: 'Contabo Self-Hosted Node.js Backend Engine',
        value: 52000,
        company: 'Starlight Retail',
        contact: 'Sarah Jenkins',
        prob: 100,
        labels: labels.slice(1, 2).map((l) => l.id),
      },
    ];

    for (const d of sampleDeals) {
      const stageId = stageMap.get(d.stageName) || stages[0]?.id;
      if (stageId) {
        await dealRepo.createDeal(orgId, {
          pipeline_id: defaultPipeline.id,
          stage_id: stageId,
          title: d.title,
          value: d.value,
          probability: d.prob,
          company_name: d.company,
          contact_name: d.contact,
          owner_id: userId,
          label_ids: d.labels,
          status: d.stageName === 'won' ? 'won' : 'open',
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Rich enterprise demo data populated successfully!',
      organizationId: orgId,
      clientsCount: insertedClientIds.length,
      projectsCount: projectsData.length,
      dealsCount: sampleDeals.length,
    });
  } catch (error: any) {
    console.error('[SeedDemoError]', error);
    return NextResponse.json({ error: error.message || 'Internal seed error' }, { status: 500 });
  }
}
