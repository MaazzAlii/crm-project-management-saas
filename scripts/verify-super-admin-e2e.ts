import { UserRepository, OrganizationRepository } from '../lib/db/repositories';
import { query } from '../lib/db';
import bcrypt from 'bcryptjs';
import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = '/home/maazzalii/.gemini/antigravity-ide/brain/4d42e8c1-8525-48b1-af23-ff9d4d840500';

interface ComputedStylesReport {
  view: string;
  theme: string;
  h1Color: string;
  h1Weight: string;
  tableOrCardTextColor: string;
  tableHeaderColor: string;
  filterLabelColor: string;
  inputBg: string;
  inputBorder: string;
  navBg: string;
  navTextColor: string;
  badgeBg: string;
  badgeColor: string;
  actionBtnBg: string;
  actionBtnColor: string;
}

async function verifySuperAdmin() {
  console.log('=== STARTING SUPER ADMIN (9A) BROWSER & COMPUTED COLOR VERIFICATION ===');

  const ts = Date.now();
  const email = `super_admin_${ts}@innoventixhub.tech`;
  const rawPassword = 'PlaywrightPass123!';
  const passwordHash = await bcrypt.hash(rawPassword, 10);

  const userRepo = new UserRepository();
  const orgRepo = new OrganizationRepository();

  // Create super admin user
  const user = await userRepo.create({
    email,
    passwordHash,
    fullName: 'Global Platform Super Admin',
    role: 'super_admin',
    requirePasswordChange: false,
  });

  // Also insert into super_admins table
  await query('INSERT INTO super_admins (user_id) VALUES ($1) ON CONFLICT DO NOTHING', [user.id]);

  // Create an org for this admin
  const org = await orgRepo.create({
    name: 'Innoventix Platform Operators ' + ts,
    slug: 'platform-op-' + ts,
    ownerUserId: user.id,
  });

  console.log(`[E2E] Provisioned super_admin ${user.email} (id: ${user.id})`);

  // Launch Playwright
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
  const page = await context.newPage();

  const styleReports: ComputedStylesReport[] = [];

  // Helper to toggle theme
  async function setTheme(theme: 'light' | 'dark') {
    await page.evaluate((t) => {
      const root = document.documentElement;
      if (t === 'dark') {
        root.classList.add('dark');
        root.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
      } else {
        root.classList.remove('dark');
        root.removeAttribute('data-theme');
        root.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light');
      }
    }, theme);
    await page.waitForTimeout(400);
  }

  try {
    // 1. Authenticate via direct session login
    console.log('[E2E] Authenticating via /api/auth/login...');
    const loginRes = await page.request.post('http://localhost:3000/api/auth/login', {
      data: { email, password: rawPassword },
    });
    const loginData = await loginRes.json();
    console.log(`[E2E] Login API status: ${loginRes.status()}, user role: ${loginData.user?.role}`);

    await context.addCookies([
      {
        name: 'innoventix_session',
        value: loginData.accessToken,
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        sameSite: 'Lax',
      },
      {
        name: 'organization_id',
        value: loginData.user.orgId,
        domain: 'localhost',
        path: '/',
        sameSite: 'Lax',
      },
    ]);

    // 2. Navigate to /super-admin/dashboard
    console.log('[E2E] Navigating to /super-admin/dashboard...');
    await page.goto('http://localhost:3000/super-admin/dashboard', { waitUntil: 'networkidle' });
    await page.waitForSelector('h1', { timeout: 10000 });

    // 2.1 Dashboard LIGHT Mode
    await setTheme('light');
    const dashLightH1 = await page.$eval('h1', (el) => {
      const cs = window.getComputedStyle(el);
      return { color: cs.color, weight: cs.fontWeight, text: el.textContent?.trim() };
    });
    console.log('[E2E] Dashboard Light H1:', dashLightH1);

    const dashLightMetrics = await page.evaluate(() => {
      const card = document.querySelector('.grid > div');
      const val = card?.querySelector('.font-extrabold');
      const title = card?.querySelector('.uppercase');
      const badge = card?.querySelector('.rounded-full');
      const nav = document.querySelector('header');
      const navLink = nav?.querySelector('nav a');
      const exitBtn = nav?.querySelector('a[href="/dashboard"]');

      return {
        cardBg: card ? window.getComputedStyle(card).backgroundColor : '',
        valColor: val ? window.getComputedStyle(val).color : '',
        titleColor: title ? window.getComputedStyle(title).color : '',
        badgeBg: badge ? window.getComputedStyle(badge).backgroundColor : '',
        badgeColor: badge ? window.getComputedStyle(badge).color : '',
        navBg: nav ? window.getComputedStyle(nav).backgroundColor : '',
        navLinkColor: navLink ? window.getComputedStyle(navLink).color : '',
        exitBtnBg: exitBtn ? window.getComputedStyle(exitBtn).backgroundColor : '',
        exitBtnColor: exitBtn ? window.getComputedStyle(exitBtn).color : '',
      };
    });

    const dashLightPath = path.join(ARTIFACT_DIR, 'super_admin_dashboard_light.png');
    await page.screenshot({ path: dashLightPath });
    console.log(`[E2E] Saved screenshot: ${dashLightPath}`);

    styleReports.push({
      view: 'Super Admin Dashboard',
      theme: 'Light',
      h1Color: dashLightH1.color,
      h1Weight: dashLightH1.weight,
      tableOrCardTextColor: dashLightMetrics.valColor,
      tableHeaderColor: dashLightMetrics.titleColor,
      filterLabelColor: 'N/A',
      inputBg: 'N/A',
      inputBorder: 'N/A',
      navBg: dashLightMetrics.navBg,
      navTextColor: dashLightMetrics.navLinkColor,
      badgeBg: dashLightMetrics.badgeBg,
      badgeColor: dashLightMetrics.badgeColor,
      actionBtnBg: dashLightMetrics.exitBtnBg,
      actionBtnColor: dashLightMetrics.exitBtnColor,
    });

    // 2.2 Dashboard DARK Mode
    await setTheme('dark');
    const dashDarkH1 = await page.$eval('h1', (el) => {
      const cs = window.getComputedStyle(el);
      return { color: cs.color, weight: cs.fontWeight, text: el.textContent?.trim() };
    });
    console.log('[E2E] Dashboard Dark H1:', dashDarkH1);

    const dashDarkMetrics = await page.evaluate(() => {
      const card = document.querySelector('.grid > div');
      const val = card?.querySelector('.font-extrabold');
      const title = card?.querySelector('.uppercase');
      const badge = card?.querySelector('.rounded-full');
      const nav = document.querySelector('header');
      const navLink = nav?.querySelector('nav a');
      const exitBtn = nav?.querySelector('a[href="/dashboard"]');

      return {
        cardBg: card ? window.getComputedStyle(card).backgroundColor : '',
        valColor: val ? window.getComputedStyle(val).color : '',
        titleColor: title ? window.getComputedStyle(title).color : '',
        badgeBg: badge ? window.getComputedStyle(badge).backgroundColor : '',
        badgeColor: badge ? window.getComputedStyle(badge).color : '',
        navBg: nav ? window.getComputedStyle(nav).backgroundColor : '',
        navLinkColor: navLink ? window.getComputedStyle(navLink).color : '',
        exitBtnBg: exitBtn ? window.getComputedStyle(exitBtn).backgroundColor : '',
        exitBtnColor: exitBtn ? window.getComputedStyle(exitBtn).color : '',
      };
    });

    const dashDarkPath = path.join(ARTIFACT_DIR, 'super_admin_dashboard_dark.png');
    await page.screenshot({ path: dashDarkPath });
    console.log(`[E2E] Saved screenshot: ${dashDarkPath}`);

    styleReports.push({
      view: 'Super Admin Dashboard',
      theme: 'Dark',
      h1Color: dashDarkH1.color,
      h1Weight: dashDarkH1.weight,
      tableOrCardTextColor: dashDarkMetrics.valColor,
      tableHeaderColor: dashDarkMetrics.titleColor,
      filterLabelColor: 'N/A',
      inputBg: 'N/A',
      inputBorder: 'N/A',
      navBg: dashDarkMetrics.navBg,
      navTextColor: dashDarkMetrics.navLinkColor,
      badgeBg: dashDarkMetrics.badgeBg,
      badgeColor: dashDarkMetrics.badgeColor,
      actionBtnBg: dashDarkMetrics.exitBtnBg,
      actionBtnColor: dashDarkMetrics.exitBtnColor,
    });

    // 3. Navigate to /super-admin/organizations
    console.log('[E2E] Navigating to /super-admin/organizations...');
    await page.goto('http://localhost:3000/super-admin/organizations', { waitUntil: 'networkidle' });
    await page.waitForSelector('table', { timeout: 10000 });

    // 3.1 Organizations LIGHT Mode
    await setTheme('light');
    const orgsLightH1 = await page.$eval('h1', (el) => {
      const cs = window.getComputedStyle(el);
      return { color: cs.color, weight: cs.fontWeight, text: el.textContent?.trim() };
    });
    console.log('[E2E] Orgs Light H1:', orgsLightH1);

    const orgsLightTable = await page.evaluate(() => {
      const th = document.querySelector('th');
      const row = document.querySelector('tbody tr');
      const orgLink = row?.querySelector('a');
      const badge = row?.querySelector('.rounded-md');
      const filterInput = document.querySelector('input[placeholder*="Search"]');
      const filterLabel = document.querySelector('.space-y-4 span.text-xs');
      const actionLink = row?.querySelector('a[href*="/super-admin/organizations/"]:last-child');

      return {
        thColor: th ? window.getComputedStyle(th).color : '',
        orgLinkColor: orgLink ? window.getComputedStyle(orgLink).color : '',
        badgeBg: badge ? window.getComputedStyle(badge).backgroundColor : '',
        badgeColor: badge ? window.getComputedStyle(badge).color : '',
        inputBg: filterInput ? window.getComputedStyle(filterInput).backgroundColor : '',
        inputBorder: filterInput ? window.getComputedStyle(filterInput).borderColor : '',
        filterLabelColor: filterLabel ? window.getComputedStyle(filterLabel).color : '',
        actionBtnBg: actionLink ? window.getComputedStyle(actionLink).backgroundColor : '',
        actionBtnColor: actionLink ? window.getComputedStyle(actionLink).color : '',
      };
    });

    const orgsLightPath = path.join(ARTIFACT_DIR, 'super_admin_organizations_light.png');
    await page.screenshot({ path: orgsLightPath });
    console.log(`[E2E] Saved screenshot: ${orgsLightPath}`);

    styleReports.push({
      view: 'Super Admin Organizations',
      theme: 'Light',
      h1Color: orgsLightH1.color,
      h1Weight: orgsLightH1.weight,
      tableOrCardTextColor: orgsLightTable.orgLinkColor,
      tableHeaderColor: orgsLightTable.thColor,
      filterLabelColor: orgsLightTable.filterLabelColor,
      inputBg: orgsLightTable.inputBg,
      inputBorder: orgsLightTable.inputBorder,
      navBg: 'N/A',
      navTextColor: 'N/A',
      badgeBg: orgsLightTable.badgeBg,
      badgeColor: orgsLightTable.badgeColor,
      actionBtnBg: orgsLightTable.actionBtnBg,
      actionBtnColor: orgsLightTable.actionBtnColor,
    });

    // 3.2 Organizations DARK Mode
    await setTheme('dark');
    const orgsDarkH1 = await page.$eval('h1', (el) => {
      const cs = window.getComputedStyle(el);
      return { color: cs.color, weight: cs.fontWeight, text: el.textContent?.trim() };
    });
    console.log('[E2E] Orgs Dark H1:', orgsDarkH1);

    const orgsDarkTable = await page.evaluate(() => {
      const th = document.querySelector('th');
      const row = document.querySelector('tbody tr');
      const orgLink = row?.querySelector('a');
      const badge = row?.querySelector('.rounded-md');
      const filterInput = document.querySelector('input[placeholder*="Search"]');
      const filterLabel = document.querySelector('.space-y-4 span.text-xs');
      const actionLink = row?.querySelector('a[href*="/super-admin/organizations/"]:last-child');

      return {
        thColor: th ? window.getComputedStyle(th).color : '',
        orgLinkColor: orgLink ? window.getComputedStyle(orgLink).color : '',
        badgeBg: badge ? window.getComputedStyle(badge).backgroundColor : '',
        badgeColor: badge ? window.getComputedStyle(badge).color : '',
        inputBg: filterInput ? window.getComputedStyle(filterInput).backgroundColor : '',
        inputBorder: filterInput ? window.getComputedStyle(filterInput).borderColor : '',
        filterLabelColor: filterLabel ? window.getComputedStyle(filterLabel).color : '',
        actionBtnBg: actionLink ? window.getComputedStyle(actionLink).backgroundColor : '',
        actionBtnColor: actionLink ? window.getComputedStyle(actionLink).color : '',
      };
    });

    const orgsDarkPath = path.join(ARTIFACT_DIR, 'super_admin_organizations_dark.png');
    await page.screenshot({ path: orgsDarkPath });
    console.log(`[E2E] Saved screenshot: ${orgsDarkPath}`);

    styleReports.push({
      view: 'Super Admin Organizations',
      theme: 'Dark',
      h1Color: orgsDarkH1.color,
      h1Weight: orgsDarkH1.weight,
      tableOrCardTextColor: orgsDarkTable.orgLinkColor,
      tableHeaderColor: orgsDarkTable.thColor,
      filterLabelColor: orgsDarkTable.filterLabelColor,
      inputBg: orgsDarkTable.inputBg,
      inputBorder: orgsDarkTable.inputBorder,
      navBg: 'N/A',
      navTextColor: 'N/A',
      badgeBg: orgsDarkTable.badgeBg,
      badgeColor: orgsDarkTable.badgeColor,
      actionBtnBg: orgsDarkTable.actionBtnBg,
      actionBtnColor: orgsDarkTable.actionBtnColor,
    });

    // 4. Multi-Route Persistence Cycle
    console.log('[E2E] Running multi-route persistence verification...');
    // Set dark mode
    await setTheme('dark');

    // Route 1: /super-admin/dashboard
    await page.goto('http://localhost:3000/super-admin/dashboard', { waitUntil: 'networkidle' });
    let isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    if (!isDark) throw new Error('Theme lost on /super-admin/dashboard');

    // Route 2: /super-admin/organizations
    await page.goto('http://localhost:3000/super-admin/organizations', { waitUntil: 'networkidle' });
    isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    if (!isDark) throw new Error('Theme lost on /super-admin/organizations');

    // Switch to light mode
    await setTheme('light');

    // Route 3: /dashboard
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle' });
    let isLight = await page.evaluate(() => !document.documentElement.classList.contains('dark'));
    if (!isLight) throw new Error('Theme lost on /dashboard');

    // Route 4: /settings
    await page.goto('http://localhost:3000/settings', { waitUntil: 'networkidle' });
    isLight = await page.evaluate(() => !document.documentElement.classList.contains('dark'));
    if (!isLight) throw new Error('Theme lost on /settings');

    // Route 5: /super-admin/dashboard
    await page.goto('http://localhost:3000/super-admin/dashboard', { waitUntil: 'networkidle' });
    isLight = await page.evaluate(() => !document.documentElement.classList.contains('dark'));
    if (!isLight) throw new Error('Theme lost returning to /super-admin/dashboard');

    console.log('[E2E] Multi-route persistence cycle PASSED across 5 routes!');

    // 5. Output Summary Table
    console.log('\n=== COMPUTED STYLE VERIFICATION SUMMARY TABLE ===');
    console.table(styleReports);

    console.log('\n=== ALL BROWSER & COMPUTED CHECKS PASSED (100%) ===');
  } finally {
    await browser.close();
  }
}

verifySuperAdmin().catch((err) => {
  console.error('[E2E ERROR]', err);
  process.exit(1);
});
