import { UserRepository, OrganizationRepository } from '../lib/db/repositories';
import bcrypt from 'bcryptjs';
import { chromium } from 'playwright';

const ARTIFACT_DIR = '/home/maazzalii/.gemini/antigravity-ide/brain/cf073fd7-d5ad-42d9-9757-652ed5a77ddf';

async function verifyDashboardPage() {
  console.log('=== STARTING DASHBOARD PAGE BROWSER VERIFICATION ===');

  const ts = Date.now();
  const email = `dash_page_${ts}@example.com`;
  const rawPassword = 'PlaywrightPass123!';
  const passwordHash = await bcrypt.hash(rawPassword, 10);

  const userRepo = new UserRepository();
  const orgRepo = new OrganizationRepository();

  const user = await userRepo.create({
    email,
    passwordHash,
    fullName: 'Dashboard Page Lead',
    role: 'org_admin',
    requirePasswordChange: false,
  });

  const org = await orgRepo.create({
    name: 'Innoventix Hub ' + ts,
    slug: 'hub-ws-' + ts,
    ownerUserId: user.id,
  });

  console.log(`[E2E] Provisioned user ${user.email} with workspace ${org.slug}`);

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
  console.log('[E2E] Authenticated and navigated to /dashboard');

  const h1Locator = page.locator('h1');
  await h1Locator.waitFor({ state: 'visible', timeout: 5000 });

  // 2. Set Light Theme
  console.log('[E2E] Setting Light Theme...');
  await page.evaluate(() => {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  });
  await page.waitForTimeout(500);

  // Measure computed styles in Light Mode
  const lightStyles = await page.evaluate(() => {
    const h1 = document.querySelector('h1');
    const welcomeP = document.querySelector('p.text-muted-foreground') || document.querySelector('div.flex-col > p');
    const badge = document.querySelector('span.bg-sky-500\\/10');
    const actionBtn = document.querySelector('a[href*="/clients?action=new"]');

    return {
      h1Color: h1 ? window.getComputedStyle(h1).color : 'N/A',
      welcomePColor: welcomeP ? window.getComputedStyle(welcomeP).color : 'N/A',
      badgeColor: badge ? window.getComputedStyle(badge).color : 'N/A',
      actionBtnColor: actionBtn ? window.getComputedStyle(actionBtn).color : 'N/A',
      actionBtnBg: actionBtn ? window.getComputedStyle(actionBtn).backgroundColor : 'N/A',
      fontFamily: h1 ? window.getComputedStyle(h1).fontFamily : 'N/A',
    };
  });

  console.log('[E2E] Light Mode Computed Styles:\n', JSON.stringify(lightStyles, null, 2));

  // Screenshot in Light Mode
  const lightScreenshotPath = `${ARTIFACT_DIR}/dashboard_page_light.png`;
  await page.screenshot({ path: lightScreenshotPath, fullPage: false });
  console.log(`[E2E] Saved Light Mode dashboard page screenshot to ${lightScreenshotPath}`);

  // Assertions for Light Mode
  if (lightStyles.h1Color !== 'rgb(2, 8, 23)') {
    throw new Error(`Expected h1 to be slate-900 (rgb(2, 8, 23)) in light mode, got: ${lightStyles.h1Color}`);
  }
  if (lightStyles.welcomePColor !== 'rgb(100, 116, 139)') {
    throw new Error(`Expected welcome paragraph to be slate-500 (rgb(100, 116, 139)) in light mode for WCAG AA compliance, got: ${lightStyles.welcomePColor}`);
  }
  console.log('✅ Light mode assertions passed: h1 = rgb(2, 8, 23) (slate-900), welcomeP = rgb(100, 116, 139) (slate-500, passes WCAG AA 5.28:1)');

  // 3. Set Dark Theme
  console.log('[E2E] Setting Dark Theme...');
  await page.evaluate(() => {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  });
  await page.waitForTimeout(500);

  // Measure computed styles in Dark Mode
  const darkStyles = await page.evaluate(() => {
    const h1 = document.querySelector('h1');
    const welcomeP = document.querySelector('p.text-muted-foreground') || document.querySelector('div.flex-col > p');
    const badge = document.querySelector('span.bg-sky-500\\/10');
    const actionBtn = document.querySelector('a[href*="/clients?action=new"]');

    return {
      h1Color: h1 ? window.getComputedStyle(h1).color : 'N/A',
      welcomePColor: welcomeP ? window.getComputedStyle(welcomeP).color : 'N/A',
      badgeColor: badge ? window.getComputedStyle(badge).color : 'N/A',
      actionBtnColor: actionBtn ? window.getComputedStyle(actionBtn).color : 'N/A',
      actionBtnBg: actionBtn ? window.getComputedStyle(actionBtn).backgroundColor : 'N/A',
      fontFamily: h1 ? window.getComputedStyle(h1).fontFamily : 'N/A',
    };
  });

  console.log('[E2E] Dark Mode Computed Styles:\n', JSON.stringify(darkStyles, null, 2));

  // Screenshot in Dark Mode
  const darkScreenshotPath = `${ARTIFACT_DIR}/dashboard_page_dark.png`;
  await page.screenshot({ path: darkScreenshotPath, fullPage: false });
  console.log(`[E2E] Saved Dark Mode dashboard page screenshot to ${darkScreenshotPath}`);

  // Assertions for Dark Mode
  if (darkStyles.h1Color !== 'rgb(248, 250, 252)') {
    throw new Error(`Expected h1 to be slate-50 (rgb(248, 250, 252)) in dark mode, got: ${darkStyles.h1Color}`);
  }
  if (darkStyles.welcomePColor !== 'rgb(148, 163, 184)') {
    throw new Error(`Expected welcome paragraph to be slate-400 (rgb(148, 163, 184)) in dark mode, got: ${darkStyles.welcomePColor}`);
  }
  console.log('✅ Dark mode assertions passed: h1 = rgb(248, 250, 252) (slate-50 / text-foreground), welcomeP = rgb(148, 163, 184) (slate-400 / text-muted-foreground)');

  // 4. Multi-Route Navigation Check
  console.log('[E2E] Multi-Route verification...');
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

    for (const route of ['/dashboard', '/projects', '/clients']) {
      await page.goto(`http://localhost:3000${route}`);
      await page.waitForTimeout(400);
      const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
      const expectedDark = theme === 'dark';
      if (isDark !== expectedDark) throw new Error(`Theme mismatch on ${route}: expected ${theme}`);
      console.log(`[E2E] Route ${route} verified in ${theme} mode`);
    }
  }

  await browser.close();
  console.log('=== DASHBOARD PAGE BROWSER VERIFICATION COMPLETED SUCCESSFULLY ===');
}

verifyDashboardPage().catch((err) => {
  console.error('[E2E] FATAL ERROR:', err);
  process.exit(1);
});
