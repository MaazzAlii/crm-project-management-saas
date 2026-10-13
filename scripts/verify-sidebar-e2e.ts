import { UserRepository, OrganizationRepository } from '../lib/db/repositories';
import bcrypt from 'bcryptjs';
import { chromium } from 'playwright';

const ARTIFACT_DIR = '/home/maazzalii/.gemini/antigravity-ide/brain/cf073fd7-d5ad-42d9-9757-652ed5a77ddf';

async function verifySidebar() {
  console.log('=== STARTING SIDEBAR BROWSER VERIFICATION ===');

  const ts = Date.now();
  const email = `sidebar_verify_${ts}@example.com`;
  const rawPassword = 'PlaywrightPass123!';
  const passwordHash = await bcrypt.hash(rawPassword, 10);

  const userRepo = new UserRepository();
  const orgRepo = new OrganizationRepository();

  const user = await userRepo.create({
    email,
    passwordHash,
    fullName: 'Sidebar Verification Lead',
    role: 'org_admin',
    requirePasswordChange: false,
  });

  const org = await orgRepo.create({
    name: 'Sidebar Test Workspace ' + ts,
    slug: 'sidebar-ws-' + ts,
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

  const sidebarLocator = page.locator('aside');
  await sidebarLocator.waitFor({ state: 'visible', timeout: 5000 });

  // 2. Set Light Theme
  console.log('[E2E] Setting Light Theme...');
  await page.evaluate(() => {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  });
  await page.waitForTimeout(400);

  // Measure computed styles in Light Mode
  const lightStyles = await page.evaluate(() => {
    const brand = document.querySelector('aside span.font-extrabold');
    const subtitle = document.querySelector('aside span.text-\\[10px\\]');
    const activeNav = document.querySelector('aside a.bg-sky-50');
    const activeNavText = activeNav?.querySelector('span');
    const activeNavIcon = activeNav?.querySelector('svg');
    const inactiveNav = document.querySelector('aside a:not(.bg-sky-50)');
    const inactiveNavText = inactiveNav?.querySelector('span');
    const inactiveNavIcon = inactiveNav?.querySelector('svg');
    const proCardTitle = document.querySelector('aside .font-semibold.text-foreground');
    const proCardText = document.querySelector('aside p.text-\\[11px\\]');

    return {
      brandColor: brand ? window.getComputedStyle(brand).color : 'N/A',
      subtitleColor: subtitle ? window.getComputedStyle(subtitle).color : 'N/A',
      activeNavTextColor: activeNavText ? window.getComputedStyle(activeNavText).color : 'N/A',
      activeNavIconColor: activeNavIcon ? window.getComputedStyle(activeNavIcon).color : 'N/A',
      inactiveNavTextColor: inactiveNavText ? window.getComputedStyle(inactiveNavText).color : 'N/A',
      inactiveNavIconColor: inactiveNavIcon ? window.getComputedStyle(inactiveNavIcon).color : 'N/A',
      proCardTitleColor: proCardTitle ? window.getComputedStyle(proCardTitle).color : 'N/A',
      proCardTextColor: proCardText ? window.getComputedStyle(proCardText).color : 'N/A',
      fontFamily: brand ? window.getComputedStyle(brand).fontFamily : 'N/A',
    };
  });

  console.log('[E2E] Light Mode Computed Styles:', JSON.stringify(lightStyles, null, 2));

  // Screenshot Sidebar Light Mode
  const lightScreenshotPath = `${ARTIFACT_DIR}/sidebar_light.png`;
  await sidebarLocator.screenshot({ path: lightScreenshotPath });
  console.log(`[E2E] Saved Light Mode Sidebar screenshot to ${lightScreenshotPath}`);

  // 3. Set Dark Theme
  console.log('[E2E] Setting Dark Theme...');
  await page.evaluate(() => {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  });
  await page.waitForTimeout(400);

  // Measure computed styles in Dark Mode
  const darkStyles = await page.evaluate(() => {
    const brand = document.querySelector('aside span.font-extrabold');
    const subtitle = document.querySelector('aside span.text-\\[10px\\]');
    const activeNav = document.querySelector('aside a[class*="dark:bg-sky-600"]');
    const activeNavText = activeNav?.querySelector('span');
    const activeNavIcon = activeNav?.querySelector('svg');
    const inactiveNav = document.querySelector('aside a:not([class*="dark:bg-sky-600"])');
    const inactiveNavText = inactiveNav?.querySelector('span');
    const inactiveNavIcon = inactiveNav?.querySelector('svg');
    const proCardTitle = document.querySelector('aside .font-semibold.text-foreground');
    const proCardText = document.querySelector('aside p.text-\\[11px\\]');

    return {
      brandColor: brand ? window.getComputedStyle(brand).color : 'N/A',
      subtitleColor: subtitle ? window.getComputedStyle(subtitle).color : 'N/A',
      activeNavTextColor: activeNavText ? window.getComputedStyle(activeNavText).color : 'N/A',
      activeNavIconColor: activeNavIcon ? window.getComputedStyle(activeNavIcon).color : 'N/A',
      inactiveNavTextColor: inactiveNavText ? window.getComputedStyle(inactiveNavText).color : 'N/A',
      inactiveNavIconColor: inactiveNavIcon ? window.getComputedStyle(inactiveNavIcon).color : 'N/A',
      proCardTitleColor: proCardTitle ? window.getComputedStyle(proCardTitle).color : 'N/A',
      proCardTextColor: proCardText ? window.getComputedStyle(proCardText).color : 'N/A',
      fontFamily: brand ? window.getComputedStyle(brand).fontFamily : 'N/A',
    };
  });

  console.log('[E2E] Dark Mode Computed Styles:', JSON.stringify(darkStyles, null, 2));

  // Screenshot Sidebar Dark Mode
  const darkScreenshotPath = `${ARTIFACT_DIR}/sidebar_dark.png`;
  await sidebarLocator.screenshot({ path: darkScreenshotPath });
  console.log(`[E2E] Saved Dark Mode Sidebar screenshot to ${darkScreenshotPath}`);

  // 4. Verify 3 Routes in Light Mode
  console.log('[E2E] Verifying 3 routes in Light Mode (/dashboard -> /projects -> /clients)...');
  await page.evaluate(() => {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  });

  for (const route of ['/dashboard', '/projects', '/clients']) {
    await page.goto(`http://localhost:3000${route}`);
    await page.waitForTimeout(500);
    const visible = await page.locator('aside').isVisible();
    const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    if (!visible) throw new Error(`Sidebar not visible on ${route} in Light mode`);
    if (isDark) throw new Error(`Light mode lost on ${route}`);
    console.log(`[E2E] Route ${route} rendered sidebar properly in Light Mode`);
  }

  // 5. Verify 3 Routes in Dark Mode
  console.log('[E2E] Verifying 3 routes in Dark Mode (/dashboard -> /projects -> /clients)...');
  await page.evaluate(() => {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  });

  for (const route of ['/dashboard', '/projects', '/clients']) {
    await page.goto(`http://localhost:3000${route}`);
    await page.waitForTimeout(500);
    const visible = await page.locator('aside').isVisible();
    const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    if (!visible) throw new Error(`Sidebar not visible on ${route} in Dark mode`);
    if (!isDark) throw new Error(`Dark mode lost on ${route}`);
    console.log(`[E2E] Route ${route} rendered sidebar properly in Dark Mode`);
  }

  await browser.close();
  console.log('=== SIDEBAR BROWSER VERIFICATION COMPLETED SUCCESSFULLY ===');
}

verifySidebar().catch((err) => {
  console.error('[E2E] FATAL ERROR:', err);
  process.exit(1);
});
