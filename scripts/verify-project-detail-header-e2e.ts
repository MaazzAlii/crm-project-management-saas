import { UserRepository, OrganizationRepository } from '../lib/db/repositories';
import { query } from '../lib/db';
import bcrypt from 'bcryptjs';
import { chromium } from 'playwright';

const ARTIFACT_DIR = '/home/maazzalii/.gemini/antigravity-ide/brain/cf073fd7-d5ad-42d9-9757-652ed5a77ddf';

async function verifyProjectDetailHeader() {
  console.log('=== STARTING PROJECT DETAIL HEADER (6D1) BROWSER VERIFICATION ===');

  const ts = Date.now();
  const email = `lead_detail_${ts}@example.com`;
  const rawPassword = 'PlaywrightPass123!';
  const passwordHash = await bcrypt.hash(rawPassword, 10);

  const userRepo = new UserRepository();
  const orgRepo = new OrganizationRepository();

  const user = await userRepo.create({
    email,
    passwordHash,
    fullName: 'Project Director',
    role: 'org_admin',
    requirePasswordChange: false,
  });

  const org = await orgRepo.create({
    name: 'Innoventix Architecture ' + ts,
    slug: 'arch-ws-' + ts,
    ownerUserId: user.id,
  });

  console.log(`[E2E] Provisioned user ${user.email} with workspace ${org.slug}`);

  // Seed sample client
  const clientRes = await query<{ id: string }>(
    `INSERT INTO clients (organization_id, name, email, company)
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [org.id, 'Global Dynamics Inc', `client_${ts}@example.com`, 'Global Dynamics']
  );
  const clientId = clientRes.rows[0].id;

  // Seed real project with full details
  const startDate = new Date().toISOString();
  const deadline = new Date(Date.now() + 30 * 86400000).toISOString();
  const projectRes = await query<{ id: string }>(
    `INSERT INTO projects (
       organization_id, client_id, assigned_to, title, description,
       status, amount, currency, start_date, deadline
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'USD', $8, $9) RETURNING id`,
    [
      org.id,
      clientId,
      user.id,
      'Enterprise Infrastructure Modernization',
      'End-to-end bare-metal migration with automated zero-downtime failover pipeline.',
      'Planning',
      85000,
      startDate,
      deadline,
    ]
  );
  const projectId = projectRes.rows[0].id;
  console.log(`[E2E] Seeded test project: ${projectId}`);

  // Seed sample deliverable
  await query(
    `INSERT INTO deliverables (organization_id, project_id, title, status)
     VALUES ($1, $2, $3, 'pending')`,
    [org.id, projectId, 'Phase 1: Architecture Blueprint']
  );

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
  const page = await context.newPage();

  // 1. Login
  console.log('[E2E] Authenticating on /login...');
  await page.goto('http://localhost:3000/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', rawPassword);
  await page.click('button[type="submit"]');

  await page.waitForURL('**/dashboard**', { timeout: 15000 });
  console.log(`[E2E] Navigating to /projects/${projectId}...`);

  await page.goto(`http://localhost:3000/projects/${projectId}`);
  await page.waitForSelector('h1', { timeout: 10000 });
  await page.waitForSelector('text=Back to Projects', { timeout: 10000 });
  console.log('[E2E] Project detail page rendered successfully');

  // 2. Measure LIGHT THEME
  console.log('[E2E] Applying Light Mode...');
  await page.evaluate(() => {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  });
  await page.waitForTimeout(600);

  const lightStyles = await page.evaluate(() => {
    const backLink = Array.from(document.querySelectorAll('a')).find((a) =>
      a.textContent?.includes('Back to Projects')
    );
    const h1 = document.querySelector('h1');
    const statusSelect = document.querySelector('select');
    const statusBadge = document.querySelector('span.rounded-full.border') || document.querySelector('div.inline-flex.items-center.rounded-full');
    const contractValue = document.querySelector('div.text-xl.font-bold');
    const contractLabel = Array.from(document.querySelectorAll('div')).find((d) =>
      d.textContent?.trim() === 'Contract Value'
    );
    const clientLabel = Array.from(document.querySelectorAll('div')).find((d) =>
      d.textContent?.trim() === 'Client'
    );
    const clientLink = Array.from(document.querySelectorAll('a')).find((a) =>
      a.textContent?.includes('Global Dynamics Inc')
    );
    const memberLabel = Array.from(document.querySelectorAll('div')).find((d) =>
      d.textContent?.trim() === 'Assigned Member'
    );
    const deadlineLabel = Array.from(document.querySelectorAll('div')).find((d) =>
      d.textContent?.trim() === 'Target Deadline'
    );
    const actionBtn = Array.from(document.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Deliverable')
    );
    const headerCard = document.querySelector('div.bg-card');

    return {
      backLinkColor: backLink ? window.getComputedStyle(backLink).color : 'N/A',
      h1Color: h1 ? window.getComputedStyle(h1).color : 'N/A',
      statusSelectColor: statusSelect ? window.getComputedStyle(statusSelect).color : 'N/A',
      statusSelectBg: statusSelect ? window.getComputedStyle(statusSelect).backgroundColor : 'N/A',
      statusBadgeColor: statusBadge ? window.getComputedStyle(statusBadge).color : 'N/A',
      contractValueColor: contractValue ? window.getComputedStyle(contractValue).color : 'N/A',
      contractLabelColor: contractLabel ? window.getComputedStyle(contractLabel).color : 'N/A',
      clientLabelColor: clientLabel ? window.getComputedStyle(clientLabel).color : 'N/A',
      clientLinkColor: clientLink ? window.getComputedStyle(clientLink).color : 'N/A',
      memberLabelColor: memberLabel ? window.getComputedStyle(memberLabel).color : 'N/A',
      deadlineLabelColor: deadlineLabel ? window.getComputedStyle(deadlineLabel).color : 'N/A',
      actionBtnColor: actionBtn ? window.getComputedStyle(actionBtn).color : 'N/A',
      actionBtnBg: actionBtn ? window.getComputedStyle(actionBtn).backgroundColor : 'N/A',
      headerCardBg: headerCard ? window.getComputedStyle(headerCard).backgroundColor : 'N/A',
      fontFamily: h1 ? window.getComputedStyle(h1).fontFamily : 'N/A',
    };
  });

  console.log('[E2E] Light Mode Computed Styles:\n', JSON.stringify(lightStyles, null, 2));

  // Screenshot header region
  const headerLocator = page.locator('div.bg-card').first();
  const lightScreenshotPath = `${ARTIFACT_DIR}/projects_detail_header_light.png`;
  await headerLocator.screenshot({ path: lightScreenshotPath });
  console.log(`[E2E] Saved Light Mode header screenshot to ${lightScreenshotPath}`);

  // Assertions for Light Mode
  if (lightStyles.h1Color !== 'rgb(2, 8, 23)') {
    throw new Error(`Expected h1 to be slate-900 (rgb(2, 8, 23)), got: ${lightStyles.h1Color}`);
  }
  if (lightStyles.backLinkColor !== 'rgb(100, 116, 139)') {
    throw new Error(`Expected back link to be slate-500 (rgb(100, 116, 139)), got: ${lightStyles.backLinkColor}`);
  }
  if (lightStyles.contractValueColor !== 'rgb(2, 8, 23)') {
    throw new Error(`Expected contract value to be slate-900 (rgb(2, 8, 23)), got: ${lightStyles.contractValueColor}`);
  }
  if (lightStyles.contractLabelColor !== 'rgb(100, 116, 139)') {
    throw new Error(`Expected contract label to be slate-500 (rgb(100, 116, 139)), got: ${lightStyles.contractLabelColor}`);
  }
  console.log('✅ Light mode color assertions PASSED');

  // 3. Measure DARK THEME
  console.log('[E2E] Applying Dark Mode...');
  await page.evaluate(() => {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  });
  await page.waitForTimeout(600);

  const darkStyles = await page.evaluate(() => {
    const backLink = Array.from(document.querySelectorAll('a')).find((a) =>
      a.textContent?.includes('Back to Projects')
    );
    const h1 = document.querySelector('h1');
    const statusSelect = document.querySelector('select');
    const statusBadge = document.querySelector('span.rounded-full.border') || document.querySelector('div.inline-flex.items-center.rounded-full');
    const contractValue = document.querySelector('div.text-xl.font-bold');
    const contractLabel = Array.from(document.querySelectorAll('div')).find((d) =>
      d.textContent?.trim() === 'Contract Value'
    );
    const clientLabel = Array.from(document.querySelectorAll('div')).find((d) =>
      d.textContent?.trim() === 'Client'
    );
    const clientLink = Array.from(document.querySelectorAll('a')).find((a) =>
      a.textContent?.includes('Global Dynamics Inc')
    );
    const memberLabel = Array.from(document.querySelectorAll('div')).find((d) =>
      d.textContent?.trim() === 'Assigned Member'
    );
    const deadlineLabel = Array.from(document.querySelectorAll('div')).find((d) =>
      d.textContent?.trim() === 'Target Deadline'
    );
    const actionBtn = Array.from(document.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Deliverable')
    );
    const headerCard = document.querySelector('div.bg-card');

    return {
      backLinkColor: backLink ? window.getComputedStyle(backLink).color : 'N/A',
      h1Color: h1 ? window.getComputedStyle(h1).color : 'N/A',
      statusSelectColor: statusSelect ? window.getComputedStyle(statusSelect).color : 'N/A',
      statusSelectBg: statusSelect ? window.getComputedStyle(statusSelect).backgroundColor : 'N/A',
      statusBadgeColor: statusBadge ? window.getComputedStyle(statusBadge).color : 'N/A',
      contractValueColor: contractValue ? window.getComputedStyle(contractValue).color : 'N/A',
      contractLabelColor: contractLabel ? window.getComputedStyle(contractLabel).color : 'N/A',
      clientLabelColor: clientLabel ? window.getComputedStyle(clientLabel).color : 'N/A',
      clientLinkColor: clientLink ? window.getComputedStyle(clientLink).color : 'N/A',
      memberLabelColor: memberLabel ? window.getComputedStyle(memberLabel).color : 'N/A',
      deadlineLabelColor: deadlineLabel ? window.getComputedStyle(deadlineLabel).color : 'N/A',
      actionBtnColor: actionBtn ? window.getComputedStyle(actionBtn).color : 'N/A',
      actionBtnBg: actionBtn ? window.getComputedStyle(actionBtn).backgroundColor : 'N/A',
      headerCardBg: headerCard ? window.getComputedStyle(headerCard).backgroundColor : 'N/A',
      fontFamily: h1 ? window.getComputedStyle(h1).fontFamily : 'N/A',
    };
  });

  console.log('[E2E] Dark Mode Computed Styles:\n', JSON.stringify(darkStyles, null, 2));

  const darkScreenshotPath = `${ARTIFACT_DIR}/projects_detail_header_dark.png`;
  await headerLocator.screenshot({ path: darkScreenshotPath });
  console.log(`[E2E] Saved Dark Mode header screenshot to ${darkScreenshotPath}`);

  // Assertions for Dark Mode
  if (darkStyles.h1Color !== 'rgb(248, 250, 252)') {
    throw new Error(`Expected h1 to be slate-50 (rgb(248, 250, 252)), got: ${darkStyles.h1Color}`);
  }
  if (darkStyles.backLinkColor !== 'rgb(148, 163, 184)') {
    throw new Error(`Expected back link to be slate-400 (rgb(148, 163, 184)), got: ${darkStyles.backLinkColor}`);
  }
  if (darkStyles.contractValueColor !== 'rgb(248, 250, 252)') {
    throw new Error(`Expected contract value to be slate-50 (rgb(248, 250, 252)), got: ${darkStyles.contractValueColor}`);
  }
  if (darkStyles.contractLabelColor !== 'rgb(148, 163, 184)') {
    throw new Error(`Expected contract label to be slate-400 (rgb(148, 163, 184)), got: ${darkStyles.contractLabelColor}`);
  }
  console.log('✅ Dark mode color assertions PASSED');

  // 4. Multi-Route Navigation Check
  console.log('[E2E] Multi-Route verification (/projects → /projects/[id] → /projects/kanban)...');
  for (const theme of ['light', 'dark']) {
    await page.evaluate((t) => {
      if (t === 'dark') {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
    }, theme);

    for (const route of ['/projects', `/projects/${projectId}`, '/projects/kanban']) {
      await page.goto(`http://localhost:3000${route}`);
      await page.waitForTimeout(400);
      const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
      const expectedDark = theme === 'dark';
      if (isDark !== expectedDark) throw new Error(`Theme mismatch on ${route}: expected ${theme}`);
      console.log(`[E2E] Route ${route} verified in ${theme} mode (dark=${isDark})`);
    }
  }

  await browser.close();
  console.log('=== PROJECT DETAIL HEADER BROWSER VERIFICATION COMPLETED SUCCESSFULLY ===');
  process.exit(0);
}

verifyProjectDetailHeader().catch((err) => {
  console.error('[E2E] FATAL ERROR:', err);
  process.exit(1);
});
