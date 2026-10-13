import { UserRepository, OrganizationRepository } from '../lib/db/repositories';
import bcrypt from 'bcryptjs';
import { chromium } from 'playwright';

const ARTIFACT_DIR = '/home/maazzalii/.gemini/antigravity-ide/brain/cf073fd7-d5ad-42d9-9757-652ed5a77ddf';

async function verifyDashboardCards() {
  console.log('=== STARTING DASHBOARD CARDS BROWSER VERIFICATION ===');

  const ts = Date.now();
  const email = `cards_verify_${ts}@example.com`;
  const rawPassword = 'PlaywrightPass123!';
  const passwordHash = await bcrypt.hash(rawPassword, 10);

  const userRepo = new UserRepository();
  const orgRepo = new OrganizationRepository();

  const user = await userRepo.create({
    email,
    passwordHash,
    fullName: 'Cards Verification Lead',
    role: 'org_admin',
    requirePasswordChange: false,
  });

  const org = await orgRepo.create({
    name: 'Theme Consistency Workspace ' + ts,
    slug: 'theme-ws-' + ts,
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

  const teamCard = page.locator('[data-testid="dashboard-team-card"]');
  const invitesCard = page.locator('[data-testid="dashboard-invitations-card"]');
  await teamCard.waitFor({ state: 'visible', timeout: 5000 });
  await invitesCard.waitFor({ state: 'visible', timeout: 5000 });

  // 2. Set Light Theme
  console.log('[E2E] Setting Light Theme...');
  await page.evaluate(() => {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  });
  await page.waitForTimeout(500);

  // Measure computed styles in Light Mode
  const lightStyles = await page.evaluate(() => {
    const team = document.querySelector('[data-testid="dashboard-team-card"]');
    const teamTitle = team?.querySelector('h3');
    const invites = document.querySelector('[data-testid="dashboard-invitations-card"]');
    const invitesTitle = invites?.querySelector('h3');
    const teamItem = team?.querySelector('.rounded-xl.border');

    return {
      teamCardBg: team ? window.getComputedStyle(team).backgroundColor : 'N/A',
      teamCardBorder: team ? window.getComputedStyle(team).borderColor : 'N/A',
      teamCardTitleColor: teamTitle ? window.getComputedStyle(teamTitle).color : 'N/A',
      teamItemBg: teamItem ? window.getComputedStyle(teamItem).backgroundColor : 'N/A',
      invitesCardBg: invites ? window.getComputedStyle(invites).backgroundColor : 'N/A',
      invitesCardBorder: invites ? window.getComputedStyle(invites).borderColor : 'N/A',
      invitesCardTitleColor: invitesTitle ? window.getComputedStyle(invitesTitle).color : 'N/A',
      htmlBg: window.getComputedStyle(document.body).backgroundColor,
    };
  });

  console.log('[E2E] Light Mode Computed Styles:\n', JSON.stringify(lightStyles, null, 2));

  // Screenshot in Light Mode
  const lightScreenshotPath = `${ARTIFACT_DIR}/dashboard_cards_light.png`;
  await page.screenshot({ path: lightScreenshotPath, fullPage: false });
  console.log(`[E2E] Saved Light Mode dashboard screenshot to ${lightScreenshotPath}`);

  // Assertions for Light Mode
  if (lightStyles.teamCardBg !== 'rgb(255, 255, 255)') {
    throw new Error(`Expected team card to be white in light mode, got: ${lightStyles.teamCardBg}`);
  }
  if (lightStyles.invitesCardBg !== 'rgb(255, 255, 255)') {
    throw new Error(`Expected invites card to be white in light mode, got: ${lightStyles.invitesCardBg}`);
  }
  console.log('✅ Light mode assertion passed: both cards are pure white (rgb(255, 255, 255))');

  // 3. Set Dark Theme
  console.log('[E2E] Setting Dark Theme...');
  await page.evaluate(() => {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  });
  await page.waitForTimeout(500);

  // Measure computed styles in Dark Mode
  const darkStyles = await page.evaluate(() => {
    const team = document.querySelector('[data-testid="dashboard-team-card"]');
    const teamTitle = team?.querySelector('h3');
    const invites = document.querySelector('[data-testid="dashboard-invitations-card"]');
    const invitesTitle = invites?.querySelector('h3');
    const teamItem = team?.querySelector('.rounded-xl.border');

    return {
      teamCardBg: team ? window.getComputedStyle(team).backgroundColor : 'N/A',
      teamCardBorder: team ? window.getComputedStyle(team).borderColor : 'N/A',
      teamCardTitleColor: teamTitle ? window.getComputedStyle(teamTitle).color : 'N/A',
      teamItemBg: teamItem ? window.getComputedStyle(teamItem).backgroundColor : 'N/A',
      invitesCardBg: invites ? window.getComputedStyle(invites).backgroundColor : 'N/A',
      invitesCardBorder: invites ? window.getComputedStyle(invites).borderColor : 'N/A',
      invitesCardTitleColor: invitesTitle ? window.getComputedStyle(invitesTitle).color : 'N/A',
      htmlBg: window.getComputedStyle(document.body).backgroundColor,
    };
  });

  console.log('[E2E] Dark Mode Computed Styles:\n', JSON.stringify(darkStyles, null, 2));

  // Screenshot in Dark Mode
  const darkScreenshotPath = `${ARTIFACT_DIR}/dashboard_cards_dark.png`;
  await page.screenshot({ path: darkScreenshotPath, fullPage: false });
  console.log(`[E2E] Saved Dark Mode dashboard screenshot to ${darkScreenshotPath}`);

  // Assertions for Dark Mode
  if (darkStyles.teamCardBg !== 'rgb(15, 23, 42)') {
    throw new Error(`Expected team card to be slate-900 in dark mode, got: ${darkStyles.teamCardBg}`);
  }
  if (darkStyles.invitesCardBg !== 'rgb(15, 23, 42)') {
    throw new Error(`Expected invites card to be slate-900 in dark mode, got: ${darkStyles.invitesCardBg}`);
  }
  console.log('✅ Dark mode assertion passed: both cards are slate-900 (rgb(15, 23, 42))');

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
  console.log('=== DASHBOARD CARDS BROWSER VERIFICATION COMPLETED SUCCESSFULLY ===');
}

verifyDashboardCards().catch((err) => {
  console.error('[E2E] FATAL ERROR:', err);
  process.exit(1);
});
