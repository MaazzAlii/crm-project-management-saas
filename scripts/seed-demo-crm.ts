import { query } from '../lib/db';

async function seed() {
  const orgId = '4df3a2e5-f47d-4dbf-8f79-e23bbefa1ce4';

  console.log('Seeding demo CRM records for organization:', orgId);

  // 1. Insert Client 1
  const client1Res = await query<{ id: string }>(
    `INSERT INTO clients (
      organization_id, name, company, email, phone, platform, country, currency,
      payment_schedule, status, communication_mode, notes, tags, pipeline_stage,
      deal_value, lead_score, lead_score_updated_at, lead_score_breakdown, created_at, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), $17, NOW(), NOW()
    ) ON CONFLICT DO NOTHING RETURNING id`,
    [
      orgId,
      'Acme Global Innovations',
      'Acme Corp',
      'alex.mercer@acmeglobal.com',
      '+1 (415) 890-2345',
      'Slack',
      'United States',
      'USD',
      'Monthly Retainer',
      'active',
      'connected',
      'Strategic enterprise account with connected Slack communication and real-time syncing.',
      ['Enterprise', 'Retainer', 'High-Priority'],
      'qualified',
      48500,
      89,
      JSON.stringify({
        score: 89,
        tier: 'high',
        summary: 'Enterprise lead with strong budget commitment, active stakeholder engagement, and clear project scope.',
        factors: [
          {
            factor: 'Budget Alignment',
            impact: 'positive',
            description: 'Deal value ($48,500) matches typical closed-won enterprise retainer profile.',
          },
          {
            factor: 'Communication Velocity',
            impact: 'positive',
            description: 'Stakeholder responded within 3 hours on Slack integration.',
          },
          {
            factor: 'Decision Authority',
            impact: 'positive',
            description: 'Point of contact is Head of Engineering with direct signatory approval.',
          },
        ],
        recommendedAction: 'Send executive proposal with customized SLA and project delivery milestones.',
        calculatedAt: new Date().toISOString(),
      }),
    ]
  );

  let client1Id = client1Res.rows[0]?.id;
  if (!client1Id) {
    const existing = await query<{ id: string }>(
      'SELECT id FROM clients WHERE organization_id = $1 AND email = $2',
      [orgId, 'alex.mercer@acmeglobal.com']
    );
    client1Id = existing.rows[0]?.id;
  }

  // 2. Insert Client 2
  const client2Res = await query<{ id: string }>(
    `INSERT INTO clients (
      organization_id, name, company, email, phone, platform, country, currency,
      payment_schedule, status, communication_mode, notes, tags, pipeline_stage,
      deal_value, lead_score, lead_score_updated_at, lead_score_breakdown, created_at, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), $17, NOW(), NOW()
    ) ON CONFLICT DO NOTHING RETURNING id`,
    [
      orgId,
      'Starlight Digital Media',
      'Starlight Inc',
      'sarah.chen@starlightmedia.io',
      '+1 (212) 555-0199',
      'WhatsApp',
      'Canada',
      'USD',
      'Milestone',
      'active',
      'manual',
      'Creative digital agency requiring bespoke CRM workflow automation.',
      ['Agency Partner', 'Q4 Expansion'],
      'proposal_sent',
      32000,
      74,
      JSON.stringify({
        score: 74,
        tier: 'high',
        summary: 'Growing agency looking for full CRM automation and deliverable portal rollout.',
        factors: [
          {
            factor: 'Immediate Timeline',
            impact: 'positive',
            description: 'Target kickoff date is within the next 14 calendar days.',
          },
          {
            factor: 'Multi-Channel Scope',
            impact: 'neutral',
            description: 'Requires custom webhook routing for WhatsApp and Discord.',
          },
        ],
        recommendedAction: 'Schedule 20-minute technical alignment demo before contract execution.',
        calculatedAt: new Date().toISOString(),
      }),
    ]
  );

  let client2Id = client2Res.rows[0]?.id;
  if (!client2Id) {
    const existing = await query<{ id: string }>(
      'SELECT id FROM clients WHERE organization_id = $1 AND email = $2',
      [orgId, 'sarah.chen@starlightmedia.io']
    );
    client2Id = existing.rows[0]?.id;
  }

  // 3. Insert Projects
  if (client1Id) {
    await query(
      `INSERT INTO projects (
        organization_id, client_id, title, description, type, amount, currency,
        status, priority, start_date, deadline, created_at, updated_at
      ) VALUES (
        $1, $2, 'Cloud Infrastructure Modernization', 'Kubernetes migration and database clustering for high availability.', 'Engineering', 48500, 'USD',
        'in_progress', 'high', CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', NOW(), NOW()
      ) ON CONFLICT DO NOTHING`,
      [orgId, client1Id]
    );
  }

  if (client2Id) {
    await query(
      `INSERT INTO projects (
        organization_id, client_id, title, description, type, amount, currency,
        status, priority, start_date, deadline, created_at, updated_at
      ) VALUES (
        $1, $2, 'Omnichannel Messaging Portal', 'Unified communication integration with real-time webhooks.', 'Product Design', 32000, 'USD',
        'in_review', 'medium', CURRENT_DATE, CURRENT_DATE + INTERVAL '21 days', NOW(), NOW()
      ) ON CONFLICT DO NOTHING`,
      [orgId, client2Id]
    );
  }

  console.log('✅ Demo seed completed! Client 1:', client1Id, 'Client 2:', client2Id);
}

seed().catch(console.error);
