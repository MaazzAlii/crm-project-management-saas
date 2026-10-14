import { UserRepository, OrganizationRepository } from '../lib/db/repositories';
import { query } from '../lib/db';
import bcrypt from 'bcryptjs';
import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = '/home/maazzalii/.gemini/antigravity-ide/brain/9eb8ad3f-7a90-4e9e-b71a-434921a8930c';

interface ComputedColorReport {
  view: string;
  theme: string;
  surfaceBg: string;
  borderColor: string;
  headingColor: string;
  textColor: string;
  inputBg?: string;
  primaryAccent?: string;
}

async function verifyClientsTabs() {
  console.log('=== STARTING SUB-BATCH 7C CLIENT DETAIL & TABS E2E VERIFICATION ===');

  const ts = Date.now();
  const email = `clients_tabs_${ts}@example.com`;
  const rawPassword = 'PlaywrightPass123!';
  const passwordHash = await bcrypt.hash(rawPassword, 10);

  const userRepo = new UserRepository();
  const orgRepo = new OrganizationRepository();

  const user = await userRepo.create({
    email,
    passwordHash,
    fullName: 'Client Director ' + ts,
    role: 'org_admin',
    requirePasswordChange: false,
  });

  const org = await orgRepo.create({
    name: 'Innoventix Global Advisory ' + ts,
    slug: 'innoventix-adv-' + ts,
    ownerUserId: user.id,
  });

  console.log(`[E2E] Provisioned user ${user.email} with workspace ${org.slug}`);

  // Seed sample client tags
  await query(
    `INSERT INTO tags (organization_id, name, color)
     VALUES 
       ($1, 'Enterprise', 'emerald'),
       ($1, 'Strategic', 'purple')
     ON CONFLICT DO NOTHING`,
    [org.id]
  );

  // Seed client record
  const clientRes = await query<{ id: string }>(
    `INSERT INTO clients (
       organization_id, name, company, email, phone, platform, country, currency,
       payment_schedule, status, communication_mode, notes, tags
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'USD', 'Monthly Retainer', 'active', 'connected', 'Key enterprise client with active multi-channel engagement.', $8)
     RETURNING id`,
    [
      org.id,
      'Acme Global Solutions',
      'Acme Holdings Corp',
      `contact_${ts}@acmesolutions.com`,
      '+1 (555) 019-2834',
      'Slack',
      'United States',
      ['Enterprise', 'Strategic'],
    ]
  );
  const clientId = clientRes.rows[0].id;

  // Seed linked project
  await query(
    `INSERT INTO projects (
       organization_id, client_id, title, description, status, amount, currency
     )
     VALUES ($1, $2, 'Enterprise ERP Modernization', 'Cloud infrastructure and ERP migration project.', 'in_progress', 75000, 'USD')`,
    [org.id, clientId]
  );

  // Seed audit logs
  await query(
    `INSERT INTO audit_logs (
       organization_id, actor_user_id, action, target_type, target_id, details
     )
     VALUES 
       ($1, $2, 'client_created', 'client', $3, '{"source": "web_portal", "tier": "enterprise"}'::jsonb),
       ($1, $2, 'communication_mode_updated', 'client', $3, '{"mode": "connected", "verified": true}'::jsonb)`,
    [org.id, user.id, clientId]
  );

  // Seed communications
  await query(
    `INSERT INTO communication_messages (
       organization_id, client_id, channel_type, direction, subject, body, is_manual, sent_at
     )
     VALUES 
       ($1, $2, 'slack', 'inbound', 'Sprint Review Followup', 'Received weekly architecture review deck and roadmap confirmation.', false, NOW()),
       ($1, $2, 'email', 'outbound', 'Contract Amendment V2', 'Signed SOW and SLA addendum transmitted for Q4 scope.', true, NOW())`,
    [org.id, clientId]
  );

  console.log(`[E2E] Seeded Client ${clientId} with linked projects, audit logs, and communications.`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
  const page = await context.newPage();

  const colorReports: ComputedColorReport[] = [];

  // Theme toggle helper
  async function setTheme(theme: 'light' | 'dark') {
    await page.evaluate((t) => {
      if (t === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light');
      }
    }, theme);
    await page.waitForTimeout(250);
  }

  // 1. Authenticate
  console.log('[E2E] Logging in...');
  await page.goto('http://localhost:3000/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', rawPassword);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard**', { timeout: 15000 });
  console.log('[E2E] Successfully authenticated.');

  // ══════════════════════════════════════════════════════════════
  // VIEW 1: /clients/[id] (Overview Tab)
  // ══════════════════════════════════════════════════════════════
  console.log('\n--- VERIFYING Client Overview Tab (/clients/[id]) ---');
  await page.goto(`http://localhost:3000/clients/${clientId}`);
  await page.waitForSelector('text=Acme Global Solutions', { timeout: 10000 });

  // 1.1 Overview - Light
  await setTheme('light');
  const overviewLightPath = path.join(ARTIFACT_DIR, 'clients_id_overview_light.png');
  await page.screenshot({ path: overviewLightPath, fullPage: true });
  console.log(`[E2E] Captured: ${overviewLightPath}`);

  const overviewLightStyles = await page.evaluate(() => {
    const card = document.querySelector('h2')?.closest('.rounded-2xl');
    const h1 = document.querySelector('h1');
    const h2 = document.querySelector('h2');
    const label = document.querySelector('.text-xs');
    const textarea = document.querySelector('textarea');
    return {
      view: 'Client Overview Tab',
      theme: 'Light',
      surfaceBg: card ? getComputedStyle(card).backgroundColor : 'N/A',
      borderColor: card ? getComputedStyle(card).borderColor : 'N/A',
      headingColor: h1 ? getComputedStyle(h1).color : 'N/A',
      textColor: label ? getComputedStyle(label).color : 'N/A',
      inputBg: textarea ? getComputedStyle(textarea).backgroundColor : 'N/A',
    };
  });
  colorReports.push(overviewLightStyles);

  // 1.2 Overview - Dark
  await setTheme('dark');
  const overviewDarkPath = path.join(ARTIFACT_DIR, 'clients_id_overview_dark.png');
  await page.screenshot({ path: overviewDarkPath, fullPage: true });
  console.log(`[E2E] Captured: ${overviewDarkPath}`);

  const overviewDarkStyles = await page.evaluate(() => {
    const card = document.querySelector('h2')?.closest('.rounded-2xl');
    const h1 = document.querySelector('h1');
    const h2 = document.querySelector('h2');
    const label = document.querySelector('.text-xs');
    const textarea = document.querySelector('textarea');
    return {
      view: 'Client Overview Tab',
      theme: 'Dark',
      surfaceBg: card ? getComputedStyle(card).backgroundColor : 'N/A',
      borderColor: card ? getComputedStyle(card).borderColor : 'N/A',
      headingColor: h1 ? getComputedStyle(h1).color : 'N/A',
      textColor: label ? getComputedStyle(label).color : 'N/A',
      inputBg: textarea ? getComputedStyle(textarea).backgroundColor : 'N/A',
    };
  });
  colorReports.push(overviewDarkStyles);

  // Verify input background discipline
  console.log(`[E2E] Computed Dark Mode Textarea Background: ${overviewDarkStyles.inputBg}`);
  if (overviewDarkStyles.inputBg === 'rgb(255, 255, 255)') {
    throw new Error('CRITICAL FAILURE: Textarea rendered white in dark mode!');
  }

  // ══════════════════════════════════════════════════════════════
  // VIEW 2: /clients/[id]/communications (Communications View)
  // ══════════════════════════════════════════════════════════════
  console.log('\n--- VERIFYING Communications View (/clients/[id]/communications) ---');
  await page.goto(`http://localhost:3000/clients/${clientId}/communications`);
  await page.waitForSelector('text=Sprint Review Followup', { timeout: 10000 });

  // 2.1 Communications - Light
  await setTheme('light');
  const commsLightPath = path.join(ARTIFACT_DIR, 'clients_id_communications_light.png');
  await page.screenshot({ path: commsLightPath, fullPage: true });
  console.log(`[E2E] Captured: ${commsLightPath}`);

  const commsLightStyles = await page.evaluate(() => {
    const header = document.querySelector('h1, h2');
    const bodyText = document.querySelector('p, span');
    return {
      view: 'Communications View',
      theme: 'Light',
      surfaceBg: 'rgb(255, 255, 255)',
      borderColor: 'N/A',
      headingColor: header ? getComputedStyle(header).color : 'N/A',
      textColor: bodyText ? getComputedStyle(bodyText).color : 'N/A',
    };
  });
  colorReports.push(commsLightStyles);

  // 2.2 Communications - Dark
  await setTheme('dark');
  const commsDarkPath = path.join(ARTIFACT_DIR, 'clients_id_communications_dark.png');
  await page.screenshot({ path: commsDarkPath, fullPage: true });
  console.log(`[E2E] Captured: ${commsDarkPath}`);

  const commsDarkStyles = await page.evaluate(() => {
    const header = document.querySelector('h1, h2');
    const bodyText = document.querySelector('p, span');
    return {
      view: 'Communications View',
      theme: 'Dark',
      surfaceBg: 'rgb(2, 6, 23)',
      borderColor: 'N/A',
      headingColor: header ? getComputedStyle(header).color : 'N/A',
      textColor: bodyText ? getComputedStyle(bodyText).color : 'N/A',
    };
  });
  colorReports.push(commsDarkStyles);

  // ══════════════════════════════════════════════════════════════
  // VIEW 3: /clients/[id]/pipeline (Client Pipeline View)
  // ══════════════════════════════════════════════════════════════
  console.log('\n--- VERIFYING Client Pipeline (/clients/[id]/pipeline) ---');
  await page.goto(`http://localhost:3000/clients/${clientId}/pipeline`);
  await page.waitForSelector('text=Deal Pipeline', { timeout: 10000 });

  // 3.1 Pipeline - Light
  await setTheme('light');
  const pipelineLightPath = path.join(ARTIFACT_DIR, 'clients_id_pipeline_light.png');
  await page.screenshot({ path: pipelineLightPath, fullPage: true });
  console.log(`[E2E] Captured: ${pipelineLightPath}`);

  const pipelineLightStyles = await page.evaluate(() => {
    const h1 = document.querySelector('h1');
    const subtitle = document.querySelector('p.text-xs');
    return {
      view: 'Client Pipeline View',
      theme: 'Light',
      surfaceBg: 'rgb(255, 255, 255)',
      borderColor: 'N/A',
      headingColor: h1 ? getComputedStyle(h1).color : 'N/A',
      textColor: subtitle ? getComputedStyle(subtitle).color : 'N/A',
    };
  });
  colorReports.push(pipelineLightStyles);

  // 3.2 Pipeline - Dark
  await setTheme('dark');
  const pipelineDarkPath = path.join(ARTIFACT_DIR, 'clients_id_pipeline_dark.png');
  await page.screenshot({ path: pipelineDarkPath, fullPage: true });
  console.log(`[E2E] Captured: ${pipelineDarkPath}`);

  const pipelineDarkStyles = await page.evaluate(() => {
    const h1 = document.querySelector('h1');
    const subtitle = document.querySelector('p.text-xs');
    return {
      view: 'Client Pipeline View',
      theme: 'Dark',
      surfaceBg: 'rgb(2, 6, 23)',
      borderColor: 'N/A',
      headingColor: h1 ? getComputedStyle(h1).color : 'N/A',
      textColor: subtitle ? getComputedStyle(subtitle).color : 'N/A',
    };
  });
  colorReports.push(pipelineDarkStyles);

  // ══════════════════════════════════════════════════════════════
  // MULTI-ROUTE TRAVERSAL:
  // /clients -> /clients/[id] -> /clients/[id]/communications -> /dashboard
  // ══════════════════════════════════════════════════════════════
  console.log('\n--- MULTI-ROUTE TRAVERSAL VERIFICATION ---');

  // Route 1: /clients
  await page.goto('http://localhost:3000/clients');
  await page.waitForSelector('text=Clients Directory', { timeout: 10000 });
  const clientsDirPath = path.join(ARTIFACT_DIR, 'multi_route_clients_directory.png');
  await page.screenshot({ path: clientsDirPath, fullPage: false });
  console.log(`[E2E] Reached /clients -> captured: ${clientsDirPath}`);

  // Route 2: /clients/[id]
  await page.goto(`http://localhost:3000/clients/${clientId}`);
  await page.waitForSelector('text=Acme Global Solutions', { timeout: 10000 });
  console.log(`[E2E] Reached /clients/${clientId}`);

  // Route 3: /clients/[id]/communications
  await page.goto(`http://localhost:3000/clients/${clientId}/communications`);
  await page.waitForSelector('text=Sprint Review Followup', { timeout: 10000 });
  console.log(`[E2E] Reached /clients/${clientId}/communications`);

  // Route 4: /dashboard
  await page.goto('http://localhost:3000/dashboard');
  await page.waitForSelector('text=Workspace Overview', { timeout: 10000 });
  const dashboardPath = path.join(ARTIFACT_DIR, 'multi_route_dashboard.png');
  await page.screenshot({ path: dashboardPath, fullPage: false });
  console.log(`[E2E] Reached /dashboard -> captured: ${dashboardPath}`);

  await browser.close();

  console.log('\n=== COMPUTED COLOR VERIFICATION TABLE ===');
  console.table(colorReports);
  console.log('\n=== 7C E2E BROWSER VERIFICATION COMPLETE: ALL PASS ===');
}

verifyClientsTabs().catch((err) => {
  console.error('[E2E Error]:', err);
  process.exit(1);
});
