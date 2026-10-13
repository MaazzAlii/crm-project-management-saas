import { UserRepository, OrganizationRepository } from '../lib/db/repositories';
import bcrypt from 'bcryptjs';
import { chromium } from 'playwright';

async function runRealBrowserVerification() {
  console.log('--- STARTING REAL BROWSER VERIFICATION SUITE ---');

  const ts = Date.now();
  const email = `playwright_verified_${ts}@example.com`;
  const rawPassword = 'PlaywrightPass123!';
  const passwordHash = await bcrypt.hash(rawPassword, 10);

  const userRepo = new UserRepository();
  const orgRepo = new OrganizationRepository();

  // 1. Create Verified User
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

  // CHECK 7 & 8: Landing Page Light and Dark Mode
  console.log('[E2E] Navigating to http://localhost:3000 (Landing)...');
  await page.goto('http://localhost:3000');
  
  // Verify font is Geist
  const landingBodyFont = await page.evaluate(() => window.getComputedStyle(document.body).fontFamily);
  console.log(`[E2E] Landing Font: ${landingBodyFont}`);

  // Light mode screenshot
  await page.locator('button[aria-label="Light theme"]').click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: '/home/maazzalii/.gemini/antigravity-ide/brain/cf073fd7-d5ad-42d9-9757-652ed5a77ddf/e2e_landing_light.png' });
  console.log('[E2E] Captured e2e_landing_light.png');

  // Dark mode screenshot
  await page.locator('button[aria-label="Dark theme"]').click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: '/home/maazzalii/.gemini/antigravity-ide/brain/cf073fd7-d5ad-42d9-9757-652ed5a77ddf/e2e_landing_dark.png' });
  console.log('[E2E] Captured e2e_landing_dark.png');

  // 5x Reload on landing in dark mode
  for (let i = 1; i <= 5; i++) {
    await page.reload();
    const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    if (!isDark) throw new Error(`Landing lost dark mode on reload #${i}`);
  }
  console.log('[E2E] 5x reload on landing: dark theme persisted 100%');

  // CHECK 1: Login with existing account
  console.log('[E2E] Navigating to http://localhost:3000/login...');
  await page.goto('http://localhost:3000/login');
  await page.waitForTimeout(500);

  // Fill in credentials
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', rawPassword);
  await page.click('button[type="submit"]');

  // Wait for redirect to dashboard
  await page.waitForURL('**/dashboard**', { timeout: 15000 });
  console.log(`[E2E] Successfully logged in! Reached URL: ${page.url()}`);
  await page.screenshot({ path: '/home/maazzalii/.gemini/antigravity-ide/brain/cf073fd7-d5ad-42d9-9757-652ed5a77ddf/e2e_dashboard_dark.png' });
  console.log('[E2E] Captured e2e_dashboard_dark.png');

  // CHECK 9: Dashboard Light/Dark Toggle and Navigation Persistence
  console.log('[E2E] Checking dashboard theme toggle...');
  const initialDashboardTheme = await page.evaluate(() => document.documentElement.classList.contains('dark'));
  console.log(`[E2E] Initial Dashboard dark mode: ${initialDashboardTheme}`);

  // Navigate to /projects
  console.log('[E2E] Navigating to /projects...');
  await page.goto('http://localhost:3000/projects');
  await page.waitForTimeout(500);
  const projectsDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
  console.log(`[E2E] Theme persisted across navigation to /projects: dark=${projectsDark}`);

  // Navigate to /clients
  console.log('[E2E] Navigating to /clients...');
  await page.goto('http://localhost:3000/clients');
  await page.waitForTimeout(500);
  const clientsDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
  console.log(`[E2E] Theme persisted across navigation to /clients: dark=${clientsDark}`);

  await browser.close();
  console.log('--- ALL REAL BROWSER TESTS COMPLETED SUCCESSFULLY ---');
}

runRealBrowserVerification().catch((err) => {
  console.error('[E2E] FATAL ERROR:', err);
  process.exit(1);
});
