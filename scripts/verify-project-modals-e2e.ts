import { UserRepository, OrganizationRepository } from '../lib/db/repositories';
import { query } from '../lib/db';
import bcrypt from 'bcryptjs';
import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = '/home/maazzalii/.gemini/antigravity-ide/brain/64a686d0-9c20-493a-89c3-4d69e7d25c22';

interface ComputedStylesReport {
  modal: string;
  theme: string;
  overlayBg: string;
  surfaceBg: string;
  surfaceBorder: string;
  titleColor: string;
  labelColor: string;
  inputColor: string;
  inputPlaceholderColor?: string;
  cancelBtnColor: string;
  cancelBtnBg: string;
  primaryBtnColor: string;
  primaryBtnBg: string;
}

async function verifyProjectModals() {
  console.log('=== STARTING PROJECT MODALS (6E) BROWSER VERIFICATION ===');

  const ts = Date.now();
  const email = `modal_lead_${ts}@example.com`;
  const rawPassword = 'PlaywrightPass123!';
  const passwordHash = await bcrypt.hash(rawPassword, 10);

  const userRepo = new UserRepository();
  const orgRepo = new OrganizationRepository();

  const user = await userRepo.create({
    email,
    passwordHash,
    fullName: 'Executive Product Director',
    role: 'org_admin',
    requirePasswordChange: false,
  });

  const org = await orgRepo.create({
    name: 'Innoventix Modals Suite ' + ts,
    slug: 'modals-ws-' + ts,
    ownerUserId: user.id,
  });

  console.log(`[E2E] Provisioned user ${user.email} with workspace ${org.slug}`);

  // Seed sample client
  const clientRes = await query<{ id: string }>(
    `INSERT INTO clients (organization_id, name, email, company)
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [org.id, 'Starlight Media Dynamics', `starlight_${ts}@example.com`, 'Starlight Dynamics']
  );
  const clientId = clientRes.rows[0].id;

  // Seed real project with full details
  const startDate = new Date().toISOString().slice(0, 10);
  const deadline = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  const projectRes = await query<{ id: string }>(
    `INSERT INTO projects (
       organization_id, client_id, assigned_to, title, description,
       status, amount, currency, start_date, deadline
     )
     VALUES ($1, $2, $3, $4, $5, 'Planning', 84000, 'USD', $6, $7) RETURNING id`,
    [
      org.id,
      clientId,
      user.id,
      'Omnichannel Autonomous AI Campaign',
      'End-to-end automated multi-channel CRM acquisition and conversion workflow.',
      startDate,
      deadline
    ]
  );
  const projectId = projectRes.rows[0].id;

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
    await page.waitForTimeout(200);
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
  // MODAL 1: NewProjectModal from /projects ("Create Project" button)
  // ══════════════════════════════════════════════════════════════
  console.log('\n--- VERIFYING NewProjectModal ---');
  await page.goto('http://localhost:3000/projects');
  await page.waitForSelector('text=Projects List & Management', { timeout: 10000 });

  // Open NewProjectModal
  const newProjectBtn = page.locator('button:has-text("Create Project"), button:has-text("New Project")').first();
  await newProjectBtn.click();
  await page.waitForSelector('text=Create New Project', { timeout: 10000 });
  console.log('[E2E] NewProjectModal opened.');

  // Light Mode
  await setTheme('light');
  const newLightScreenshot = path.join(ARTIFACT_DIR, 'projects_modal_new_light.png');
  await page.screenshot({ path: newLightScreenshot });
  console.log(`[E2E] Captured: ${newLightScreenshot}`);

  const newLightStyles = await page.evaluate(() => {
    const overlay = document.querySelector('.fixed.inset-0.z-50') as HTMLElement;
    const surface = overlay?.querySelector('.relative.w-full.max-w-2xl') as HTMLElement;
    const title = overlay?.querySelector('h2') as HTMLElement;
    const label = overlay?.querySelector('label') as HTMLElement;
    const input = overlay?.querySelector('input[type="text"]') as HTMLElement;
    const cancelBtn = Array.from(overlay?.querySelectorAll('button') || []).find((b) =>
      b.textContent?.includes('Cancel')
    ) as HTMLElement;
    const primaryBtn = overlay?.querySelector('button[type="submit"]') as HTMLElement;

    return {
      overlayBg: window.getComputedStyle(overlay).backgroundColor,
      surfaceBg: window.getComputedStyle(surface).backgroundColor,
      surfaceBorder: window.getComputedStyle(surface).borderColor,
      titleColor: window.getComputedStyle(title).color,
      labelColor: window.getComputedStyle(label).color,
      inputColor: window.getComputedStyle(input).color,
      inputPlaceholderColor: window.getComputedStyle(input, '::placeholder').color,
      cancelBtnColor: window.getComputedStyle(cancelBtn).color,
      cancelBtnBg: window.getComputedStyle(cancelBtn).backgroundColor,
      primaryBtnColor: window.getComputedStyle(primaryBtn).color,
      primaryBtnBg: window.getComputedStyle(primaryBtn).backgroundColor,
    };
  });
  styleReports.push({ modal: 'NewProjectModal', theme: 'Light', ...newLightStyles });

  // Dark Mode
  await setTheme('dark');
  const newDarkScreenshot = path.join(ARTIFACT_DIR, 'projects_modal_new_dark.png');
  await page.screenshot({ path: newDarkScreenshot });
  console.log(`[E2E] Captured: ${newDarkScreenshot}`);

  const newDarkStyles = await page.evaluate(() => {
    const overlay = document.querySelector('.fixed.inset-0.z-50') as HTMLElement;
    const surface = overlay?.querySelector('.relative.w-full.max-w-2xl') as HTMLElement;
    const title = overlay?.querySelector('h2') as HTMLElement;
    const label = overlay?.querySelector('label') as HTMLElement;
    const input = overlay?.querySelector('input[type="text"]') as HTMLElement;
    const cancelBtn = Array.from(overlay?.querySelectorAll('button') || []).find((b) =>
      b.textContent?.includes('Cancel')
    ) as HTMLElement;
    const primaryBtn = overlay?.querySelector('button[type="submit"]') as HTMLElement;

    return {
      overlayBg: window.getComputedStyle(overlay).backgroundColor,
      surfaceBg: window.getComputedStyle(surface).backgroundColor,
      surfaceBorder: window.getComputedStyle(surface).borderColor,
      titleColor: window.getComputedStyle(title).color,
      labelColor: window.getComputedStyle(label).color,
      inputColor: window.getComputedStyle(input).color,
      inputPlaceholderColor: window.getComputedStyle(input, '::placeholder').color,
      cancelBtnColor: window.getComputedStyle(cancelBtn).color,
      cancelBtnBg: window.getComputedStyle(cancelBtn).backgroundColor,
      primaryBtnColor: window.getComputedStyle(primaryBtn).color,
      primaryBtnBg: window.getComputedStyle(primaryBtn).backgroundColor,
    };
  });
  styleReports.push({ modal: 'NewProjectModal', theme: 'Dark', ...newDarkStyles });

  // Close NewProjectModal
  await page.click('button:has-text("Cancel")');
  await page.waitForTimeout(300);

  // ══════════════════════════════════════════════════════════════
  // MODAL 2: EditProjectModal from /projects (row edit icon)
  // ══════════════════════════════════════════════════════════════
  console.log('\n--- VERIFYING EditProjectModal ---');
  const quickEditBtn = page.locator('button[title="Quick Edit"]').first();
  await quickEditBtn.click();
  await page.waitForSelector('text=Edit Project Details', { timeout: 10000 });
  console.log('[E2E] EditProjectModal opened.');

  // Light Mode
  await setTheme('light');
  const editLightScreenshot = path.join(ARTIFACT_DIR, 'projects_modal_edit_light.png');
  await page.screenshot({ path: editLightScreenshot });
  console.log(`[E2E] Captured: ${editLightScreenshot}`);

  const editLightStyles = await page.evaluate(() => {
    const overlay = document.querySelector('.fixed.inset-0.z-50') as HTMLElement;
    const surface = overlay?.querySelector('.relative.w-full.max-w-2xl') as HTMLElement;
    const title = overlay?.querySelector('h2') as HTMLElement;
    const label = overlay?.querySelector('label') as HTMLElement;
    const input = overlay?.querySelector('input[type="text"]') as HTMLElement;
    const cancelBtn = Array.from(overlay?.querySelectorAll('button') || []).find((b) =>
      b.textContent?.includes('Cancel')
    ) as HTMLElement;
    const primaryBtn = overlay?.querySelector('button[type="submit"]') as HTMLElement;

    return {
      overlayBg: window.getComputedStyle(overlay).backgroundColor,
      surfaceBg: window.getComputedStyle(surface).backgroundColor,
      surfaceBorder: window.getComputedStyle(surface).borderColor,
      titleColor: window.getComputedStyle(title).color,
      labelColor: window.getComputedStyle(label).color,
      inputColor: window.getComputedStyle(input).color,
      inputPlaceholderColor: window.getComputedStyle(input, '::placeholder').color,
      cancelBtnColor: window.getComputedStyle(cancelBtn).color,
      cancelBtnBg: window.getComputedStyle(cancelBtn).backgroundColor,
      primaryBtnColor: window.getComputedStyle(primaryBtn).color,
      primaryBtnBg: window.getComputedStyle(primaryBtn).backgroundColor,
    };
  });
  styleReports.push({ modal: 'EditProjectModal', theme: 'Light', ...editLightStyles });

  // Dark Mode
  await setTheme('dark');
  const editDarkScreenshot = path.join(ARTIFACT_DIR, 'projects_modal_edit_dark.png');
  await page.screenshot({ path: editDarkScreenshot });
  console.log(`[E2E] Captured: ${editDarkScreenshot}`);

  const editDarkStyles = await page.evaluate(() => {
    const overlay = document.querySelector('.fixed.inset-0.z-50') as HTMLElement;
    const surface = overlay?.querySelector('.relative.w-full.max-w-2xl') as HTMLElement;
    const title = overlay?.querySelector('h2') as HTMLElement;
    const label = overlay?.querySelector('label') as HTMLElement;
    const input = overlay?.querySelector('input[type="text"]') as HTMLElement;
    const cancelBtn = Array.from(overlay?.querySelectorAll('button') || []).find((b) =>
      b.textContent?.includes('Cancel')
    ) as HTMLElement;
    const primaryBtn = overlay?.querySelector('button[type="submit"]') as HTMLElement;

    return {
      overlayBg: window.getComputedStyle(overlay).backgroundColor,
      surfaceBg: window.getComputedStyle(surface).backgroundColor,
      surfaceBorder: window.getComputedStyle(surface).borderColor,
      titleColor: window.getComputedStyle(title).color,
      labelColor: window.getComputedStyle(label).color,
      inputColor: window.getComputedStyle(input).color,
      inputPlaceholderColor: window.getComputedStyle(input, '::placeholder').color,
      cancelBtnColor: window.getComputedStyle(cancelBtn).color,
      cancelBtnBg: window.getComputedStyle(cancelBtn).backgroundColor,
      primaryBtnColor: window.getComputedStyle(primaryBtn).color,
      primaryBtnBg: window.getComputedStyle(primaryBtn).backgroundColor,
    };
  });
  styleReports.push({ modal: 'EditProjectModal', theme: 'Dark', ...editDarkStyles });

  // Close EditProjectModal
  await page.click('button:has-text("Cancel")');
  await page.waitForTimeout(300);

  // ══════════════════════════════════════════════════════════════
  // MODAL 3: DeliverProjectConfirmModal from /projects/[id]
  // ══════════════════════════════════════════════════════════════
  console.log('\n--- VERIFYING DeliverProjectConfirmModal ---');
  await page.goto(`http://localhost:3000/projects/${projectId}`);
  await page.waitForSelector('text=Back to Projects', { timeout: 10000 });

  // Select "Delivered" from Status dropdown to trigger DeliverProjectConfirmModal
  const statusSelect = page.locator('select').first();
  await statusSelect.selectOption('Delivered');
  await page.waitForSelector('text=Confirm & Deliver', { timeout: 10000 });
  console.log('[E2E] DeliverProjectConfirmModal opened.');

  // Light Mode
  await setTheme('light');
  const deliverLightScreenshot = path.join(ARTIFACT_DIR, 'projects_modal_deliver_light.png');
  await page.screenshot({ path: deliverLightScreenshot });
  console.log(`[E2E] Captured: ${deliverLightScreenshot}`);

  const deliverLightStyles = await page.evaluate(() => {
    const overlay = document.querySelector('.fixed.inset-0.z-50') as HTMLElement;
    const surface = overlay?.querySelector('.relative.w-full.max-w-lg') as HTMLElement;
    const title = overlay?.querySelector('h3') as HTMLElement;
    const label = overlay?.querySelector('span.text-\\[10px\\]') as HTMLElement;
    const cancelBtn = Array.from(overlay?.querySelectorAll('button') || []).find((b) =>
      b.textContent?.includes('Cancel')
    ) as HTMLElement;
    const primaryBtn = Array.from(overlay?.querySelectorAll('button') || []).find((b) =>
      b.textContent?.includes('Confirm & Deliver')
    ) as HTMLElement;

    return {
      overlayBg: window.getComputedStyle(overlay).backgroundColor,
      surfaceBg: window.getComputedStyle(surface).backgroundColor,
      surfaceBorder: window.getComputedStyle(surface).borderColor,
      titleColor: window.getComputedStyle(title).color,
      labelColor: window.getComputedStyle(label).color,
      inputColor: 'N/A (confirmation dialog)',
      cancelBtnColor: window.getComputedStyle(cancelBtn).color,
      cancelBtnBg: window.getComputedStyle(cancelBtn).backgroundColor,
      primaryBtnColor: window.getComputedStyle(primaryBtn).color,
      primaryBtnBg: window.getComputedStyle(primaryBtn).backgroundColor,
    };
  });
  styleReports.push({ modal: 'DeliverProjectConfirmModal', theme: 'Light', ...deliverLightStyles });

  // Dark Mode
  await setTheme('dark');
  const deliverDarkScreenshot = path.join(ARTIFACT_DIR, 'projects_modal_deliver_dark.png');
  await page.screenshot({ path: deliverDarkScreenshot });
  console.log(`[E2E] Captured: ${deliverDarkScreenshot}`);

  const deliverDarkStyles = await page.evaluate(() => {
    const overlay = document.querySelector('.fixed.inset-0.z-50') as HTMLElement;
    const surface = overlay?.querySelector('.relative.w-full.max-w-lg') as HTMLElement;
    const title = overlay?.querySelector('h3') as HTMLElement;
    const label = overlay?.querySelector('span.text-\\[10px\\]') as HTMLElement;
    const cancelBtn = Array.from(overlay?.querySelectorAll('button') || []).find((b) =>
      b.textContent?.includes('Cancel')
    ) as HTMLElement;
    const primaryBtn = Array.from(overlay?.querySelectorAll('button') || []).find((b) =>
      b.textContent?.includes('Confirm & Deliver')
    ) as HTMLElement;

    return {
      overlayBg: window.getComputedStyle(overlay).backgroundColor,
      surfaceBg: window.getComputedStyle(surface).backgroundColor,
      surfaceBorder: window.getComputedStyle(surface).borderColor,
      titleColor: window.getComputedStyle(title).color,
      labelColor: window.getComputedStyle(label).color,
      inputColor: 'N/A (confirmation dialog)',
      cancelBtnColor: window.getComputedStyle(cancelBtn).color,
      cancelBtnBg: window.getComputedStyle(cancelBtn).backgroundColor,
      primaryBtnColor: window.getComputedStyle(primaryBtn).color,
      primaryBtnBg: window.getComputedStyle(primaryBtn).backgroundColor,
    };
  });
  styleReports.push({ modal: 'DeliverProjectConfirmModal', theme: 'Dark', ...deliverDarkStyles });

  // Close Deliver modal
  await page.click('button:has-text("Cancel")');
  await page.waitForTimeout(300);

  // ══════════════════════════════════════════════════════════════
  // MULTI-ROUTE CYCLE: open -> close -> navigate -> reopen (both themes)
  // ══════════════════════════════════════════════════════════════
  console.log('\n--- VERIFYING MULTI-ROUTE LIFECYCLE ---');
  // 1. Back to /projects in Dark mode
  await page.goto('http://localhost:3000/projects');
  await page.waitForSelector('text=Projects List & Management');
  await page.locator('button:has-text("Create Project"), button:has-text("New Project")').first().click();
  await page.waitForSelector('text=Create New Project');
  await page.click('button:has-text("Cancel")');
  console.log('[E2E] Multi-route step 1 PASS (/projects NewProjectModal in Dark)');

  // 2. Navigate to /projects/[id] in Light mode
  await setTheme('light');
  await page.goto(`http://localhost:3000/projects/${projectId}`);
  await page.waitForSelector('text=Back to Projects');
  await page.locator('select').first().selectOption('Delivered');
  await page.waitForSelector('text=Confirm & Deliver');
  await page.click('button:has-text("Cancel")');
  console.log('[E2E] Multi-route step 2 PASS (/projects/[id] DeliverProjectConfirmModal in Light)');

  // 3. Navigate back to /projects
  await page.goto('http://localhost:3000/projects');
  await page.waitForSelector('text=Projects List & Management');
  await page.locator('button[title="Quick Edit"]').first().click();
  await page.waitForSelector('text=Edit Project Details');
  await page.click('button:has-text("Cancel")');
  console.log('[E2E] Multi-route step 3 PASS (/projects EditProjectModal in Light)');

  await browser.close();

  console.log('\n=== COMPUTED COLOR MEASUREMENTS ===');
  console.log(JSON.stringify(styleReports, null, 2));

  console.log('\n=== E2E BROWSER VERIFICATION COMPLETE: ALL PASS ===');
}

verifyProjectModals().catch((err) => {
  console.error('E2E verification failed:', err);
  process.exit(1);
});
