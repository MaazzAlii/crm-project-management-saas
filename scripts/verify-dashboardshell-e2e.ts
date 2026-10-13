import { UserRepository, OrganizationRepository } from '../lib/db/repositories';
import bcrypt from 'bcryptjs';
import { chromium } from 'playwright';

const ARTIFACT_DIR = '/home/maazzalii/.gemini/antigravity-ide/brain/cf073fd7-d5ad-42d9-9757-652ed5a77ddf';

async function verifyDashboardShell() {
  console.log('=== STARTING DASHBOARD SHELL BROWSER VERIFICATION ===');

  const ts = Date.now();
  const email = `shell_verify_${ts}@example.com`;
  const rawPassword = 'PlaywrightPass123!';
  const passwordHash = await bcrypt.hash(rawPassword, 10);

  const userRepo = new UserRepository();
  const orgRepo = new OrganizationRepository();

  const user = await userRepo.create({
    email,
    passwordHash,
    fullName: 'Shell Verification Lead',
    role: 'org_admin',
    requirePasswordChange: false,
  });

  const org = await orgRepo.create({
    name: 'Innoventix Shell Test ' + ts,
    slug: 'shell-ws-' + ts,
    ownerUserId: user.id,
  });

  console.log(`[E2E] Provisioned user ${user.email} with workspace ${org.slug}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // 1. Login
  console.log('[E2E] Logging in...');
  await page.goto('http://localhost:3000/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', rawPassword);
  await page.click('button[type="submit"]');

  await page.waitForURL('**/dashboard**', { timeout: 15000 });
  console.log('[E2E] Authenticated and navigated to /dashboard');

  const shellRegionLocator = page.locator('div.flex-1.flex-col').first();
  await shellRegionLocator.waitFor({ state: 'visible', timeout: 5000 });

  // 2. Set Light Theme
  console.log('[E2E] Setting Light Theme...');
  await page.evaluate(() => {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  });
  await page.waitForTimeout(500);

  // Measure computed styles in Light Mode
  const lightStyles = await page.evaluate(() => {
    const shellRoot = document.querySelector('div.min-h-screen');
    const h1 = document.querySelector('h1');
    const bodyP = document.querySelector('div.space-y-8 p') || document.querySelector('main p');
    const badge = document.querySelector('span.bg-sky-500\\/10') || document.querySelector('header span');
    const actionBtn = document.querySelector('a[href*="/clients?action=new"]') || document.querySelector('main button');

    return {
      shellRootColor: shellRoot ? window.getComputedStyle(shellRoot).color : 'N/A',
      shellRootBg: shellRoot ? window.getComputedStyle(shellRoot).backgroundColor : 'N/A',
      pageTitleH1Color: h1 ? window.getComputedStyle(h1).color : 'N/A',
      bodyParagraphColor: bodyP ? window.getComputedStyle(bodyP).color : 'N/A',
      badgeOrBreadcrumbColor: badge ? window.getComputedStyle(badge).color : 'N/A',
      actionButtonColor: actionBtn ? window.getComputedStyle(actionBtn).color : 'N/A',
      actionButtonBg: actionBtn ? window.getComputedStyle(actionBtn).backgroundColor : 'N/A',
      fontFamily: h1 ? window.getComputedStyle(h1).fontFamily : 'N/A',
    };
  });

  console.log('[E2E] Light Mode Computed Styles:\n', JSON.stringify(lightStyles, null, 2));

  // Screenshot DashboardShell Region Light Mode
  const lightScreenshotPath = `${ARTIFACT_DIR}/dashboardshell_light.png`;
  await shellRegionLocator.screenshot({ path: lightScreenshotPath });
  console.log(`[E2E] Saved Light Mode DashboardShell screenshot to ${lightScreenshotPath}`);

  // 3. Set Dark Theme
  console.log('[E2E] Setting Dark Theme...');
  await page.evaluate(() => {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  });
  await page.waitForTimeout(500);

  // Measure computed styles in Dark Mode
  const darkStyles = await page.evaluate(() => {
    const shellRoot = document.querySelector('div.min-h-screen');
    const h1 = document.querySelector('h1');
    const bodyP = document.querySelector('div.space-y-8 p') || document.querySelector('main p');
    const badge = document.querySelector('span.bg-sky-500\\/10') || document.querySelector('header span');
    const actionBtn = document.querySelector('a[href*="/clients?action=new"]') || document.querySelector('main button');

    return {
      shellRootColor: shellRoot ? window.getComputedStyle(shellRoot).color : 'N/A',
      shellRootBg: shellRoot ? window.getComputedStyle(shellRoot).backgroundColor : 'N/A',
      pageTitleH1Color: h1 ? window.getComputedStyle(h1).color : 'N/A',
      bodyParagraphColor: bodyP ? window.getComputedStyle(bodyP).color : 'N/A',
      badgeOrBreadcrumbColor: badge ? window.getComputedStyle(badge).color : 'N/A',
      actionButtonColor: actionBtn ? window.getComputedStyle(actionBtn).color : 'N/A',
      actionButtonBg: actionBtn ? window.getComputedStyle(actionBtn).backgroundColor : 'N/A',
      fontFamily: h1 ? window.getComputedStyle(h1).fontFamily : 'N/A',
    };
  });

  console.log('[E2E] Dark Mode Computed Styles:\n', JSON.stringify(darkStyles, null, 2));

  // Screenshot DashboardShell Region Dark Mode
  const darkScreenshotPath = `${ARTIFACT_DIR}/dashboardshell_dark.png`;
  await shellRegionLocator.screenshot({ path: darkScreenshotPath });
  console.log(`[E2E] Saved Dark Mode DashboardShell screenshot to ${darkScreenshotPath}`);

  // 4. Multi-Route Navigation Check: /dashboard -> /projects -> /clients in Light Mode
  console.log('[E2E] Multi-Route verification in Light Mode...');
  await page.evaluate(() => {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  });

  for (const route of ['/dashboard', '/projects', '/clients']) {
    await page.goto(`http://localhost:3000${route}`);
    await page.waitForTimeout(500);
    const shellExists = await page.locator('div.flex-1.flex-col').first().isVisible();
    const topbarExists = await page.locator('header').isVisible();
    const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    if (!shellExists || !topbarExists) throw new Error(`Shell chrome not rendered on ${route} in Light mode`);
    if (isDark) throw new Error(`Light mode lost on route ${route}`);
    console.log(`[E2E] Route ${route} passed shell verification in Light Mode`);
  }

  // 5. Multi-Route Navigation Check: /dashboard -> /projects -> /clients in Dark Mode
  console.log('[E2E] Multi-Route verification in Dark Mode...');
  await page.evaluate(() => {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  });

  for (const route of ['/dashboard', '/projects', '/clients']) {
    await page.goto(`http://localhost:3000${route}`);
    await page.waitForTimeout(500);
    const shellExists = await page.locator('div.flex-1.flex-col').first().isVisible();
    const topbarExists = await page.locator('header').isVisible();
    const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    if (!shellExists || !topbarExists) throw new Error(`Shell chrome not rendered on ${route} in Dark mode`);
    if (!isDark) throw new Error(`Dark mode lost on route ${route}`);
    console.log(`[E2E] Route ${route} passed shell verification in Dark Mode`);
  }

  await browser.close();
  console.log('=== DASHBOARD SHELL BROWSER VERIFICATION COMPLETED SUCCESSFULLY ===');
}

verifyDashboardShell().catch((err) => {
  console.error('[E2E] FATAL ERROR:', err);
  process.exit(1);
});
