import { UserRepository, OrganizationRepository } from '../lib/db/repositories';
import { query } from '../lib/db';
import bcrypt from 'bcryptjs';
import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = '/home/maazzalii/.gemini/antigravity-ide/brain/64a686d0-9c20-493a-89c3-4d69e7d25c22';

interface ComputedStylesReport {
  view: string;
  theme: string;
  h1Color: string;
  h1Weight: string;
  tableOrCardTextColor: string;
  tableHeaderColor: string;
  formLabelColor: string;
  inputBg: string;
  inputBorder: string;
  primaryBtnBg: string;
  primaryBtnColor: string;
  badgeBg: string;
  badgeColor: string;
}

async function verifyClientsList() {
  console.log('=== STARTING CLIENTS LIST & DIRECTORY (7A) BROWSER VERIFICATION ===');

  const ts = Date.now();
  const email = `clients_lead_${ts}@example.com`;
  const rawPassword = 'PlaywrightPass123!';
  const passwordHash = await bcrypt.hash(rawPassword, 10);

  const userRepo = new UserRepository();
  const orgRepo = new OrganizationRepository();

  const user = await userRepo.create({
    email,
    passwordHash,
    fullName: 'Chief Client Experience Officer',
    role: 'org_admin',
    requirePasswordChange: false,
  });

  const org = await orgRepo.create({
    name: 'Apex Global CRM Workspace ' + ts,
    slug: 'apex-ws-' + ts,
    ownerUserId: user.id,
  });

  console.log(`[E2E] Provisioned user ${user.email} with workspace ${org.slug}`);

  // Seed sample clients
  const client1Res = await query<{ id: string }>(
    `INSERT INTO clients (
       organization_id, name, company, email, phone, platform, country, currency,
       payment_schedule, status, communication_mode, notes
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'USD', 'monthly', 'active', 'connected', 'Enterprise account with dedicated Slack.')
     RETURNING id`,
    [
      org.id,
      'Apex Venture Capital',
      'Apex Financial Partners',
      `contact_${ts}@apexvc.com`,
      '+1 (555) 234-5678',
      'WhatsApp',
      'United States',
    ]
  );
  const client1Id = client1Res.rows[0].id;

  const client2Res = await query<{ id: string }>(
    `INSERT INTO clients (
       organization_id, name, company, email, phone, platform, country, currency,
       payment_schedule, status, communication_mode, notes
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'GBP', 'per_project', 'paused', 'manual', 'Bi-weekly check-ins.')
     RETURNING id`,
    [
      org.id,
      'Quantum Dynamics Labs',
      'Quantum Tech UK',
      `support_${ts}@quantum.co.uk`,
      '+44 20 7946 0912',
      'Slack',
      'United Kingdom',
    ]
  );
  const client2Id = client2Res.rows[0].id;

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
  const page = await context.newPage();

  const styleReports: ComputedStylesReport[] = [];

  // Helper to toggle theme
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
  // VIEW 1: /clients (Directory & List View)
  // ══════════════════════════════════════════════════════════════
  console.log('\n--- VERIFYING Clients Directory List View ---');
  await page.goto('http://localhost:3000/clients');
  await page.waitForSelector('text=Clients Directory', { timeout: 10000 });

  // Light Theme
  await setTheme('light');
  const clientsListLightPath = path.join(ARTIFACT_DIR, 'clients_list_light.png');
  await page.screenshot({ path: clientsListLightPath, fullPage: true });
  console.log(`[E2E] Captured: ${clientsListLightPath}`);

  const lightStyles = await page.evaluate(() => {
    const h1 = document.querySelector('h1');
    const tableHeader = document.querySelector('thead th');
    const clientLink = document.querySelector('tbody tr a');
    const formLabel = document.querySelector('label');
    const searchInput = document.querySelector('input[type="text"]');
    const newClientBtn = Array.from(document.querySelectorAll('a')).find(a => a.textContent?.includes('New Client'));
    const commBadge = document.querySelector('span[title*="Connected Hub"]');

    return {
      view: 'Clients Directory (Table)',
      theme: 'Light',
      h1Color: h1 ? getComputedStyle(h1).color : 'N/A',
      h1Weight: h1 ? getComputedStyle(h1).fontWeight : 'N/A',
      tableOrCardTextColor: clientLink ? getComputedStyle(clientLink).color : 'N/A',
      tableHeaderColor: tableHeader ? getComputedStyle(tableHeader).color : 'N/A',
      formLabelColor: formLabel ? getComputedStyle(formLabel).color : 'N/A',
      inputBg: searchInput ? getComputedStyle(searchInput).backgroundColor : 'N/A',
      inputBorder: searchInput ? getComputedStyle(searchInput).borderColor : 'N/A',
      primaryBtnBg: newClientBtn ? getComputedStyle(newClientBtn).backgroundColor : 'N/A',
      primaryBtnColor: newClientBtn ? getComputedStyle(newClientBtn).color : 'N/A',
      badgeBg: commBadge ? getComputedStyle(commBadge).backgroundColor : 'N/A',
      badgeColor: commBadge ? getComputedStyle(commBadge).color : 'N/A',
    };
  });
  styleReports.push(lightStyles);

  // Dark Theme
  await setTheme('dark');
  const clientsListDarkPath = path.join(ARTIFACT_DIR, 'clients_list_dark.png');
  await page.screenshot({ path: clientsListDarkPath, fullPage: true });
  console.log(`[E2E] Captured: ${clientsListDarkPath}`);

  const darkStyles = await page.evaluate(() => {
    const h1 = document.querySelector('h1');
    const tableHeader = document.querySelector('thead th');
    const clientLink = document.querySelector('tbody tr a');
    const formLabel = document.querySelector('label');
    const searchInput = document.querySelector('input[type="text"]');
    const newClientBtn = Array.from(document.querySelectorAll('a')).find(a => a.textContent?.includes('New Client'));
    const commBadge = document.querySelector('span[title*="Connected Hub"]');

    return {
      view: 'Clients Directory (Table)',
      theme: 'Dark',
      h1Color: h1 ? getComputedStyle(h1).color : 'N/A',
      h1Weight: h1 ? getComputedStyle(h1).fontWeight : 'N/A',
      tableOrCardTextColor: clientLink ? getComputedStyle(clientLink).color : 'N/A',
      tableHeaderColor: tableHeader ? getComputedStyle(tableHeader).color : 'N/A',
      formLabelColor: formLabel ? getComputedStyle(formLabel).color : 'N/A',
      inputBg: searchInput ? getComputedStyle(searchInput).backgroundColor : 'N/A',
      inputBorder: searchInput ? getComputedStyle(searchInput).borderColor : 'N/A',
      primaryBtnBg: newClientBtn ? getComputedStyle(newClientBtn).backgroundColor : 'N/A',
      primaryBtnColor: newClientBtn ? getComputedStyle(newClientBtn).color : 'N/A',
      badgeBg: commBadge ? getComputedStyle(commBadge).backgroundColor : 'N/A',
      badgeColor: commBadge ? getComputedStyle(commBadge).color : 'N/A',
    };
  });
  styleReports.push(darkStyles);

  // ══════════════════════════════════════════════════════════════
  // VIEW 2: /clients/[id] (Client Detail View)
  // ══════════════════════════════════════════════════════════════
  console.log('\n--- VERIFYING Client Detail Page ---');
  await page.goto(`http://localhost:3000/clients/${client1Id}`);
  await page.waitForSelector('text=Apex Venture Capital', { timeout: 10000 });

  // Light Theme
  await setTheme('light');
  const clientsDetailLightPath = path.join(ARTIFACT_DIR, 'clients_detail_light.png');
  await page.screenshot({ path: clientsDetailLightPath, fullPage: true });
  console.log(`[E2E] Captured: ${clientsDetailLightPath}`);

  // Dark Theme
  await setTheme('dark');
  const clientsDetailDarkPath = path.join(ARTIFACT_DIR, 'clients_detail_dark.png');
  await page.screenshot({ path: clientsDetailDarkPath, fullPage: true });
  console.log(`[E2E] Captured: ${clientsDetailDarkPath}`);

  // ══════════════════════════════════════════════════════════════
  // MULTI-ROUTE THEME PERSISTENCE
  // /clients → /clients/[id] → /settings → /settings/profile → /dashboard
  // ══════════════════════════════════════════════════════════════
  console.log('\n--- VERIFYING MULTI-ROUTE THEME PERSISTENCE ---');

  // Step 1: Set Dark on /clients
  await page.goto('http://localhost:3000/clients');
  await setTheme('dark');
  let isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
  if (!isDark) throw new Error('Theme did not set to dark on /clients');
  console.log('[E2E] Multi-route step 1 PASS (/clients in Dark mode)');

  // Step 2: Navigate to /clients/[id] -> confirm dark persists
  await page.goto(`http://localhost:3000/clients/${client1Id}`);
  await page.waitForSelector('text=Apex Venture Capital', { timeout: 10000 });
  isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
  if (!isDark) throw new Error('Theme lost dark mode on /clients/[id]');
  console.log('[E2E] Multi-route step 2 PASS (/clients/[id] retains Dark mode)');

  // Step 3: Navigate to /settings -> switch to light
  await page.goto('http://localhost:3000/settings');
  await page.waitForURL('**/settings/**', { timeout: 10000 });
  await setTheme('light');
  let isLight = await page.evaluate(() => !document.documentElement.classList.contains('dark'));
  if (!isLight) throw new Error('Theme did not switch to light on /settings');
  console.log('[E2E] Multi-route step 3 PASS (/settings in Light mode)');

  // Step 4: Navigate to /settings/profile -> confirm light persists
  await page.goto('http://localhost:3000/settings/profile');
  await page.waitForURL('**/settings/**', { timeout: 10000 });
  isLight = await page.evaluate(() => !document.documentElement.classList.contains('dark'));
  if (!isLight) throw new Error('Theme lost light mode on /settings/profile');
  console.log('[E2E] Multi-route step 4 PASS (/settings/profile retains Light mode)');

  // Step 5: Navigate to /dashboard -> confirm light persists
  await page.goto('http://localhost:3000/dashboard');
  await page.waitForSelector('text=Workspace Overview', { timeout: 10000 });
  isLight = await page.evaluate(() => !document.documentElement.classList.contains('dark'));
  if (!isLight) throw new Error('Theme lost light mode on /dashboard');
  console.log('[E2E] Multi-route step 5 PASS (/dashboard retains Light mode)');

  console.log('\n=== COMPUTED COLOR MEASUREMENTS ===');
  console.log(JSON.stringify(styleReports, null, 2));

  await browser.close();
  console.log('\n=== E2E BROWSER VERIFICATION COMPLETE: ALL PASS ===\n');
}

verifyClientsList().catch((err) => {
  console.error('[E2E ERROR]', err);
  process.exit(1);
});
