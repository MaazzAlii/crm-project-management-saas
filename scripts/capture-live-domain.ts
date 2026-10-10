import { chromium, BrowserContext, Page } from 'playwright';
import path from 'path';
import fs from 'fs';

const BASE_URL = process.env.LIVE_DOMAIN_URL || 'https://www.project-manager.calara.agency';
const SCREENSHOT_DIR = path.resolve(process.cwd(), 'assets/screenshots_live_domain');

const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'maazalisshahid@gmail.com';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'pas#123#';

let screenshotCount = 0;

async function snap(page: Page, filename: string, options: { fullPage?: boolean; delayMs?: number } = {}) {
  screenshotCount++;
  const numPrefix = String(screenshotCount).padStart(2, '0');
  const fullFilename = `${numPrefix}-${filename}`;
  const filePath = path.join(SCREENSHOT_DIR, fullFilename);
  
  if (options.delayMs) {
    await page.waitForTimeout(options.delayMs);
  } else {
    await page.waitForTimeout(1000);
  }

  await page.screenshot({ path: filePath, fullPage: options.fullPage ?? false });
  console.log(`📸 [${numPrefix}] Captured: ${fullFilename}`);
  return filePath;
}

async function runLiveCapture() {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  console.log(`🚀 Starting Comprehensive Live Production Screenshot Capture on ${BASE_URL}...`);
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const context: BrowserContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });

  const page = await context.newPage();

  // ==========================================
  // SECTION 1: LANDING & AUTHENTICATION
  // ==========================================
  console.log('\n--- Section 1: Landing & Auth ---');
  await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
  await snap(page, '01-landing-page.png', { fullPage: true, delayMs: 2000 });

  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await snap(page, '02-login-page.png', { delayMs: 1500 });

  await page.goto(`${BASE_URL}/signup`, { waitUntil: 'domcontentloaded' });
  await snap(page, '03-signup-page.png', { delayMs: 1500 });

  // Perform Live Authentication
  console.log(`Logging into live application as ${TEST_EMAIL}...`);
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.fill('input[type="email"]', TEST_EMAIL);
  await page.fill('input[type="password"]', TEST_PASSWORD);
  await snap(page, '04-login-form-filled.png', { delayMs: 500 });

  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {}),
    page.click('button[type="submit"]'),
  ]);
  await page.waitForTimeout(3000);
  await snap(page, '05-login-success-dashboard.png', { delayMs: 2000 });

  // ==========================================
  // SECTION 2: EXECUTIVE DASHBOARD & ANALYTICS
  // ==========================================
  console.log('\n--- Section 2: Dashboard & Analytics ---');
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded' });
  await snap(page, '06-main-dashboard.png', { delayMs: 2500 });

  // Trigger Weekly Report Narrative Modal
  try {
    const reportBtn = await page.locator('button:has-text("Generate Weekly Report"), button:has-text("Weekly Report")').first();
    if (await reportBtn.isVisible()) {
      await reportBtn.click();
      await page.waitForTimeout(1500);
      await snap(page, '07-ai-weekly-report-modal.png', { delayMs: 1500 });
      // Close modal
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }
  } catch (e) {
    console.log('Weekly report modal button note:', e);
  }

  // Analytics Overview
  await page.goto(`${BASE_URL}/analytics`, { waitUntil: 'domcontentloaded' });
  await snap(page, '08-analytics-overview.png', { delayMs: 2500 });

  // Analytics Revenue Ledger
  await page.goto(`${BASE_URL}/analytics/revenue`, { waitUntil: 'domcontentloaded' });
  await snap(page, '09-analytics-revenue-ledger.png', { delayMs: 2500 });

  // Analytics Resource & Quota Plan Usage
  await page.goto(`${BASE_URL}/analytics/plan-usage`, { waitUntil: 'domcontentloaded' });
  await snap(page, '10-analytics-plan-usage.png', { delayMs: 2500 });

  // ==========================================
  // SECTION 3: CRM & CLIENTS LIFECYCLE
  // ==========================================
  console.log('\n--- Section 3: CRM & Clients ---');
  await page.goto(`${BASE_URL}/clients`, { waitUntil: 'domcontentloaded' });
  await snap(page, '11-crm-clients-directory.png', { delayMs: 2500 });

  // Open Add Client Modal
  try {
    const addClientBtn = await page.locator('button:has-text("Add Client"), button:has-text("New Client")').first();
    if (await addClientBtn.isVisible()) {
      await addClientBtn.click();
      await page.waitForTimeout(1000);
      await snap(page, '12-crm-add-client-modal.png', { delayMs: 1000 });
      await page.keyboard.press('Escape');
    }
  } catch (e) {}

  // View Client Details
  const clientLink = await page.locator('a[href^="/clients/"]').first();
  if (await clientLink.isVisible()) {
    const clientUrl = await clientLink.getAttribute('href');
    if (clientUrl && !clientUrl.endsWith('/new')) {
      await page.goto(`${BASE_URL}${clientUrl}`, { waitUntil: 'domcontentloaded' });
      await snap(page, '13-crm-client-profile-overview.png', { delayMs: 2000 });

      // Check Communications tab
      await page.goto(`${BASE_URL}${clientUrl}/communications`, { waitUntil: 'domcontentloaded' });
      await snap(page, '14-crm-client-communications-tab.png', { delayMs: 2000 });

      // Check Pipeline tab
      await page.goto(`${BASE_URL}${clientUrl}/pipeline`, { waitUntil: 'domcontentloaded' });
      await snap(page, '15-crm-client-pipeline-tab.png', { delayMs: 2000 });
    }
  }

  // Leads Kanban Pipeline
  await page.goto(`${BASE_URL}/leads`, { waitUntil: 'domcontentloaded' });
  await snap(page, '16-crm-leads-kanban-pipeline.png', { delayMs: 2500 });

  // Lead Score Breakdown modal
  try {
    const scoreBadge = await page.locator('span[class*="cursor-pointer"]:has-text("/100"), button:has-text("/100")').first();
    if (await scoreBadge.isVisible()) {
      await scoreBadge.click();
      await page.waitForTimeout(1200);
      await snap(page, '17-crm-lead-score-breakdown-modal.png', { delayMs: 1000 });
      await page.keyboard.press('Escape');
    }
  } catch (e) {}

  // ==========================================
  // SECTION 4: PROJECT MANAGEMENT & TASKS
  // ==========================================
  console.log('\n--- Section 4: Projects & Tasks ---');
  await page.goto(`${BASE_URL}/projects`, { waitUntil: 'domcontentloaded' });
  await snap(page, '18-projects-directory-list.png', { delayMs: 2500 });

  // Projects Kanban
  await page.goto(`${BASE_URL}/projects/kanban`, { waitUntil: 'domcontentloaded' });
  await snap(page, '19-projects-kanban-board.png', { delayMs: 2500 });

  // Deliver Project Modal
  try {
    const deliverBtn = await page.locator('button:has-text("Deliver"), button:has-text("Deliver Project")').first();
    if (await deliverBtn.isVisible()) {
      await deliverBtn.click();
      await page.waitForTimeout(1000);
      await snap(page, '20-project-deliver-confirm-modal.png', { delayMs: 1000 });
      await page.keyboard.press('Escape');
    }
  } catch (e) {}

  // Project Detail & Deliverables
  const projectLink = await page.locator('a[href^="/projects/"]:not([href$="/kanban"])').first();
  if (await projectLink.isVisible()) {
    const projectUrl = await projectLink.getAttribute('href');
    if (projectUrl) {
      await page.goto(`${BASE_URL}${projectUrl}`, { waitUntil: 'domcontentloaded' });
      await snap(page, '21-project-details-deliverables.png', { delayMs: 2000 });
    }
  }

  // Tasks Workload Board
  await page.goto(`${BASE_URL}/tasks`, { waitUntil: 'domcontentloaded' });
  await snap(page, '22-tasks-workload-board.png', { delayMs: 2500 });

  // ==========================================
  // SECTION 5: UNIFIED INBOX & AI TOOLS
  // ==========================================
  console.log('\n--- Section 5: Inbox & AI Hub ---');
  await page.goto(`${BASE_URL}/inbox`, { waitUntil: 'domcontentloaded' });
  await snap(page, '23-unified-inbox-channels.png', { delayMs: 2500 });

  // AI Smart Reply suggestions
  try {
    const smartReplyBtn = await page.locator('button:has-text("AI Suggestions"), button:has-text("Smart Reply")').first();
    if (await smartReplyBtn.isVisible()) {
      await smartReplyBtn.click();
      await page.waitForTimeout(1500);
      await snap(page, '24-ai-reply-suggestions-tray.png', { delayMs: 1500 });
    }
  } catch (e) {}

  // AI Task Extraction
  try {
    const taskExtractBtn = await page.locator('button:has-text("Extract Tasks"), button:has-text("Auto-Task")').first();
    if (await taskExtractBtn.isVisible()) {
      await taskExtractBtn.click();
      await page.waitForTimeout(1500);
      await snap(page, '25-ai-task-extraction-modal.png', { delayMs: 1500 });
      await page.keyboard.press('Escape');
    }
  } catch (e) {}

  // Integrations settings
  await page.goto(`${BASE_URL}/settings/integrations`, { waitUntil: 'domcontentloaded' });
  await snap(page, '26-integrations-hub.png', { delayMs: 2000 });

  await page.goto(`${BASE_URL}/settings/integrations/slack`, { waitUntil: 'domcontentloaded' });
  await snap(page, '27-slack-channel-integration.png', { delayMs: 1500 });

  await page.goto(`${BASE_URL}/settings/integrations/whatsapp`, { waitUntil: 'domcontentloaded' });
  await snap(page, '28-whatsapp-channel-integration.png', { delayMs: 1500 });

  await page.goto(`${BASE_URL}/settings/integrations/discord`, { waitUntil: 'domcontentloaded' });
  await snap(page, '29-discord-channel-integration.png', { delayMs: 1500 });

  await page.goto(`${BASE_URL}/settings/integrations/email`, { waitUntil: 'domcontentloaded' });
  await snap(page, '30-email-channel-integration.png', { delayMs: 1500 });

  await page.goto(`${BASE_URL}/settings/integrations/upwork`, { waitUntil: 'domcontentloaded' });
  await snap(page, '31-upwork-channel-integration.png', { delayMs: 1500 });

  // ==========================================
  // SECTION 6: SUPER ADMIN PLATFORM CONTROL
  // ==========================================
  console.log('\n--- Section 6: Super Admin Platform ---');
  await page.goto(`${BASE_URL}/super-admin/dashboard`, { waitUntil: 'domcontentloaded' });
  await snap(page, '32-super-admin-dashboard.png', { delayMs: 2500 });

  await page.goto(`${BASE_URL}/super-admin/organizations`, { waitUntil: 'domcontentloaded' });
  await snap(page, '33-super-admin-organizations.png', { delayMs: 2500 });

  // Organization Detail in Super Admin
  const adminOrgLink = await page.locator('a[href^="/super-admin/organizations/"]').first();
  if (await adminOrgLink.isVisible()) {
    const adminOrgUrl = await adminOrgLink.getAttribute('href');
    if (adminOrgUrl) {
      await page.goto(`${BASE_URL}${adminOrgUrl}`, { waitUntil: 'domcontentloaded' });
      await snap(page, '34-super-admin-org-management.png', { delayMs: 2000 });

      // Plan override modal
      try {
        const overrideBtn = await page.locator('button:has-text("Override Plan"), button:has-text("Change Plan")').first();
        if (await overrideBtn.isVisible()) {
          await overrideBtn.click();
          await page.waitForTimeout(1000);
          await snap(page, '35-super-admin-plan-override-modal.png', { delayMs: 1000 });
          await page.keyboard.press('Escape');
        }
      } catch (e) {}
    }
  }

  await page.goto(`${BASE_URL}/super-admin/settings`, { waitUntil: 'domcontentloaded' });
  await snap(page, '36-super-admin-platform-settings.png', { delayMs: 2000 });

  await page.goto(`${BASE_URL}/super-admin/audit-log`, { waitUntil: 'domcontentloaded' });
  await snap(page, '37-super-admin-audit-log.png', { delayMs: 2500 });

  // ==========================================
  // SECTION 7: SETTINGS & CLIENT PORTAL
  // ==========================================
  console.log('\n--- Section 7: Organization Settings & Portal ---');
  await page.goto(`${BASE_URL}/settings/organization`, { waitUntil: 'domcontentloaded' });
  await snap(page, '38-settings-organization-profile.png', { delayMs: 2000 });

  await page.goto(`${BASE_URL}/settings/team`, { waitUntil: 'domcontentloaded' });
  await snap(page, '39-settings-team-members.png', { delayMs: 2000 });

  await page.goto(`${BASE_URL}/settings/templates`, { waitUntil: 'domcontentloaded' });
  await snap(page, '40-settings-project-templates.png', { delayMs: 2000 });

  await page.goto(`${BASE_URL}/settings/ai`, { waitUntil: 'domcontentloaded' });
  await snap(page, '41-settings-ai-feature-controls.png', { delayMs: 2000 });

  await page.goto(`${BASE_URL}/settings/billing`, { waitUntil: 'domcontentloaded' });
  await snap(page, '42-settings-billing-lifetime-tier.png', { delayMs: 2000 });

  await page.goto(`${BASE_URL}/settings/audit-log`, { waitUntil: 'domcontentloaded' });
  await snap(page, '43-settings-org-audit-log.png', { delayMs: 2000 });

  // Client Portal Sign In Gateway
  await page.goto(`${BASE_URL}/client/login`, { waitUntil: 'domcontentloaded' });
  await snap(page, '44-client-portal-login.png', { delayMs: 2000 });

  await browser.close();
  console.log(`\n🎉 SUCCESS! All ${screenshotCount} Live Domain Screenshots Captured in assets/screenshots_live_domain/!`);
}

runLiveCapture().catch((err) => {
  console.error('Fatal live capture failure:', err);
  process.exit(1);
});
