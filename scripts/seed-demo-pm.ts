import { query } from '../lib/db';

async function seedPM() {
  const orgId = '4df3a2e5-f47d-4dbf-8f79-e23bbefa1ce4';
  const projectId = 'c6f17969-43c5-4cfc-b27d-91516c5c1d8a';

  // 1. Deliverables
  await query(
    `INSERT INTO deliverables (
      organization_id, project_id, title, file_url, drive_link, status, submitted_at, created_at, updated_at
    ) VALUES 
    ($1, $2, 'Production Architecture Blueprint & Terraform Specs', 'https://storage.innoventix.io/deliverables/arch-v1.pdf', 'https://drive.google.com/file/d/arch-v1', 'approved', NOW(), NOW(), NOW()),
    ($1, $2, 'Database Migration Runbook & Failover Testing Log', 'https://storage.innoventix.io/deliverables/db-runbook.pdf', 'https://drive.google.com/file/d/db-runbook', 'pending', NOW(), NOW(), NOW())
    ON CONFLICT DO NOTHING`,
    [orgId, projectId]
  );

  // 2. Tasks
  await query(
    `INSERT INTO tasks (
      organization_id, project_id, title, description, status, priority, due_date, created_at, updated_at
    ) VALUES 
    ($1, $2, 'Provision multi-region PostgreSQL replica pool', 'Setup Contabo VPS primary with automated streaming replication.', 'in_progress', 'high', CURRENT_DATE + INTERVAL '5 days', NOW(), NOW()),
    ($1, $2, 'Configure Edge JWT authentication middleware', 'Verify HTTP-only cookie validation and role enforcement.', 'done', 'high', CURRENT_DATE - INTERVAL '1 days', NOW(), NOW()),
    ($1, $2, 'Execute end-to-end load testing and verify telemetry', 'Simulate 5,000 req/sec multi-tenant CRM traffic.', 'todo', 'medium', CURRENT_DATE + INTERVAL '12 days', NOW(), NOW())
    ON CONFLICT DO NOTHING`,
    [orgId, projectId]
  );

  console.log('✅ Demo deliverables and tasks seeded successfully!');
}

seedPM().catch(console.error);
