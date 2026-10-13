import { UserRepository, OrganizationRepository } from '../lib/db/repositories';
import { query } from '../lib/db';
import bcrypt from 'bcryptjs';
import { chromium } from 'playwright';

const ARTIFACT_DIR = '/home/maazzalii/.gemini/antigravity-ide/brain/cf073fd7-d5ad-42d9-9757-652ed5a77ddf';

async function verifyProjectsList() {
  console.log('=== STARTING PROJECTS LIST (6B) BROWSER VERIFICATION ===');

  const ts = Date.now();
  const email = `proj_lead_${ts}@example.com`;
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
    name: 'Innoventix Agency ' + ts,
    slug: 'agency-ws-' + ts,
    ownerUserId: user.id,
  });

  console.log(`[E2E] Provisioned user ${user.email} with workspace ${org.slug}`);

  // Seed sample client
  const clientRes = await query<{ id: string }>(
    `INSERT INTO clients (organization_id, name, email, company)
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [org.id, 'Acme Global Corp', `acme_${ts}@example.com`, 'Acme Corp']
  );
  const clientId = clientRes.rows[0].id;

  // Seed sample projects with distinct statuses
  const projectsData = [
    { title: 'Website Redesign', status: 'planning', amount: 15000, desc: 'Enterprise website overhaul' },
    { title: 'Mobile App MVP', status: 'in_progress', amount: 35000, desc: 'iOS and Android client build' },
    { title: 'Brand Identity', status: 'review', amount: 8500, desc: 'Typography and design system tokens' },
    { title: 'SEO Growth Engine', status: 'delivered', amount: 12000, desc: 'Quarterly organic search campaign' },
    { title: 'Legacy Maintenance', status: 'archived', amount: 4500, desc: 'Archived backend maintenance contract' },
  ];

  for (const p of projectsData) {
    await query(
      `INSERT INTO projects (organization_id, client_id, title, description, status, amount, currency)
       VALUES ($1, $2, $3, $4, $5, $6, 'USD')`,
      [org.id, clientId, p.title, p.desc, p.status, p.amount]
    );
  }
  console.log('[E2E] Seeded 5 sample projects across various pipeline statuses');

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
  console.log('[E2E] Authenticated and navigating to /projects...');

  await page.goto('http://localhost:3000/projects');
  await page.waitForSelector('h1', { timeout: 10000 });
  await page.waitForSelector('table', { timeout: 10000 });
  console.log('[E2E] Navigated to /projects with table rendered');

  // 2. Measure LIGHT THEME
  console.log('[E2E] Configuring Light Mode...');
  await page.evaluate(() => {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  });
  await page.waitForTimeout(600);

  const lightStyles = await page.evaluate(() => {
    const h1 = document.querySelector('h1');
    const subtitle = document.querySelector('div.flex-col > p') || document.querySelector('p.text-muted-foreground');
    const statValues = Array.from(document.querySelectorAll('div.text-2xl.font-bold')).map(el => ({
      text: el.textContent?.trim(),
      color: window.getComputedStyle(el).color,
    }));
    const filterInput = document.querySelector('input[placeholder*="Search projects"]') as HTMLInputElement | null;
    const tableHeader = document.querySelector('thead th');
    const tableRowTitle = document.querySelector('tbody tr td div.font-semibold');
    const primaryBtn = document.querySelector('button.bg-primary') || document.querySelector('button:has-text("Create Project")');
    const badges = Array.from(document.querySelectorAll('tbody tr span.rounded-full')).map(el => ({
      label: el.textContent?.trim(),
      color: window.getComputedStyle(el).color,
      backgroundColor: window.getComputedStyle(el).backgroundColor,
      borderColor: window.getComputedStyle(el).borderColor,
    }));

    return {
      h1Color: h1 ? window.getComputedStyle(h1).color : 'N/A',
      subtitleColor: subtitle ? window.getComputedStyle(subtitle).color : 'N/A',
      statValues,
      filterInputColor: filterInput ? window.getComputedStyle(filterInput).color : 'N/A',
      filterInputBg: filterInput ? window.getComputedStyle(filterInput).backgroundColor : 'N/A',
      tableHeaderColor: tableHeader ? window.getComputedStyle(tableHeader).color : 'N/A',
      tableRowTitleColor: tableRowTitle ? window.getComputedStyle(tableRowTitle).color : 'N/A',
      primaryBtnColor: primaryBtn ? window.getComputedStyle(primaryBtn).color : 'N/A',
      primaryBtnBg: primaryBtn ? window.getComputedStyle(primaryBtn).backgroundColor : 'N/A',
      badges,
      fontFamily: h1 ? window.getComputedStyle(h1).fontFamily : 'N/A',
    };
  });

  console.log('[E2E] Light Mode Computed Styles:\n', JSON.stringify(lightStyles, null, 2));

  const lightScreenshotPath = `${ARTIFACT_DIR}/projects_list_light.png`;
  await page.screenshot({ path: lightScreenshotPath, fullPage: false });
  console.log(`[E2E] Saved Light Mode screenshot to ${lightScreenshotPath}`);

  // Assertions for Light Mode
  if (lightStyles.h1Color !== 'rgb(2, 8, 23)') {
    throw new Error(`Expected h1 to be slate-900 (rgb(2, 8, 23)), got: ${lightStyles.h1Color}`);
  }
  if (lightStyles.subtitleColor !== 'rgb(100, 116, 139)') {
    throw new Error(`Expected subtitle to be slate-500 (rgb(100, 116, 139)), got: ${lightStyles.subtitleColor}`);
  }
  if (lightStyles.tableRowTitleColor !== 'rgb(2, 8, 23)') {
    throw new Error(`Expected row title to be slate-900 (rgb(2, 8, 23)), got: ${lightStyles.tableRowTitleColor}`);
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
    const subtitle = document.querySelector('div.flex-col > p') || document.querySelector('p.text-muted-foreground');
    const statValues = Array.from(document.querySelectorAll('div.text-2xl.font-bold')).map(el => ({
      text: el.textContent?.trim(),
      color: window.getComputedStyle(el).color,
    }));
    const filterInput = document.querySelector('input[placeholder*="Search projects"]') as HTMLInputElement | null;
    const tableHeader = document.querySelector('thead th');
    const tableRowTitle = document.querySelector('tbody tr td div.font-semibold');
    const primaryBtn = document.querySelector('button.bg-primary') || document.querySelector('button:has-text("Create Project")');
    const badges = Array.from(document.querySelectorAll('tbody tr span.rounded-full')).map(el => ({
      label: el.textContent?.trim(),
      color: window.getComputedStyle(el).color,
      backgroundColor: window.getComputedStyle(el).backgroundColor,
      borderColor: window.getComputedStyle(el).borderColor,
    }));

    return {
      h1Color: h1 ? window.getComputedStyle(h1).color : 'N/A',
      subtitleColor: subtitle ? window.getComputedStyle(subtitle).color : 'N/A',
      statValues,
      filterInputColor: filterInput ? window.getComputedStyle(filterInput).color : 'N/A',
      filterInputBg: filterInput ? window.getComputedStyle(filterInput).backgroundColor : 'N/A',
      tableHeaderColor: tableHeader ? window.getComputedStyle(tableHeader).color : 'N/A',
      tableRowTitleColor: tableRowTitle ? window.getComputedStyle(tableRowTitle).color : 'N/A',
      primaryBtnColor: primaryBtn ? window.getComputedStyle(primaryBtn).color : 'N/A',
      primaryBtnBg: primaryBtn ? window.getComputedStyle(primaryBtn).backgroundColor : 'N/A',
      badges,
      fontFamily: h1 ? window.getComputedStyle(h1).fontFamily : 'N/A',
    };
  });

  console.log('[E2E] Dark Mode Computed Styles:\n', JSON.stringify(darkStyles, null, 2));

  const darkScreenshotPath = `${ARTIFACT_DIR}/projects_list_dark.png`;
  await page.screenshot({ path: darkScreenshotPath, fullPage: false });
  console.log(`[E2E] Saved Dark Mode screenshot to ${darkScreenshotPath}`);

  // Assertions for Dark Mode
  if (darkStyles.h1Color !== 'rgb(248, 250, 252)') {
    throw new Error(`Expected h1 to be slate-50 (rgb(248, 250, 252)), got: ${darkStyles.h1Color}`);
  }
  if (darkStyles.subtitleColor !== 'rgb(148, 163, 184)') {
    throw new Error(`Expected subtitle to be slate-400 (rgb(148, 163, 184)), got: ${darkStyles.subtitleColor}`);
  }
  if (darkStyles.tableRowTitleColor !== 'rgb(248, 250, 252)') {
    throw new Error(`Expected row title to be slate-50 (rgb(248, 250, 252)), got: ${darkStyles.tableRowTitleColor}`);
  }
  console.log('✅ Dark mode color assertions PASSED');

  // 4. Multi-Route Navigation Check
  console.log('[E2E] Multi-Route verification (/projects → /projects/kanban → /dashboard)...');
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

    for (const route of ['/projects', '/projects/kanban', '/dashboard']) {
      await page.goto(`http://localhost:3000${route}`);
      await page.waitForTimeout(400);
      const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
      const expectedDark = theme === 'dark';
      if (isDark !== expectedDark) throw new Error(`Theme mismatch on ${route}: expected ${theme}`);
      console.log(`[E2E] Route ${route} verified in ${theme} mode (dark=${isDark})`);
    }
  }

  await browser.close();
  console.log('=== PROJECTS LIST BROWSER VERIFICATION COMPLETED SUCCESSFULLY ===');
  process.exit(0);
}

verifyProjectsList().catch((err) => {
  console.error('[E2E] FATAL ERROR:', err);
  process.exit(1);
});
