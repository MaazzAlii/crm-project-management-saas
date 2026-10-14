import { UserRepository, OrganizationRepository } from '../lib/db/repositories';
import { query } from '../lib/db';
import bcrypt from 'bcryptjs';
import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = '/home/maazzalii/.gemini/antigravity-ide/brain/9d507ead-e1e0-4d07-926e-9c2a1596c42a';

interface ComputedColorEntry {
  view: string;
  theme: string;
  element: string;
  backgroundColor: string;
  textColor: string;
  borderColor?: string;
}

async function verifySuperAdmin9B1() {
  console.log('=== STARTING SUB-BATCH 9B1 SUPER ADMIN ORGANIZATIONS E2E VERIFICATION ===');

  const ts = Date.now();
  const superAdminEmail = `superadmin_9b1_${ts}@innoventixhub.tech`;
  const rawPassword = 'PlaywrightPass123!';
  const passwordHash = await bcrypt.hash(rawPassword, 10);

  const userRepo = new UserRepository();
  const orgRepo = new OrganizationRepository();

  // 1. Provision super admin user
  const adminUser = await userRepo.create({
    email: superAdminEmail,
    passwordHash,
    fullName: 'Platform Super Admin ' + ts,
    role: 'super_admin',
    requirePasswordChange: false,
  });

  await query('INSERT INTO super_admins (user_id) VALUES ($1) ON CONFLICT DO NOTHING', [adminUser.id]);

  const adminOrg = await orgRepo.create({
    name: 'Innoventix Platform Operators ' + ts,
    slug: 'platform-operators-' + ts,
    ownerUserId: adminUser.id,
  });

  // Provision a target organization for detail inspection
  const targetOrg = await orgRepo.create({
    name: 'Apex Innovations ' + ts,
    slug: 'apex-innovations-' + ts,
    ownerUserId: adminUser.id,
  });

  await query(
    `UPDATE organizations
     SET plan_tier = 'pro', billing_status = 'active', industry_type = 'Enterprise AI Software'
     WHERE id = $1`,
    [targetOrg.id]
  );

  console.log(`[E2E] Provisioned super_admin ${adminUser.email} and test org ${targetOrg.id} (${targetOrg.slug})`);

  // Launch browser
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
  const page = await context.newPage();

  const colorEntries: ComputedColorEntry[] = [];

  async function setTheme(theme: 'light' | 'dark') {
    await page.evaluate((targetTheme) => {
      const html = document.documentElement;
      if (targetTheme === 'dark') {
        html.classList.add('dark');
        html.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
      } else {
        html.classList.remove('dark');
        html.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light');
      }
    }, theme);
    await page.waitForTimeout(300);
  }

  // 1. Authenticate via direct API login
  console.log('[E2E] Authenticating via /api/auth/login...');
  const loginRes = await page.request.post('http://localhost:3000/api/auth/login', {
    data: { email: superAdminEmail, password: rawPassword },
  });
  const loginData = await loginRes.json();
  console.log(`[E2E] Login API status: ${loginRes.status()}, role: ${loginData.user?.role}`);

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
      value: adminOrg.id,
      domain: 'localhost',
      path: '/',
      sameSite: 'Lax',
    },
  ]);

  // ══════════════════════════════════════════════════════════════
  // VIEW 1: /super-admin/organizations (Directory Table)
  // ══════════════════════════════════════════════════════════════
  console.log('\n--- VERIFYING /super-admin/organizations ---');
  await page.goto('http://localhost:3000/super-admin/organizations', { waitUntil: 'networkidle' });
  await page.waitForSelector('h1', { timeout: 10000 });

  // 1.1 Directory - Light
  await setTheme('light');
  const orgsLightPath = path.join(ARTIFACT_DIR, 'super_admin_organizations_light.png');
  await page.screenshot({ path: orgsLightPath });
  console.log(`[E2E] Captured: ${orgsLightPath}`);

  const orgsLightMetrics = await page.evaluate(() => {
    const h1 = document.querySelector('h1');
    const badge = document.querySelector('h1 + span');
    const th = document.querySelector('thead th');
    const tr = document.querySelector('tbody tr');
    const rowTitle = tr?.querySelector('td a');
    const rowMono = tr?.querySelector('td.font-mono');
    const actionBtn = tr?.querySelector('a[href*="/super-admin/organizations/"]');

    return {
      h1Color: h1 ? getComputedStyle(h1).color : 'N/A',
      badgeBg: badge ? getComputedStyle(badge).backgroundColor : 'N/A',
      badgeColor: badge ? getComputedStyle(badge).color : 'N/A',
      thColor: th ? getComputedStyle(th).color : 'N/A',
      rowTextColor: rowTitle ? getComputedStyle(rowTitle).color : 'N/A',
      rowMonoColor: rowMono ? getComputedStyle(rowMono).color : 'N/A',
      actionBtnBg: actionBtn ? getComputedStyle(actionBtn).backgroundColor : 'N/A',
      actionBtnColor: actionBtn ? getComputedStyle(actionBtn).color : 'N/A',
      actionBtnBorder: actionBtn ? getComputedStyle(actionBtn).borderColor : 'N/A',
    };
  });

  colorEntries.push(
    { view: '/super-admin/organizations', theme: 'light', element: 'h1 (Title)', backgroundColor: 'transparent', textColor: orgsLightMetrics.h1Color },
    { view: '/super-admin/organizations', theme: 'light', element: 'Tenants Count Badge', backgroundColor: orgsLightMetrics.badgeBg, textColor: orgsLightMetrics.badgeColor },
    { view: '/super-admin/organizations', theme: 'light', element: 'Table Header th', backgroundColor: 'transparent', textColor: orgsLightMetrics.thColor },
    { view: '/super-admin/organizations', theme: 'light', element: 'Table Row Org Link', backgroundColor: 'transparent', textColor: orgsLightMetrics.rowTextColor },
    { view: '/super-admin/organizations', theme: 'light', element: 'Table Row Mono Info', backgroundColor: 'transparent', textColor: orgsLightMetrics.rowMonoColor },
    { view: '/super-admin/organizations', theme: 'light', element: 'Quick Action "Details" Button', backgroundColor: orgsLightMetrics.actionBtnBg, textColor: orgsLightMetrics.actionBtnColor, borderColor: orgsLightMetrics.actionBtnBorder }
  );

  // 1.2 Directory - Dark
  await setTheme('dark');
  const orgsDarkPath = path.join(ARTIFACT_DIR, 'super_admin_organizations_dark.png');
  await page.screenshot({ path: orgsDarkPath });
  console.log(`[E2E] Captured: ${orgsDarkPath}`);

  const orgsDarkMetrics = await page.evaluate(() => {
    const h1 = document.querySelector('h1');
    const badge = document.querySelector('h1 + span');
    const th = document.querySelector('thead th');
    const tr = document.querySelector('tbody tr');
    const rowTitle = tr?.querySelector('td a');
    const rowMono = tr?.querySelector('td.font-mono');
    const actionBtn = tr?.querySelector('a[href*="/super-admin/organizations/"]');

    return {
      h1Color: h1 ? getComputedStyle(h1).color : 'N/A',
      badgeBg: badge ? getComputedStyle(badge).backgroundColor : 'N/A',
      badgeColor: badge ? getComputedStyle(badge).color : 'N/A',
      thColor: th ? getComputedStyle(th).color : 'N/A',
      rowTextColor: rowTitle ? getComputedStyle(rowTitle).color : 'N/A',
      rowMonoColor: rowMono ? getComputedStyle(rowMono).color : 'N/A',
      actionBtnBg: actionBtn ? getComputedStyle(actionBtn).backgroundColor : 'N/A',
      actionBtnColor: actionBtn ? getComputedStyle(actionBtn).color : 'N/A',
      actionBtnBorder: actionBtn ? getComputedStyle(actionBtn).borderColor : 'N/A',
    };
  });

  colorEntries.push(
    { view: '/super-admin/organizations', theme: 'dark', element: 'h1 (Title)', backgroundColor: 'transparent', textColor: orgsDarkMetrics.h1Color },
    { view: '/super-admin/organizations', theme: 'dark', element: 'Tenants Count Badge', backgroundColor: orgsDarkMetrics.badgeBg, textColor: orgsDarkMetrics.badgeColor },
    { view: '/super-admin/organizations', theme: 'dark', element: 'Table Header th', backgroundColor: 'transparent', textColor: orgsDarkMetrics.thColor },
    { view: '/super-admin/organizations', theme: 'dark', element: 'Table Row Org Link', backgroundColor: 'transparent', textColor: orgsDarkMetrics.rowTextColor },
    { view: '/super-admin/organizations', theme: 'dark', element: 'Table Row Mono Info', backgroundColor: 'transparent', textColor: orgsDarkMetrics.rowMonoColor },
    { view: '/super-admin/organizations', theme: 'dark', element: 'Quick Action "Details" Button', backgroundColor: orgsDarkMetrics.actionBtnBg, textColor: orgsDarkMetrics.actionBtnColor, borderColor: orgsDarkMetrics.actionBtnBorder }
  );

  // ══════════════════════════════════════════════════════════════
  // VIEW 2: /super-admin/organizations/[id] (Organization Detail)
  // ══════════════════════════════════════════════════════════════
  console.log(`\n--- VERIFYING /super-admin/organizations/${targetOrg.id} ---`);
  await page.goto(`http://localhost:3000/super-admin/organizations/${targetOrg.id}`, { waitUntil: 'networkidle' });
  await page.waitForSelector('h1', { timeout: 10000 });

  // 2.1 Detail - Light
  await setTheme('light');
  const detailLightPath = path.join(ARTIFACT_DIR, 'super_admin_org_detail_light.png');
  await page.screenshot({ path: detailLightPath });
  console.log(`[E2E] Captured: ${detailLightPath}`);

  const detailLightMetrics = await page.evaluate(() => {
    const h1 = document.querySelector('h1');
    const headerCard = document.querySelector('.bg-card');
    const backLink = document.querySelector('a[href="/super-admin/organizations"]');
    const metaLabel = document.querySelector('span.block.font-medium');
    const metaValue = document.querySelector('span.font-mono.block');
    const usageH2 = document.querySelector('h2');
    const usageCard = document.querySelector('.grid > div');
    const usageCardVal = usageCard?.querySelector('.font-extrabold');

    return {
      h1Color: h1 ? getComputedStyle(h1).color : 'N/A',
      headerCardBg: headerCard ? getComputedStyle(headerCard).backgroundColor : 'N/A',
      headerCardBorder: headerCard ? getComputedStyle(headerCard).borderColor : 'N/A',
      backLinkColor: backLink ? getComputedStyle(backLink).color : 'N/A',
      metaLabelColor: metaLabel ? getComputedStyle(metaLabel).color : 'N/A',
      metaValueColor: metaValue ? getComputedStyle(metaValue).color : 'N/A',
      usageH2Color: usageH2 ? getComputedStyle(usageH2).color : 'N/A',
      usageCardBg: usageCard ? getComputedStyle(usageCard).backgroundColor : 'N/A',
      usageCardValColor: usageCardVal ? getComputedStyle(usageCardVal).color : 'N/A',
    };
  });

  colorEntries.push(
    { view: '/super-admin/organizations/[id]', theme: 'light', element: 'h1 (Org Name)', backgroundColor: 'transparent', textColor: detailLightMetrics.h1Color },
    { view: '/super-admin/organizations/[id]', theme: 'light', element: 'Header Card Box', backgroundColor: detailLightMetrics.headerCardBg, textColor: 'N/A', borderColor: detailLightMetrics.headerCardBorder },
    { view: '/super-admin/organizations/[id]', theme: 'light', element: 'Back Navigation Link', backgroundColor: 'transparent', textColor: detailLightMetrics.backLinkColor },
    { view: '/super-admin/organizations/[id]', theme: 'light', element: 'Billing Meta Label', backgroundColor: 'transparent', textColor: detailLightMetrics.metaLabelColor },
    { view: '/super-admin/organizations/[id]', theme: 'light', element: 'Billing Meta Value', backgroundColor: 'transparent', textColor: detailLightMetrics.metaValueColor },
    { view: '/super-admin/organizations/[id]', theme: 'light', element: 'Usage Limits Card', backgroundColor: detailLightMetrics.usageCardBg, textColor: detailLightMetrics.usageCardValColor }
  );

  // 2.2 Detail - Dark
  await setTheme('dark');
  const detailDarkPath = path.join(ARTIFACT_DIR, 'super_admin_org_detail_dark.png');
  await page.screenshot({ path: detailDarkPath });
  console.log(`[E2E] Captured: ${detailDarkPath}`);

  const detailDarkMetrics = await page.evaluate(() => {
    const h1 = document.querySelector('h1');
    const headerCard = document.querySelector('.bg-card');
    const backLink = document.querySelector('a[href="/super-admin/organizations"]');
    const metaLabel = document.querySelector('span.block.font-medium');
    const metaValue = document.querySelector('span.font-mono.block');
    const usageH2 = document.querySelector('h2');
    const usageCard = document.querySelector('.grid > div');
    const usageCardVal = usageCard?.querySelector('.font-extrabold');

    return {
      h1Color: h1 ? getComputedStyle(h1).color : 'N/A',
      headerCardBg: headerCard ? getComputedStyle(headerCard).backgroundColor : 'N/A',
      headerCardBorder: headerCard ? getComputedStyle(headerCard).borderColor : 'N/A',
      backLinkColor: backLink ? getComputedStyle(backLink).color : 'N/A',
      metaLabelColor: metaLabel ? getComputedStyle(metaLabel).color : 'N/A',
      metaValueColor: metaValue ? getComputedStyle(metaValue).color : 'N/A',
      usageH2Color: usageH2 ? getComputedStyle(usageH2).color : 'N/A',
      usageCardBg: usageCard ? getComputedStyle(usageCard).backgroundColor : 'N/A',
      usageCardValColor: usageCardVal ? getComputedStyle(usageCardVal).color : 'N/A',
    };
  });

  colorEntries.push(
    { view: '/super-admin/organizations/[id]', theme: 'dark', element: 'h1 (Org Name)', backgroundColor: 'transparent', textColor: detailDarkMetrics.h1Color },
    { view: '/super-admin/organizations/[id]', theme: 'dark', element: 'Header Card Box', backgroundColor: detailDarkMetrics.headerCardBg, textColor: 'N/A', borderColor: detailDarkMetrics.headerCardBorder },
    { view: '/super-admin/organizations/[id]', theme: 'dark', element: 'Back Navigation Link', backgroundColor: 'transparent', textColor: detailDarkMetrics.backLinkColor },
    { view: '/super-admin/organizations/[id]', theme: 'dark', element: 'Billing Meta Label', backgroundColor: 'transparent', textColor: detailDarkMetrics.metaLabelColor },
    { view: '/super-admin/organizations/[id]', theme: 'dark', element: 'Billing Meta Value', backgroundColor: 'transparent', textColor: detailDarkMetrics.metaValueColor },
    { view: '/super-admin/organizations/[id]', theme: 'dark', element: 'Usage Limits Card', backgroundColor: detailDarkMetrics.usageCardBg, textColor: detailDarkMetrics.usageCardValColor }
  );

  // ══════════════════════════════════════════════════════════════
  // VIEW 3: Modal Actions (OverridePlanModal & SuspendOrgModal)
  // ══════════════════════════════════════════════════════════════
  console.log('\n--- VERIFYING Org Management Action Modals ---');

  // Trigger Override Plan Modal in Dark Mode first to verify dark-mode inputs
  await setTheme('dark');
  const overrideBtn = await page.waitForSelector('button:has-text("Override Plan")');
  await overrideBtn.click();
  await page.waitForSelector('text=Manual Plan Override', { timeout: 5000 });
  await page.waitForTimeout(300);

  const modalDarkPath = path.join(ARTIFACT_DIR, 'super_admin_org_modal_dark.png');
  await page.screenshot({ path: modalDarkPath });
  console.log(`[E2E] Captured: ${modalDarkPath}`);

  const modalDarkMetrics = await page.evaluate(() => {
    const backdrop = document.querySelector('.fixed.inset-0');
    const dialog = backdrop?.querySelector('.bg-card');
    const title = dialog?.querySelector('h3');
    const textarea = dialog?.querySelector('textarea');
    const cancelBtn = Array.from(dialog?.querySelectorAll('button') || []).find(b => b.textContent?.trim() === 'Cancel');
    const confirmBtn = Array.from(dialog?.querySelectorAll('button') || []).find(b => b.textContent?.includes('Apply Plan Override'));
    const tierActive = Array.from(dialog?.querySelectorAll('button') || []).find(b => b.classList.contains('border-primary'));

    return {
      backdropBg: backdrop ? getComputedStyle(backdrop).backgroundColor : 'N/A',
      dialogBg: dialog ? getComputedStyle(dialog).backgroundColor : 'N/A',
      dialogBorder: dialog ? getComputedStyle(dialog).borderColor : 'N/A',
      titleColor: title ? getComputedStyle(title).color : 'N/A',
      textareaBg: textarea ? getComputedStyle(textarea).backgroundColor : 'N/A',
      textareaColor: textarea ? getComputedStyle(textarea).color : 'N/A',
      textareaBorder: textarea ? getComputedStyle(textarea).borderColor : 'N/A',
      cancelBtnBg: cancelBtn ? getComputedStyle(cancelBtn).backgroundColor : 'N/A',
      cancelBtnColor: cancelBtn ? getComputedStyle(cancelBtn).color : 'N/A',
      confirmBtnBg: confirmBtn ? getComputedStyle(confirmBtn).backgroundColor : 'N/A',
      confirmBtnColor: confirmBtn ? getComputedStyle(confirmBtn).color : 'N/A',
      tierActiveBg: tierActive ? getComputedStyle(tierActive).backgroundColor : 'N/A',
      tierActiveColor: tierActive ? getComputedStyle(tierActive).color : 'N/A',
    };
  });

  colorEntries.push(
    { view: 'OverridePlanModal', theme: 'dark', element: 'Modal Overlay Backdrop', backgroundColor: modalDarkMetrics.backdropBg, textColor: 'N/A' },
    { view: 'OverridePlanModal', theme: 'dark', element: 'Modal Dialog Box', backgroundColor: modalDarkMetrics.dialogBg, textColor: modalDarkMetrics.titleColor, borderColor: modalDarkMetrics.dialogBorder },
    { view: 'OverridePlanModal', theme: 'dark', element: 'Audit Reason Textarea (Input)', backgroundColor: modalDarkMetrics.textareaBg, textColor: modalDarkMetrics.textareaColor, borderColor: modalDarkMetrics.textareaBorder },
    { view: 'OverridePlanModal', theme: 'dark', element: 'Selected Tier Button', backgroundColor: modalDarkMetrics.tierActiveBg, textColor: modalDarkMetrics.tierActiveColor },
    { view: 'OverridePlanModal', theme: 'dark', element: 'Apply Plan Override Action Button', backgroundColor: modalDarkMetrics.confirmBtnBg, textColor: modalDarkMetrics.confirmBtnColor }
  );

  // 3.2 Modal - Light Mode
  await setTheme('light');
  await page.waitForTimeout(300);
  const modalLightPath = path.join(ARTIFACT_DIR, 'super_admin_org_modal_light.png');
  await page.screenshot({ path: modalLightPath });
  console.log(`[E2E] Captured: ${modalLightPath}`);

  const modalLightMetrics = await page.evaluate(() => {
    const backdrop = document.querySelector('.fixed.inset-0');
    const dialog = backdrop?.querySelector('.bg-card');
    const title = dialog?.querySelector('h3');
    const textarea = dialog?.querySelector('textarea');
    const cancelBtn = Array.from(dialog?.querySelectorAll('button') || []).find(b => b.textContent?.trim() === 'Cancel');
    const confirmBtn = Array.from(dialog?.querySelectorAll('button') || []).find(b => b.textContent?.includes('Apply Plan Override'));

    return {
      backdropBg: backdrop ? getComputedStyle(backdrop).backgroundColor : 'N/A',
      dialogBg: dialog ? getComputedStyle(dialog).backgroundColor : 'N/A',
      dialogBorder: dialog ? getComputedStyle(dialog).borderColor : 'N/A',
      titleColor: title ? getComputedStyle(title).color : 'N/A',
      textareaBg: textarea ? getComputedStyle(textarea).backgroundColor : 'N/A',
      textareaColor: textarea ? getComputedStyle(textarea).color : 'N/A',
      confirmBtnBg: confirmBtn ? getComputedStyle(confirmBtn).backgroundColor : 'N/A',
      confirmBtnColor: confirmBtn ? getComputedStyle(confirmBtn).color : 'N/A',
    };
  });

  colorEntries.push(
    { view: 'OverridePlanModal', theme: 'light', element: 'Modal Overlay Backdrop', backgroundColor: modalLightMetrics.backdropBg, textColor: 'N/A' },
    { view: 'OverridePlanModal', theme: 'light', element: 'Modal Dialog Box', backgroundColor: modalLightMetrics.dialogBg, textColor: modalLightMetrics.titleColor, borderColor: modalLightMetrics.dialogBorder },
    { view: 'OverridePlanModal', theme: 'light', element: 'Audit Reason Textarea (Input)', backgroundColor: modalLightMetrics.textareaBg, textColor: modalLightMetrics.textareaColor },
    { view: 'OverridePlanModal', theme: 'light', element: 'Apply Plan Override Action Button', backgroundColor: modalLightMetrics.confirmBtnBg, textColor: modalLightMetrics.confirmBtnColor }
  );

  // Close modal
  const closeBtn = await page.$('button:has-text("Cancel")');
  await closeBtn?.click();
  await page.waitForTimeout(300);

  // ══════════════════════════════════════════════════════════════
  // VIEW 4: Multi-Route Navigation Test & Screenshots
  // ══════════════════════════════════════════════════════════════
  console.log('\n--- VERIFYING Multi-Route Navigation (/super-admin/dashboard → /organizations → /[id] → back) ---');

  // Dark route progression
  await setTheme('dark');
  await page.goto('http://localhost:3000/super-admin/dashboard', { waitUntil: 'networkidle' });
  await page.waitForTimeout(200);
  await page.goto('http://localhost:3000/super-admin/organizations', { waitUntil: 'networkidle' });
  await page.waitForTimeout(200);
  await page.goto(`http://localhost:3000/super-admin/organizations/${targetOrg.id}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(200);
  await page.goto('http://localhost:3000/super-admin/organizations', { waitUntil: 'networkidle' });
  await page.waitForTimeout(200);

  const multiDarkPath = path.join(ARTIFACT_DIR, 'multi_route_super_admin_9b1_dark.png');
  await page.screenshot({ path: multiDarkPath });
  console.log(`[E2E] Captured: ${multiDarkPath}`);

  // Light route progression
  await setTheme('light');
  await page.goto('http://localhost:3000/super-admin/dashboard', { waitUntil: 'networkidle' });
  await page.waitForTimeout(200);
  await page.goto('http://localhost:3000/super-admin/organizations', { waitUntil: 'networkidle' });
  await page.waitForTimeout(200);
  await page.goto(`http://localhost:3000/super-admin/organizations/${targetOrg.id}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(200);
  await page.goto('http://localhost:3000/super-admin/organizations', { waitUntil: 'networkidle' });
  await page.waitForTimeout(200);

  const multiLightPath = path.join(ARTIFACT_DIR, 'multi_route_super_admin_9b1_light.png');
  await page.screenshot({ path: multiLightPath });
  console.log(`[E2E] Captured: ${multiLightPath}`);

  console.log('\n══════════════════════════════════════════════════════════════');
  console.log('COMPUTED COLOR SAMPLES:');
  console.log('══════════════════════════════════════════════════════════════');
  console.table(colorEntries);

  // Critical assertion on dark-mode input bg
  const darkInput = colorEntries.find(e => e.theme === 'dark' && e.element.includes('Textarea (Input)'));
  if (darkInput) {
    console.log(`\n[CRITICAL CHECK] Dark Mode Input Background: ${darkInput.backgroundColor}`);
    if (darkInput.backgroundColor === 'rgb(255, 255, 255)') {
      throw new Error(`CRITICAL FAILURE: Dark mode input resolved to white: ${darkInput.backgroundColor}`);
    }
    console.log('✅ Dark Mode Input Background resolved to expected dark color, NOT white!');
  }

  await browser.close();
  console.log('\n=== SUB-BATCH 9B1 PLAYWRIGHT BROWSER VERIFICATION COMPLETE ===');
}

verifySuperAdmin9B1().catch((err) => {
  console.error('[E2E ERROR]', err);
  process.exit(1);
});
