import { UserRepository, OrganizationRepository } from '../lib/db/repositories';
import { query } from '../lib/db';
import bcrypt from 'bcryptjs';
import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = '/home/maazzalii/.gemini/antigravity-ide/brain/9eb8ad3f-7a90-4e9e-b71a-434921a8930c';

interface ComputedColorEntry {
  view: string;
  theme: string;
  element: string;
  backgroundColor: string;
  textColor: string;
  borderColor?: string;
}

async function verifySettingsBillingAiAudit() {
  console.log('=== STARTING SUB-BATCH 8B SETTINGS BILLING, AI & AUDIT LOG E2E VERIFICATION ===');

  const ts = Date.now();
  const ownerEmail = `billing_owner_${ts}@example.com`;
  const rawPassword = 'PlaywrightPass123!';
  const passwordHash = await bcrypt.hash(rawPassword, 10);

  const userRepo = new UserRepository();
  const orgRepo = new OrganizationRepository();

  // 1. Provision owner & workspace
  const owner = await userRepo.create({
    email: ownerEmail,
    passwordHash,
    fullName: 'Enterprise Administrator ' + ts,
    role: 'org_admin',
    requirePasswordChange: false,
  });

  const org = await orgRepo.create({
    name: 'Innoventix Global Cloud ' + ts,
    slug: 'innoventix-cloud-' + ts,
    ownerUserId: owner.id,
  });

  // Update org to Pro plan with active billing
  await query(
    `UPDATE organizations
     SET plan_tier = 'pro',
         billing_status = 'active',
         stripe_customer_id = 'cus_mock_${ts}',
         ai_feature_settings = '{"reply_suggestions": true, "lead_scoring": true, "task_extraction": true, "weekly_narrative": true}'::jsonb
     WHERE id = $1`,
    [org.id]
  );

  // Seed sample audit logs
  await query(
    `INSERT INTO audit_logs (organization_id, actor_user_id, actor_email, actor_name, action, entity_type, entity_id, metadata, ip_address)
     VALUES
     ($1, $2, $3, $4, 'STRIPE_SUBSCRIPTION_UPDATED', 'subscription', 'sub_${ts}', '{"tier": "pro", "seats": 15, "billingCycle": "monthly"}'::jsonb, '127.0.0.1'),
     ($1, $2, $3, $4, 'AI_FEATURE_TOGGLE_UPDATED', 'ai_settings', 'ai_${ts}', '{"feature": "lead_scoring", "enabled": true}'::jsonb, '127.0.0.1'),
     ($1, $2, $3, $4, 'TEAM_MEMBER_INVITED', 'invitation', 'inv_${ts}', '{"role": "admin", "target": "ops@innoventix.io"}'::jsonb, '127.0.0.1')`,
    [org.id, owner.id, owner.email, owner.full_name]
  );

  console.log(`[E2E] Provisioned owner ${owner.email} with Pro workspace ${org.slug} and sample audit records`);

  // Launch browser
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  const colorEntries: ComputedColorEntry[] = [];

  // Helper to switch theme
  async function setTheme(theme: 'light' | 'dark') {
    await page.evaluate((targetTheme) => {
      const html = document.documentElement;
      if (targetTheme === 'dark') {
        html.classList.add('dark');
        html.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
      } else {
        html.classList.remove('dark');
        html.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light');
      }
    }, theme);
    await page.waitForTimeout(300);
  }

  // Helper to read theme
  async function getTheme(): Promise<string> {
    return page.evaluate(() => {
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    });
  }

  // 1. Authenticate
  console.log('[E2E] Logging in...');
  await page.goto('http://localhost:3000/login');
  await page.fill('input[type="email"]', ownerEmail);
  await page.fill('input[type="password"]', rawPassword);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard**', { timeout: 15000 });
  console.log('[E2E] Successfully authenticated.');

  // ══════════════════════════════════════════════════════════════
  // VIEW 1: /settings/billing
  // ══════════════════════════════════════════════════════════════
  console.log('\n--- VERIFYING /settings/billing ---');
  await page.goto('http://localhost:3000/settings/billing');
  await page.waitForSelector('[data-testid="billing-settings-client"]', { timeout: 10000 });

  // 1.1 Billing - Light
  await setTheme('light');
  const billingLightPath = path.join(ARTIFACT_DIR, 'settings_billing_light.png');
  await page.screenshot({ path: billingLightPath, fullPage: true });
  console.log(`[E2E] Captured: ${billingLightPath}`);

  const billingLightMetrics = await page.evaluate(() => {
    const cardTitle = document.querySelector('[data-testid="billing-settings-client"] h3');
    const manageBtn = document.querySelector('[data-testid="manage-subscription-button"]') || document.querySelector('[data-testid="upgrade-pro-button"]');
    const invoiceSection = document.querySelector('[data-testid="empty-invoices-state"]') || document.querySelector('[data-testid="invoices-table"]');

    return {
      cardTitleColor: cardTitle ? getComputedStyle(cardTitle).color : 'N/A',
      manageBtnBg: manageBtn ? getComputedStyle(manageBtn).backgroundColor : 'N/A',
      manageBtnText: manageBtn ? getComputedStyle(manageBtn).color : 'N/A',
      manageBtnBorder: manageBtn ? getComputedStyle(manageBtn).borderColor : 'N/A',
      invoiceText: invoiceSection ? getComputedStyle(invoiceSection).color : 'N/A',
    };
  });

  colorEntries.push({
    view: '/settings/billing',
    theme: 'Light',
    element: 'Billing Plan Card Title',
    backgroundColor: 'transparent',
    textColor: billingLightMetrics.cardTitleColor,
  });
  colorEntries.push({
    view: '/settings/billing',
    theme: 'Light',
    element: 'Billing Action Button (Manage/Upgrade)',
    backgroundColor: billingLightMetrics.manageBtnBg,
    textColor: billingLightMetrics.manageBtnText,
    borderColor: billingLightMetrics.manageBtnBorder,
  });

  // 1.2 Billing - Dark
  await setTheme('dark');
  const billingDarkPath = path.join(ARTIFACT_DIR, 'settings_billing_dark.png');
  await page.screenshot({ path: billingDarkPath, fullPage: true });
  console.log(`[E2E] Captured: ${billingDarkPath}`);

  const billingDarkMetrics = await page.evaluate(() => {
    const cardTitle = document.querySelector('[data-testid="billing-settings-client"] h3');
    const manageBtn = document.querySelector('[data-testid="manage-subscription-button"]') || document.querySelector('[data-testid="upgrade-pro-button"]');

    return {
      cardTitleColor: cardTitle ? getComputedStyle(cardTitle).color : 'N/A',
      manageBtnBg: manageBtn ? getComputedStyle(manageBtn).backgroundColor : 'N/A',
      manageBtnText: manageBtn ? getComputedStyle(manageBtn).color : 'N/A',
      manageBtnBorder: manageBtn ? getComputedStyle(manageBtn).borderColor : 'N/A',
    };
  });

  colorEntries.push({
    view: '/settings/billing',
    theme: 'Dark',
    element: 'Billing Plan Card Title',
    backgroundColor: 'transparent',
    textColor: billingDarkMetrics.cardTitleColor,
  });
  colorEntries.push({
    view: '/settings/billing',
    theme: 'Dark',
    element: 'Billing Action Button (Manage/Upgrade)',
    backgroundColor: billingDarkMetrics.manageBtnBg,
    textColor: billingDarkMetrics.manageBtnText,
    borderColor: billingDarkMetrics.manageBtnBorder,
  });

  // ══════════════════════════════════════════════════════════════
  // VIEW 2: /settings/ai
  // ══════════════════════════════════════════════════════════════
  console.log('\n--- VERIFYING /settings/ai ---');
  await page.goto('http://localhost:3000/settings/ai');
  await page.waitForSelector('text=AI Capability Management', { timeout: 10000 });

  // 2.1 AI - Light
  await setTheme('light');
  const aiLightPath = path.join(ARTIFACT_DIR, 'settings_ai_light.png');
  await page.screenshot({ path: aiLightPath, fullPage: true });
  console.log(`[E2E] Captured: ${aiLightPath}`);

  const aiLightMetrics = await page.evaluate(() => {
    const featureLabel = document.querySelector('span.text-sm.font-semibold');
    const switchBtn = document.querySelector('button[role="switch"]');
    const statNumber = document.querySelector('span.text-2xl.font-extrabold');

    return {
      featureLabelColor: featureLabel ? getComputedStyle(featureLabel).color : 'N/A',
      switchBg: switchBtn ? getComputedStyle(switchBtn).backgroundColor : 'N/A',
      statNumberColor: statNumber ? getComputedStyle(statNumber).color : 'N/A',
    };
  });

  colorEntries.push({
    view: '/settings/ai',
    theme: 'Light',
    element: 'AI Feature Toggle Label',
    backgroundColor: 'transparent',
    textColor: aiLightMetrics.featureLabelColor,
  });
  colorEntries.push({
    view: '/settings/ai',
    theme: 'Light',
    element: 'AI Switch Toggle Track',
    backgroundColor: aiLightMetrics.switchBg,
    textColor: 'N/A',
  });
  colorEntries.push({
    view: '/settings/ai',
    theme: 'Light',
    element: 'Monthly Usage Stat Number',
    backgroundColor: 'transparent',
    textColor: aiLightMetrics.statNumberColor,
  });

  // 2.2 AI - Dark
  await setTheme('dark');
  const aiDarkPath = path.join(ARTIFACT_DIR, 'settings_ai_dark.png');
  await page.screenshot({ path: aiDarkPath, fullPage: true });
  console.log(`[E2E] Captured: ${aiDarkPath}`);

  const aiDarkMetrics = await page.evaluate(() => {
    const featureLabel = document.querySelector('span.text-sm.font-semibold');
    const switchBtn = document.querySelector('button[role="switch"]');
    const statNumber = document.querySelector('span.text-2xl.font-extrabold');

    return {
      featureLabelColor: featureLabel ? getComputedStyle(featureLabel).color : 'N/A',
      switchBg: switchBtn ? getComputedStyle(switchBtn).backgroundColor : 'N/A',
      statNumberColor: statNumber ? getComputedStyle(statNumber).color : 'N/A',
    };
  });

  colorEntries.push({
    view: '/settings/ai',
    theme: 'Dark',
    element: 'AI Feature Toggle Label',
    backgroundColor: 'transparent',
    textColor: aiDarkMetrics.featureLabelColor,
  });
  colorEntries.push({
    view: '/settings/ai',
    theme: 'Dark',
    element: 'AI Switch Toggle Track',
    backgroundColor: aiDarkMetrics.switchBg,
    textColor: 'N/A',
  });
  colorEntries.push({
    view: '/settings/ai',
    theme: 'Dark',
    element: 'Monthly Usage Stat Number',
    backgroundColor: 'transparent',
    textColor: aiDarkMetrics.statNumberColor,
  });

  // ══════════════════════════════════════════════════════════════
  // VIEW 3: /settings/audit-log
  // ══════════════════════════════════════════════════════════════
  console.log('\n--- VERIFYING /settings/audit-log ---');
  await page.goto('http://localhost:3000/settings/audit-log');
  await page.waitForSelector('text=Total Audit Events', { timeout: 10000 });

  // 3.1 Audit Log - Light
  await setTheme('light');
  const auditLightPath = path.join(ARTIFACT_DIR, 'settings_audit_log_light.png');
  await page.screenshot({ path: auditLightPath, fullPage: true });
  console.log(`[E2E] Captured: ${auditLightPath}`);

  const auditLightMetrics = await page.evaluate(() => {
    const searchInput = document.querySelector('input[placeholder*="Search actions"]');
    const tableHeader = document.querySelector('table thead th');
    const tableRow = document.querySelector('table tbody tr');
    const rowEl = tableRow ? tableRow.querySelector('td div.font-semibold') : null;
    const timestampEl = tableRow ? tableRow.querySelector('td.font-mono') : null;

    return {
      searchInputBg: searchInput ? getComputedStyle(searchInput).backgroundColor : 'N/A',
      searchInputText: searchInput ? getComputedStyle(searchInput).color : 'N/A',
      tableHeaderColor: tableHeader ? getComputedStyle(tableHeader).color : 'N/A',
      rowTextColor: rowEl ? getComputedStyle(rowEl).color : 'N/A',
      timestampColor: timestampEl ? getComputedStyle(timestampEl).color : 'N/A',
    };
  });

  colorEntries.push({
    view: '/settings/audit-log',
    theme: 'Light',
    element: 'Search Input (Audit Filter)',
    backgroundColor: auditLightMetrics.searchInputBg,
    textColor: auditLightMetrics.searchInputText,
  });
  colorEntries.push({
    view: '/settings/audit-log',
    theme: 'Light',
    element: 'Table Header Text',
    backgroundColor: 'transparent',
    textColor: auditLightMetrics.tableHeaderColor,
  });
  colorEntries.push({
    view: '/settings/audit-log',
    theme: 'Light',
    element: 'Table Row Actor Text',
    backgroundColor: 'transparent',
    textColor: auditLightMetrics.rowTextColor,
  });
  colorEntries.push({
    view: '/settings/audit-log',
    theme: 'Light',
    element: 'Timestamp Meta Text',
    backgroundColor: 'transparent',
    textColor: auditLightMetrics.timestampColor,
  });

  // 3.2 Audit Log - Dark
  await setTheme('dark');
  const auditDarkPath = path.join(ARTIFACT_DIR, 'settings_audit_log_dark.png');
  await page.screenshot({ path: auditDarkPath, fullPage: true });
  console.log(`[E2E] Captured: ${auditDarkPath}`);

  const auditDarkMetrics = await page.evaluate(() => {
    const searchInput = document.querySelector('input[placeholder*="Search actions"]');
    const tableHeader = document.querySelector('table thead th');
    const tableRow = document.querySelector('table tbody tr');
    const rowEl = tableRow ? tableRow.querySelector('td div.font-semibold') : null;
    const timestampEl = tableRow ? tableRow.querySelector('td.font-mono') : null;

    return {
      searchInputBg: searchInput ? getComputedStyle(searchInput).backgroundColor : 'N/A',
      searchInputText: searchInput ? getComputedStyle(searchInput).color : 'N/A',
      tableHeaderColor: tableHeader ? getComputedStyle(tableHeader).color : 'N/A',
      rowTextColor: rowEl ? getComputedStyle(rowEl).color : 'N/A',
      timestampColor: timestampEl ? getComputedStyle(timestampEl).color : 'N/A',
    };
  });

  colorEntries.push({
    view: '/settings/audit-log',
    theme: 'Dark',
    element: 'Search Input (Audit Filter)',
    backgroundColor: auditDarkMetrics.searchInputBg,
    textColor: auditDarkMetrics.searchInputText,
  });
  colorEntries.push({
    view: '/settings/audit-log',
    theme: 'Dark',
    element: 'Table Header Text',
    backgroundColor: 'transparent',
    textColor: auditDarkMetrics.tableHeaderColor,
  });
  colorEntries.push({
    view: '/settings/audit-log',
    theme: 'Dark',
    element: 'Table Row Actor Text',
    backgroundColor: 'transparent',
    textColor: auditDarkMetrics.rowTextColor,
  });
  colorEntries.push({
    view: '/settings/audit-log',
    theme: 'Dark',
    element: 'Timestamp Meta Text',
    backgroundColor: 'transparent',
    textColor: auditDarkMetrics.timestampColor,
  });

  console.log(`[E2E] Direct Query - Audit Log Dark Mode Input Background: ${auditDarkMetrics.searchInputBg}`);
  if (auditDarkMetrics.searchInputBg === 'rgb(255, 255, 255)') {
    throw new Error('CRITICAL FAILURE: Audit log search input background is white in dark mode!');
  }

  // ══════════════════════════════════════════════════════════════
  // VIEW 4: Multi-Route Navigation & Theme Persistence
  // /settings/billing → /settings/ai → /settings/audit-log → /dashboard
  // ══════════════════════════════════════════════════════════════
  console.log('\n--- VERIFYING Multi-Route Theme Persistence ---');

  // Test Dark Route Chain
  await setTheme('dark');
  console.log('[E2E] Starting multi-route hop in DARK mode...');
  await page.goto('http://localhost:3000/settings/billing');
  const billingThemeDark = await getTheme();
  console.log(`[E2E] /settings/billing theme: ${billingThemeDark}`);
  if (billingThemeDark !== 'dark') throw new Error('Theme did not persist at /settings/billing');

  await page.goto('http://localhost:3000/settings/ai');
  const aiThemeDark = await getTheme();
  console.log(`[E2E] /settings/ai theme: ${aiThemeDark}`);
  if (aiThemeDark !== 'dark') throw new Error('Theme did not persist at /settings/ai');

  await page.goto('http://localhost:3000/settings/audit-log');
  const auditThemeDark = await getTheme();
  console.log(`[E2E] /settings/audit-log theme: ${auditThemeDark}`);
  if (auditThemeDark !== 'dark') throw new Error('Theme did not persist at /settings/audit-log');

  await page.goto('http://localhost:3000/dashboard');
  const dashThemeDark = await getTheme();
  console.log(`[E2E] /dashboard theme: ${dashThemeDark}`);
  if (dashThemeDark !== 'dark') throw new Error('Theme did not persist at /dashboard');

  const dashMultiRoutePath = path.join(ARTIFACT_DIR, 'multi_route_settings_8b_dark.png');
  await page.screenshot({ path: dashMultiRoutePath });
  console.log(`[E2E] Captured: ${dashMultiRoutePath}`);

  // Test Light Route Chain
  await setTheme('light');
  console.log('[E2E] Starting multi-route hop in LIGHT mode...');
  await page.goto('http://localhost:3000/settings/billing');
  const billingThemeLight = await getTheme();
  if (billingThemeLight !== 'light') throw new Error('Theme did not persist at /settings/billing');

  await page.goto('http://localhost:3000/settings/ai');
  const aiThemeLight = await getTheme();
  if (aiThemeLight !== 'light') throw new Error('Theme did not persist at /settings/ai');

  await page.goto('http://localhost:3000/settings/audit-log');
  const auditThemeLight = await getTheme();
  if (auditThemeLight !== 'light') throw new Error('Theme did not persist at /settings/audit-log');

  await page.goto('http://localhost:3000/dashboard');
  const dashThemeLight = await getTheme();
  if (dashThemeLight !== 'light') throw new Error('Theme did not persist at /dashboard');

  console.log('[E2E] Multi-route theme persistence verified across all hops in both themes.');

  // Print results table
  console.log('\n=== COMPUTED COLOR METRICS TABLE ===');
  console.log('| View | Theme | Element | Background Color | Text Color | Border Color |');
  console.log('|---|---|---|---|---|---|');
  for (const c of colorEntries) {
    console.log(
      `| ${c.view} | ${c.theme} | ${c.element} | \`${c.backgroundColor}\` | \`${c.textColor}\` | \`${c.borderColor || 'N/A'}\` |`
    );
  }

  await browser.close();
  console.log('\n=== SUB-BATCH 8B BROWSER VERIFICATION COMPLETE: ALL CHECKS PASSED ===');
}

verifySettingsBillingAiAudit().catch((err) => {
  console.error('E2E Verification Failed:', err);
  process.exit(1);
});
