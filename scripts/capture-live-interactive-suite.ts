import { chromium, BrowserContext, Page } from 'playwright';
import path from 'path';
import fs from 'fs';

const BASE_URL = process.env.LIVE_DOMAIN_URL || 'https://www.project-manager.calara.agency';
const SCREENSHOT_DIR = path.resolve(process.cwd(), 'assets/screenshots_live_domain');

const TEST_EMAIL = process.env.TEST_USER_EMAIL || '';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || '';

let stepIndex = 35; // continue numbering from previous set

async function capture(page: Page, title: string, options: { fullPage?: boolean; delayMs?: number } = {}) {
  stepIndex++;
  const num = String(stepIndex).padStart(3, '0');
  const filename = `${num}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`;
  const filePath = path.join(SCREENSHOT_DIR, filename);

  await page.waitForTimeout(options.delayMs || 1200);
  await page.screenshot({ path: filePath, fullPage: options.fullPage ?? false });
  console.log(`📸 [${num}] Captured: ${filename}`);
  return filePath;
}

async function runInteractiveSuite() {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  console.log(`🚀 Starting Full Interactive Live System Operations on ${BASE_URL}...`);
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

  // Login
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.fill('input[type="email"]', TEST_EMAIL);
  await page.fill('input[type="password"]', TEST_PASSWORD);
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {}),
    page.click('button[type="submit"]'),
  ]);
  await page.waitForTimeout(2000);

  // ========================================================
  // 1. CRM: CREATE CLIENT & INTERACTIVE WORKFLOW
  // ========================================================
  console.log('\n--- 1. CRM Interactive Flows ---');
  await page.goto(`${BASE_URL}/clients`, { waitUntil: 'domcontentloaded' });
  await capture(page, 'crm-clients-initial-view');

  try {
    const addClientBtn = page.locator('button:has-text("Add Client"), button:has-text("New Client")').first();
    if (await addClientBtn.isVisible()) {
      await addClientBtn.click();
      await capture(page, 'crm-add-client-modal-open');

      // Fill client form
      const nameInput = page.locator('input[placeholder*="Acme"], input[name="name"], input[placeholder*="Company"]').first();
      if (await nameInput.isVisible()) {
        await nameInput.fill('Starlight Dynamics Enterprise');
      }

      const emailInput = page.locator('input[type="email"], input[placeholder*="client@"]').first();
      if (await emailInput.isVisible()) {
        await emailInput.fill('contact@starlightdynamics.com');
      }

      await capture(page, 'crm-add-client-modal-filled');

      const submitBtn = page.locator('button:has-text("Create Client"), button:has-text("Save Client"), button[type="submit"]:has-text("Add")').first();
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
        await page.waitForTimeout(2000);
        await capture(page, 'crm-client-created-directory');
      }
    }
  } catch (e) {
    console.log('Client flow note:', e);
  }

  // ========================================================
  // 2. LEADS: PIPELINE & AI SCORING MODAL
  // ========================================================
  console.log('\n--- 2. Leads Pipeline Flows ---');
  await page.goto(`${BASE_URL}/leads`, { waitUntil: 'domcontentloaded' });
  await capture(page, 'crm-leads-pipeline-board');

  try {
    const scoreBadge = page.locator('span:has-text("/100"), button:has-text("/100")').first();
    if (await scoreBadge.isVisible()) {
      await scoreBadge.click();
      await capture(page, 'crm-lead-ai-score-modal-overview', { delayMs: 1500 });

      // Click Re-Score button
      const rescoreBtn = page.locator('button:has-text("Re-Score"), button:has-text("Recalculate")').first();
      if (await rescoreBtn.isVisible()) {
        await rescoreBtn.click();
        await capture(page, 'crm-lead-ai-score-recalculated', { delayMs: 1500 });
      }

      await page.keyboard.press('Escape');
    }
  } catch (e) {
    console.log('Lead score note:', e);
  }

  // ========================================================
  // 3. PROJECTS & DELIVERABLES & KANBAN
  // ========================================================
  console.log('\n--- 3. Projects & Deliverables ---');
  await page.goto(`${BASE_URL}/projects`, { waitUntil: 'domcontentloaded' });
  await capture(page, 'projects-list-overview');

  await page.goto(`${BASE_URL}/projects/kanban`, { waitUntil: 'domcontentloaded' });
  await capture(page, 'projects-kanban-board-overview');

  // Open first project detail
  try {
    const firstProject = page.locator('a[href^="/projects/"]:not([href$="/kanban"])').first();
    if (await firstProject.isVisible()) {
      const projHref = await firstProject.getAttribute('href');
      if (projHref) {
        await page.goto(`${BASE_URL}${projHref}`, { waitUntil: 'domcontentloaded' });
        await capture(page, 'project-detail-overview');

        // Deliverables tab
        const deliverablesTab = page.locator('button:has-text("Deliverables"), a:has-text("Deliverables")').first();
        if (await deliverablesTab.isVisible()) {
          await deliverablesTab.click();
          await capture(page, 'project-detail-deliverables-tab');
        }

        // Trigger deliver project modal
        const deliverBtn = page.locator('button:has-text("Deliver Project"), button:has-text("Deliver")').first();
        if (await deliverBtn.isVisible()) {
          await deliverBtn.click();
          await capture(page, 'project-deliver-confirmation-modal');
          await page.keyboard.press('Escape');
        }
      }
    }
  } catch (e) {
    console.log('Project detail note:', e);
  }

  // ========================================================
  // 4. TASKS BOARD & FILTERS
  // ========================================================
  console.log('\n--- 4. Tasks Board ---');
  await page.goto(`${BASE_URL}/tasks`, { waitUntil: 'domcontentloaded' });
  await capture(page, 'tasks-workload-board-all');

  // ========================================================
  // 5. UNIFIED INBOX, AI SMART REPLY & TASK EXTRACTION
  // ========================================================
  console.log('\n--- 5. Inbox & AI Tools ---');
  await page.goto(`${BASE_URL}/inbox`, { waitUntil: 'domcontentloaded' });
  await capture(page, 'inbox-unified-message-stream');

  // Click on a message thread if available
  try {
    const threadItem = page.locator('div[class*="cursor-pointer"]:has-text("Client"), div[class*="cursor-pointer"]:has-text("Message")').first();
    if (await threadItem.isVisible()) {
      await threadItem.click();
      await capture(page, 'inbox-active-thread-view', { delayMs: 1500 });
    }

    // AI Suggestions
    const aiSuggestBtn = page.locator('button:has-text("AI Suggestions"), button:has-text("Smart Reply")').first();
    if (await aiSuggestBtn.isVisible()) {
      await aiSuggestBtn.click();
      await capture(page, 'inbox-ai-reply-suggestions-tray', { delayMs: 1500 });
    }

    // AI Auto-Task Extraction
    const autoTaskBtn = page.locator('button:has-text("Extract Tasks"), button:has-text("Auto-Task")').first();
    if (await autoTaskBtn.isVisible()) {
      await autoTaskBtn.click();
      await capture(page, 'inbox-ai-auto-task-extraction-modal', { delayMs: 1500 });
      await page.keyboard.press('Escape');
    }
  } catch (e) {
    console.log('Inbox AI flow note:', e);
  }

  // ========================================================
  // 6. ANALYTICS & REPORTS SUITE
  // ========================================================
  console.log('\n--- 6. Analytics & Reports ---');
  await page.goto(`${BASE_URL}/analytics`, { waitUntil: 'domcontentloaded' });
  await capture(page, 'analytics-kpis-and-velocity');

  // Open Weekly Report Modal
  try {
    const reportBtn = page.locator('button:has-text("Generate Weekly Report"), button:has-text("AI Weekly Report")').first();
    if (await reportBtn.isVisible()) {
      await reportBtn.click();
      await capture(page, 'analytics-weekly-report-modal-generated', { delayMs: 2000 });
      await page.keyboard.press('Escape');
    }
  } catch (e) {}

  await page.goto(`${BASE_URL}/analytics/revenue`, { waitUntil: 'domcontentloaded' });
  await capture(page, 'analytics-revenue-breakdown-ledger');

  await page.goto(`${BASE_URL}/analytics/plan-usage`, { waitUntil: 'domcontentloaded' });
  await capture(page, 'analytics-resource-plan-utilization');

  // ========================================================
  // 7. SUPER ADMIN PLATFORM MANAGEMENT
  // ========================================================
  console.log('\n--- 7. Super Admin Operations ---');
  await page.goto(`${BASE_URL}/super-admin/dashboard`, { waitUntil: 'domcontentloaded' });
  await capture(page, 'super-admin-executive-dashboard');

  await page.goto(`${BASE_URL}/super-admin/organizations`, { waitUntil: 'domcontentloaded' });
  await capture(page, 'super-admin-tenant-directory');

  const firstOrg = page.locator('a[href^="/super-admin/organizations/"]').first();
  if (await firstOrg.isVisible()) {
    const orgUrl = await firstOrg.getAttribute('href');
    if (orgUrl) {
      await page.goto(`${BASE_URL}${orgUrl}`, { waitUntil: 'domcontentloaded' });
      await capture(page, 'super-admin-tenant-detail-view');

      // Override plan modal
      const overridePlanBtn = page.locator('button:has-text("Override Plan"), button:has-text("Change Plan")').first();
      if (await overridePlanBtn.isVisible()) {
        await overridePlanBtn.click();
        await capture(page, 'super-admin-plan-override-modal-active');
        await page.keyboard.press('Escape');
      }
    }
  }

  await page.goto(`${BASE_URL}/super-admin/settings`, { waitUntil: 'domcontentloaded' });
  await capture(page, 'super-admin-global-feature-flags');

  await page.goto(`${BASE_URL}/super-admin/audit-log`, { waitUntil: 'domcontentloaded' });
  await capture(page, 'super-admin-immutable-audit-trail');

  // ========================================================
  // 8. WORKSPACE SETTINGS & CHANNELS
  // ========================================================
  console.log('\n--- 8. Workspace Settings ---');
  await page.goto(`${BASE_URL}/settings/organization`, { waitUntil: 'domcontentloaded' });
  await capture(page, 'settings-org-profile-and-branding');

  await page.goto(`${BASE_URL}/settings/team`, { waitUntil: 'domcontentloaded' });
  await capture(page, 'settings-team-management-roster');

  // Invite member modal
  try {
    const inviteBtn = page.locator('button:has-text("Invite Member"), button:has-text("Add Member")').first();
    if (await inviteBtn.isVisible()) {
      await inviteBtn.click();
      await capture(page, 'settings-invite-team-member-modal');
      await page.keyboard.press('Escape');
    }
  } catch (e) {}

  await page.goto(`${BASE_URL}/settings/templates`, { waitUntil: 'domcontentloaded' });
  await capture(page, 'settings-project-scaffolding-templates');

  await page.goto(`${BASE_URL}/settings/ai`, { waitUntil: 'domcontentloaded' });
  await capture(page, 'settings-ai-capability-toggles-matrix');

  await page.goto(`${BASE_URL}/settings/billing`, { waitUntil: 'domcontentloaded' });
  await capture(page, 'settings-billing-lifetime-vip-plan');

  await page.goto(`${BASE_URL}/settings/audit-log`, { waitUntil: 'domcontentloaded' });
  await capture(page, 'settings-tenant-audit-compliance-log');

  await browser.close();
  console.log(`\n🎉 Interactive Suite Completed! Total screenshots: ${stepIndex}`);
}

runInteractiveSuite().catch((err) => {
  console.error('Interactive capture failed:', err);
  process.exit(1);
});
