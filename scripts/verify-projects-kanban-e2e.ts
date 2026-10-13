import { UserRepository, OrganizationRepository } from '../lib/db/repositories';
import { query } from '../lib/db';
import bcrypt from 'bcryptjs';
import { chromium } from 'playwright';

const ARTIFACT_DIR = '/home/maazzalii/.gemini/antigravity-ide/brain/cf073fd7-d5ad-42d9-9757-652ed5a77ddf';

async function verifyProjectsKanban() {
  console.log('=== STARTING PROJECTS KANBAN (6C) BROWSER VERIFICATION ===');

  const ts = Date.now();
  const email = `kanban_lead_${ts}@example.com`;
  const rawPassword = 'PlaywrightPass123!';
  const passwordHash = await bcrypt.hash(rawPassword, 10);

  const userRepo = new UserRepository();
  const orgRepo = new OrganizationRepository();

  const user = await userRepo.create({
    email,
    passwordHash,
    fullName: 'Kanban Lead',
    role: 'org_admin',
    requirePasswordChange: false,
  });

  const org = await orgRepo.create({
    name: 'Innoventix Kanban ' + ts,
    slug: 'kanban-ws-' + ts,
    ownerUserId: user.id,
  });

  console.log(`[E2E] Provisioned user ${user.email} with workspace ${org.slug}`);

  // Seed sample client
  const clientRes = await query<{ id: string }>(
    `INSERT INTO clients (organization_id, name, email, company)
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [org.id, 'Global Dynamics Inc', `dynamic_${ts}@example.com`, 'Global Dynamics']
  );
  const clientId = clientRes.rows[0].id;

  // Seed projects across 4 columns (leave 'On Hold' empty for empty-state measurement)
  const projectsData = [
    { title: 'Cloud Infrastructure Migration', status: 'planning', amount: 18000, desc: 'AWS to Bare Metal migration' },
    { title: 'Mobile Client v2', status: 'in_progress', amount: 42000, desc: 'React Native release' },
    { title: 'Design System Tokens', status: 'review', amount: 9500, desc: 'WCAG AA design token sync' },
    { title: 'Q3 Security Audit', status: 'completed', amount: 15000, desc: 'Pen-test and remediation completed' },
  ];

  for (const p of projectsData) {
    await query(
      `INSERT INTO projects (organization_id, client_id, title, description, status, amount, currency)
       VALUES ($1, $2, $3, $4, $5, $6, 'USD')`,
      [org.id, clientId, p.title, p.desc, p.status, p.amount]
    );
  }
  console.log('[E2E] Seeded 4 sample projects across kanban columns');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
  const page = await context.newPage();

  // 1. Login
  console.log('[E2E] Logging in...');
  await page.goto('http://localhost:3000/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', rawPassword);
  await page.click('button[type="submit"]');

  await page.waitForURL('**/dashboard**', { timeout: 15000 });
  console.log('[E2E] Authenticated and navigating to /projects/kanban...');

  await page.goto('http://localhost:3000/projects/kanban');
  await page.waitForSelector('h1', { timeout: 10000 });
  await page.waitForSelector('h3', { timeout: 10000 });
  console.log('[E2E] Navigated to /projects/kanban with board rendered');

  // 2. Measure LIGHT THEME
  console.log('[E2E] Configuring Light Mode...');
  await page.evaluate(() => {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  });
  await page.waitForTimeout(600);

  const lightStyles = await page.evaluate(() => {
    const h1 = document.querySelector('h1');
    const colHeader = document.querySelector('h3');
    const colBadge = document.querySelector('span.rounded-full.border');
    const cardTitle = document.querySelector('div.font-semibold.text-sm.line-clamp-2');
    const clientBadge = document.querySelector('div.inline-flex.items-center.text-xs.font-medium');
    const searchInput = document.querySelector('input[placeholder*="Search projects"]') as HTMLInputElement | null;
    const emptyColumnState = document.querySelector('div.border-dashed');
    const colSubheader = document.querySelector('div.px-4.py-2.text-\\[11px\\]');

    return {
      h1Color: h1 ? window.getComputedStyle(h1).color : 'N/A',
      colHeaderColor: colHeader ? window.getComputedStyle(colHeader).color : 'N/A',
      colBadgeColor: colBadge ? window.getComputedStyle(colBadge).color : 'N/A',
      cardTitleColor: cardTitle ? window.getComputedStyle(cardTitle).color : 'N/A',
      clientBadgeColor: clientBadge ? window.getComputedStyle(clientBadge).color : 'N/A',
      clientBadgeBg: clientBadge ? window.getComputedStyle(clientBadge).backgroundColor : 'N/A',
      searchInputColor: searchInput ? window.getComputedStyle(searchInput).color : 'N/A',
      searchInputBg: searchInput ? window.getComputedStyle(searchInput).backgroundColor : 'N/A',
      emptyColumnStateColor: emptyColumnState ? window.getComputedStyle(emptyColumnState).color : 'N/A',
      colSubheaderColor: colSubheader ? window.getComputedStyle(colSubheader).color : 'N/A',
      fontFamily: h1 ? window.getComputedStyle(h1).fontFamily : 'N/A',
    };
  });

  console.log('[E2E] Light Mode Computed Styles:\n', JSON.stringify(lightStyles, null, 2));

  const lightScreenshotPath = `${ARTIFACT_DIR}/projects_kanban_light.png`;
  await page.screenshot({ path: lightScreenshotPath, fullPage: false });
  console.log(`[E2E] Saved Light Mode screenshot to ${lightScreenshotPath}`);

  // Assertions for Light Mode
  if (lightStyles.h1Color !== 'rgb(2, 8, 23)') {
    throw new Error(`Expected h1 to be slate-900 (rgb(2, 8, 23)), got: ${lightStyles.h1Color}`);
  }
  if (lightStyles.colHeaderColor !== 'rgb(2, 8, 23)') {
    throw new Error(`Expected column header to be slate-900 (rgb(2, 8, 23)), got: ${lightStyles.colHeaderColor}`);
  }
  if (lightStyles.cardTitleColor !== 'rgb(2, 8, 23)') {
    throw new Error(`Expected card title to be slate-900 (rgb(2, 8, 23)), got: ${lightStyles.cardTitleColor}`);
  }
  if (lightStyles.emptyColumnStateColor !== 'rgb(100, 116, 139)') {
    throw new Error(`Expected empty state text to be slate-500 (rgb(100, 116, 139)), got: ${lightStyles.emptyColumnStateColor}`);
  }
  console.log('✅ Light mode color assertions PASSED');

  // 3. Measure DARK THEME
  console.log('[E2E] Configuring Dark Mode...');
  await page.evaluate(() => {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  });
  await page.waitForTimeout(600);

  const darkStyles = await page.evaluate(() => {
    const h1 = document.querySelector('h1');
    const colHeader = document.querySelector('h3');
    const colBadge = document.querySelector('span.rounded-full.border');
    const cardTitle = document.querySelector('div.font-semibold.text-sm.line-clamp-2');
    const clientBadge = document.querySelector('div.inline-flex.items-center.text-xs.font-medium');
    const searchInput = document.querySelector('input[placeholder*="Search projects"]') as HTMLInputElement | null;
    const emptyColumnState = document.querySelector('div.border-dashed');
    const colSubheader = document.querySelector('div.px-4.py-2.text-\\[11px\\]');

    return {
      h1Color: h1 ? window.getComputedStyle(h1).color : 'N/A',
      colHeaderColor: colHeader ? window.getComputedStyle(colHeader).color : 'N/A',
      colBadgeColor: colBadge ? window.getComputedStyle(colBadge).color : 'N/A',
      cardTitleColor: cardTitle ? window.getComputedStyle(cardTitle).color : 'N/A',
      clientBadgeColor: clientBadge ? window.getComputedStyle(clientBadge).color : 'N/A',
      clientBadgeBg: clientBadge ? window.getComputedStyle(clientBadge).backgroundColor : 'N/A',
      searchInputColor: searchInput ? window.getComputedStyle(searchInput).color : 'N/A',
      searchInputBg: searchInput ? window.getComputedStyle(searchInput).backgroundColor : 'N/A',
      emptyColumnStateColor: emptyColumnState ? window.getComputedStyle(emptyColumnState).color : 'N/A',
      colSubheaderColor: colSubheader ? window.getComputedStyle(colSubheader).color : 'N/A',
      fontFamily: h1 ? window.getComputedStyle(h1).fontFamily : 'N/A',
    };
  });

  console.log('[E2E] Dark Mode Computed Styles:\n', JSON.stringify(darkStyles, null, 2));

  const darkScreenshotPath = `${ARTIFACT_DIR}/projects_kanban_dark.png`;
  await page.screenshot({ path: darkScreenshotPath, fullPage: false });
  console.log(`[E2E] Saved Dark Mode screenshot to ${darkScreenshotPath}`);

  // Assertions for Dark Mode
  if (darkStyles.h1Color !== 'rgb(248, 250, 252)') {
    throw new Error(`Expected h1 to be slate-50 (rgb(248, 250, 252)), got: ${darkStyles.h1Color}`);
  }
  if (darkStyles.colHeaderColor !== 'rgb(248, 250, 252)') {
    throw new Error(`Expected column header to be slate-50 (rgb(248, 250, 252)), got: ${darkStyles.colHeaderColor}`);
  }
  if (darkStyles.cardTitleColor !== 'rgb(248, 250, 252)') {
    throw new Error(`Expected card title to be slate-50 (rgb(248, 250, 252)), got: ${darkStyles.cardTitleColor}`);
  }
  if (darkStyles.emptyColumnStateColor !== 'rgb(148, 163, 184)') {
    throw new Error(`Expected empty state text to be slate-400 (rgb(148, 163, 184)), got: ${darkStyles.emptyColumnStateColor}`);
  }
  console.log('✅ Dark mode color assertions PASSED');

  // 4. Multi-Route Navigation Check
  console.log('[E2E] Multi-Route verification (/projects/kanban → /projects → /dashboard)...');
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

    for (const route of ['/projects/kanban', '/projects', '/dashboard']) {
      await page.goto(`http://localhost:3000${route}`);
      await page.waitForTimeout(400);
      const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
      const expectedDark = theme === 'dark';
      if (isDark !== expectedDark) throw new Error(`Theme mismatch on ${route}: expected ${theme}`);
      console.log(`[E2E] Route ${route} verified in ${theme} mode (dark=${isDark})`);
    }
  }

  await browser.close();
  console.log('=== PROJECTS KANBAN BROWSER VERIFICATION COMPLETED SUCCESSFULLY ===');
  process.exit(0);
}

verifyProjectsKanban().catch((err) => {
  console.error('[E2E] FATAL ERROR:', err);
  process.exit(1);
});
