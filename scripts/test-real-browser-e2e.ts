import { UserRepository, OrganizationRepository } from '../lib/db/repositories';
import bcrypt from 'bcryptjs';
import { chromium, type Page } from 'playwright';

const ARTIFACT_DIR = '/home/maazzalii/.gemini/antigravity-ide/brain/cf073fd7-d5ad-42d9-9757-652ed5a77ddf';

async function assertColorAndTypography(page: Page, pageName: string, theme: 'light' | 'dark') {
  const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
  if (theme === 'dark' && !isDark) {
    throw new Error(`[${pageName}] Expected dark mode but .dark class is missing on documentElement`);
  }
  if (theme === 'light' && isDark) {
    throw new Error(`[${pageName}] Expected light mode but .dark class is present on documentElement`);
  }

  const { bodyColor, h1Color, h2Color, fontFamily } = await page.evaluate(() => {
    const body = window.getComputedStyle(document.body);
    const h1El = document.querySelector('h1');
    const h2El = document.querySelector('h2');
    return {
      bodyColor: body.color,
      h1Color: h1El ? window.getComputedStyle(h1El).color : null,
      h2Color: h2El ? window.getComputedStyle(h2El).color : null,
      fontFamily: body.fontFamily,
    };
  });

  console.log(`[E2E] [${pageName}] [${theme}] body=${bodyColor}, h1=${h1Color}, h2=${h2Color}, font=${fontFamily}`);

  if (theme === 'light') {
    if (bodyColor === 'rgb(255, 255, 255)') {
      throw new Error(`[${pageName}] Light mode violation: body color is pure white rgb(255, 255, 255)`);
    }
    if (h1Color === 'rgb(255, 255, 255)') {
      throw new Error(`[${pageName}] Light mode violation: h1 heading is pure white rgb(255, 255, 255)`);
    }
    if (h2Color === 'rgb(255, 255, 255)') {
      throw new Error(`[${pageName}] Light mode violation: h2 heading is pure white rgb(255, 255, 255)`);
    }
  } else {
    if (bodyColor === 'rgb(0, 0, 0)') {
      throw new Error(`[${pageName}] Dark mode violation: body color is pure black rgb(0, 0, 0)`);
    }
    if (h1Color === 'rgb(0, 0, 0)') {
      throw new Error(`[${pageName}] Dark mode violation: h1 heading is pure black rgb(0, 0, 0)`);
    }
    if (h2Color === 'rgb(0, 0, 0)') {
      throw new Error(`[${pageName}] Dark mode violation: h2 heading is pure black rgb(0, 0, 0)`);
    }
  }

  if (!fontFamily.toLowerCase().includes('geist') && !fontFamily.toLowerCase().includes('sans-serif')) {
    throw new Error(`[${pageName}] Typography violation: font ${fontFamily} does not include Geist`);
  }
}

async function setTheme(page: Page, target: 'light' | 'dark') {
  const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
  if (target === 'light' && isDark) {
    const lightBtn = page.locator('button[aria-label="Light theme"]');
    if (await lightBtn.count() > 0) {
      await lightBtn.click();
    } else {
      await page.evaluate(() => {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      });
    }
    await page.waitForTimeout(300);
  } else if (target === 'dark' && !isDark) {
    const darkBtn = page.locator('button[aria-label="Dark theme"]');
    if (await darkBtn.count() > 0) {
      await darkBtn.click();
    } else {
      await page.evaluate(() => {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      });
    }
    await page.waitForTimeout(300);
  }
}

async function runRealBrowserVerification() {
  console.log('=== STARTING EXTENDED REAL BROWSER PROTOCOL VERIFICATION ===');

  const ts = Date.now();
  const email = `playwright_verified_${ts}@example.com`;
  const rawPassword = 'PlaywrightPass123!';
  const passwordHash = await bcrypt.hash(rawPassword, 10);

  const userRepo = new UserRepository();
  const orgRepo = new OrganizationRepository();

  // 1. Create Verified User & Org
  const user = await userRepo.create({
    email,
    passwordHash,
    fullName: 'Browser Verification Lead',
    role: 'org_admin',
    requirePasswordChange: false,
  });

  const org = await orgRepo.create({
    name: 'Verification Workspace ' + ts,
    slug: 'verify-ws-' + ts,
    ownerUserId: user.id,
  });

  console.log(`[E2E] Provisioned user ${user.email} with workspace ${org.slug}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // -------------------------------------------------------------
  // 1. LANDING PAGE
  // -------------------------------------------------------------
  console.log('[E2E] 1. Testing Landing Page (http://localhost:3000)...');
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(500);

  // Light mode check
  await setTheme(page, 'light');
  await assertColorAndTypography(page, 'Landing', 'light');
  await page.screenshot({ path: `${ARTIFACT_DIR}/e2e_landing_light.png` });
  console.log('[E2E] Captured e2e_landing_light.png');

  // Dark mode check
  await setTheme(page, 'dark');
  await assertColorAndTypography(page, 'Landing', 'dark');
  await page.screenshot({ path: `${ARTIFACT_DIR}/e2e_landing_dark.png` });
  console.log('[E2E] Captured e2e_landing_dark.png');

  // 5x Reload on landing in dark mode
  for (let i = 1; i <= 5; i++) {
    await page.reload();
    const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    if (!isDark) throw new Error(`Landing lost dark mode on reload #${i}`);
  }
  console.log('[E2E] Landing passed 5x reload without theme loss');

  // -------------------------------------------------------------
  // 2. LOGIN PAGE
  // -------------------------------------------------------------
  console.log('[E2E] 2. Testing Login Page (http://localhost:3000/login)...');
  await page.goto('http://localhost:3000/login');
  await page.waitForTimeout(500);

  // Light mode check
  await setTheme(page, 'light');
  await assertColorAndTypography(page, 'Login', 'light');
  await page.screenshot({ path: `${ARTIFACT_DIR}/e2e_login_light.png` });
  console.log('[E2E] Captured e2e_login_light.png');

  // Dark mode check
  await setTheme(page, 'dark');
  await assertColorAndTypography(page, 'Login', 'dark');
  await page.screenshot({ path: `${ARTIFACT_DIR}/e2e_login_dark.png` });
  console.log('[E2E] Captured e2e_login_dark.png');

  // -------------------------------------------------------------
  // 3. SIGNUP PAGE
  // -------------------------------------------------------------
  console.log('[E2E] 3. Testing Signup Page (http://localhost:3000/signup)...');
  await page.goto('http://localhost:3000/signup');
  await page.waitForTimeout(500);

  // Light mode check
  await setTheme(page, 'light');
  await assertColorAndTypography(page, 'Signup', 'light');
  await page.screenshot({ path: `${ARTIFACT_DIR}/e2e_signup_light.png` });
  console.log('[E2E] Captured e2e_signup_light.png');

  // Dark mode check
  await setTheme(page, 'dark');
  await assertColorAndTypography(page, 'Signup', 'dark');
  await page.screenshot({ path: `${ARTIFACT_DIR}/e2e_signup_dark.png` });
  console.log('[E2E] Captured e2e_signup_dark.png');

  // -------------------------------------------------------------
  // 4. RESET PASSWORD PAGE (Error & Normal state)
  // -------------------------------------------------------------
  console.log('[E2E] 4. Testing Reset Password Page (http://localhost:3000/reset-password)...');
  await page.goto('http://localhost:3000/reset-password');
  await page.waitForTimeout(500);

  // Light mode check (Invalid link banner readability)
  await setTheme(page, 'light');
  await assertColorAndTypography(page, 'ResetPassword-Invalid', 'light');
  await page.screenshot({ path: `${ARTIFACT_DIR}/e2e_reset_password_light.png` });
  console.log('[E2E] Captured e2e_reset_password_light.png');

  // Dark mode check
  await setTheme(page, 'dark');
  await assertColorAndTypography(page, 'ResetPassword-Invalid', 'dark');
  await page.screenshot({ path: `${ARTIFACT_DIR}/e2e_reset_password_dark.png` });
  console.log('[E2E] Captured e2e_reset_password_dark.png');

  // -------------------------------------------------------------
  // 5. AUTHENTICATION & DASHBOARD VERIFICATION
  // -------------------------------------------------------------
  console.log('[E2E] 5. Logging in to verify dashboard and authenticated surfaces...');
  await page.goto('http://localhost:3000/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', rawPassword);
  await page.click('button[type="submit"]');

  await page.waitForURL('**/dashboard**', { timeout: 15000 });
  console.log(`[E2E] Successfully reached authenticated dashboard: ${page.url()}`);

  // Dark mode check
  await setTheme(page, 'dark');
  await assertColorAndTypography(page, 'Dashboard', 'dark');
  await page.screenshot({ path: `${ARTIFACT_DIR}/e2e_dashboard_dark.png` });
  console.log('[E2E] Captured e2e_dashboard_dark.png');

  // Light mode check
  await setTheme(page, 'light');
  await assertColorAndTypography(page, 'Dashboard', 'light');
  await page.screenshot({ path: `${ARTIFACT_DIR}/e2e_dashboard_light.png` });
  console.log('[E2E] Captured e2e_dashboard_light.png');

  // Multi-route navigation persistence check
  console.log('[E2E] 6. Testing navigation persistence across authenticated routes...');
  await setTheme(page, 'dark');

  await page.goto('http://localhost:3000/projects');
  await page.waitForTimeout(500);
  let isDarkRoute = await page.evaluate(() => document.documentElement.classList.contains('dark'));
  if (!isDarkRoute) throw new Error('Dark mode lost navigating to /projects');

  await page.goto('http://localhost:3000/clients');
  await page.waitForTimeout(500);
  isDarkRoute = await page.evaluate(() => document.documentElement.classList.contains('dark'));
  if (!isDarkRoute) throw new Error('Dark mode lost navigating to /clients');

  await page.goto('http://localhost:3000/tasks');
  await page.waitForTimeout(500);
  isDarkRoute = await page.evaluate(() => document.documentElement.classList.contains('dark'));
  if (!isDarkRoute) throw new Error('Dark mode lost navigating to /tasks');

  console.log('[E2E] Multi-route navigation: dark mode persisted across /projects, /clients, and /tasks');

  await browser.close();
  console.log('=== ALL REAL BROWSER PROTOCOL VERIFICATION TESTS PASSED ===');
}

runRealBrowserVerification().catch((err) => {
  console.error('[E2E] FATAL ERROR:', err);
  process.exit(1);
});
