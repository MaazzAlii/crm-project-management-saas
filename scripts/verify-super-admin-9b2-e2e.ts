import { UserRepository, OrganizationRepository } from '../lib/db/repositories';
import { query } from '../lib/db';
import bcrypt from 'bcryptjs';
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const ARTIFACT_DIR = '/home/maazzalii/.gemini/antigravity-ide/brain/9d507ead-e1e0-4d07-926e-9c2a1596c42a';
const BATCH_ASSETS_DIR = path.join(process.cwd(), 'assets/screenshots/sub-batch-9b2');
fs.mkdirSync(BATCH_ASSETS_DIR, { recursive: true });

interface ComputedColorEntry {
  view: string;
  theme: string;
  element: string;
  backgroundColor: string;
  textColor: string;
  borderColor?: string;
}

async function verifySuperAdmin9B2() {
  console.log('=== STARTING SUB-BATCH 9B2 SUPER ADMIN SETTINGS & RECENT ACTIVITY E2E VERIFICATION ===');

  const ts = Date.now();
  const superAdminEmail = `superadmin_9b2_${ts}@innoventixhub.tech`;
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

  // Provision some sample orgs to populate recent activity tables on dashboard
  const enterpriseOrg = await orgRepo.create({
    name: 'Enterprise Cloud Systems ' + ts,
    slug: 'enterprise-cloud-' + ts,
    ownerUserId: adminUser.id,
  });
  await query(
    `UPDATE organizations
     SET plan_tier = 'enterprise', billing_status = 'active', industry_type = 'Cloud Services'
     WHERE id = $1`,
    [enterpriseOrg.id]
  );

  const flaggedOrg = await orgRepo.create({
    name: 'Flagged Past Due Tenant ' + ts,
    slug: 'flagged-tenant-' + ts,
    ownerUserId: adminUser.id,
  });
  await query(
    `UPDATE organizations
     SET plan_tier = 'pro', billing_status = 'past_due', industry_type = 'Marketing'
     WHERE id = $1`,
    [flaggedOrg.id]
  );

  console.log(`[E2E] Provisioned super_admin ${adminUser.email} and test orgs`);

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

  async function captureScreenshot(filename: string) {
    const artifactPath = path.join(ARTIFACT_DIR, filename);
    const assetPath = path.join(BATCH_ASSETS_DIR, filename);
    await page.screenshot({ path: artifactPath });
    fs.copyFileSync(artifactPath, assetPath);
    console.log(`✅ Captured ${filename} -> assets/screenshots/sub-batch-9b2/${filename}`);
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
      secure: false,
      sameSite: 'Lax',
    },
    {
      name: 'innoventix_user',
      value: JSON.stringify({
        id: adminUser.id,
        email: adminUser.email,
        fullName: adminUser.full_name,
        role: 'super_admin',
      }),
      domain: 'localhost',
      path: '/',
      httpOnly: false,
      secure: false,
      sameSite: 'Lax',
    },
  ]);

  // ==========================================
  // VIEW 1: /super-admin/settings
  // ==========================================
  console.log('\n--- VERIFYING /super-admin/settings ---');
  await page.goto('http://localhost:3000/super-admin/settings', { waitUntil: 'networkidle' });

  // Light Mode Overview
  await setTheme('light');
  await captureScreenshot('super_admin_settings_light.png');

  // Dark Mode Overview
  await setTheme('dark');
  await captureScreenshot('super_admin_settings_dark.png');

  // ==========================================
  // VIEW 2: Trigger Edit Plan Limits & Form Inputs
  // ==========================================
  console.log('\n--- TRIGGERING EDIT PLAN LIMITS & MEASURING FORM INPUTS ---');
  // Click first "Edit Plan Limits" button
  const editButtons = page.locator('button:has-text("Edit Plan Limits")');
  await editButtons.first().click();
  await page.waitForTimeout(400);

  // Dark Mode Active Form
  await setTheme('dark');
  await captureScreenshot('super_admin_settings_form_active_dark.png');

  // Measure Dark Mode Inputs
  const darkInputStyles = await page.evaluate(() => {
    // 1. Monthly Price input
    const priceInput = document.querySelector('input[type="number"]') as HTMLInputElement;
    const priceStyle = priceInput ? window.getComputedStyle(priceInput) : null;

    // 2. Feature Limits JSON textarea
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    const textareaStyle = textarea ? window.getComputedStyle(textarea) : null;

    // 3. Default trial days input in section 3
    const allNumberInputs = document.querySelectorAll('input[type="number"]');
    const trialInput = allNumberInputs.length > 1 ? (allNumberInputs[1] as HTMLInputElement) : null;
    const trialStyle = trialInput ? window.getComputedStyle(trialInput) : null;

    // 4. Default tier select
    const select = document.querySelector('select') as HTMLSelectElement;
    const selectStyle = select ? window.getComputedStyle(select) : null;

    // 5. Form label
    const label = document.querySelector('label') as HTMLLabelElement;
    const labelStyle = label ? window.getComputedStyle(label) : null;

    // 6. Save button
    const allButtons = Array.from(document.querySelectorAll('button'));
    const saveBtn = allButtons.find((b) => b.textContent?.includes('Save Changes')) as HTMLButtonElement | undefined;
    const saveBtnStyle = saveBtn ? window.getComputedStyle(saveBtn) : null;

    // 7. Feature flag save button
    const flagSaveBtn = allButtons.find((b) => b.textContent?.includes('Save Feature Flags')) as HTMLButtonElement | undefined;
    const flagSaveBtnStyle = flagSaveBtn ? window.getComputedStyle(flagSaveBtn) : null;

    return {
      price: priceStyle ? { bg: priceStyle.backgroundColor, color: priceStyle.color, border: priceStyle.borderColor } : null,
      textarea: textareaStyle ? { bg: textareaStyle.backgroundColor, color: textareaStyle.color, border: textareaStyle.borderColor } : null,
      trial: trialStyle ? { bg: trialStyle.backgroundColor, color: trialStyle.color, border: trialStyle.borderColor } : null,
      select: selectStyle ? { bg: selectStyle.backgroundColor, color: selectStyle.color, border: selectStyle.borderColor } : null,
      label: labelStyle ? { color: labelStyle.color } : null,
      saveBtn: saveBtnStyle ? { bg: saveBtnStyle.backgroundColor, color: saveBtnStyle.color } : null,
      flagSaveBtn: flagSaveBtnStyle ? { bg: flagSaveBtnStyle.backgroundColor, color: flagSaveBtnStyle.color } : null,
    };
  });

  if (darkInputStyles.price) {
    colorEntries.push({
      view: '/super-admin/settings',
      theme: 'dark',
      element: 'Monthly Price Input',
      backgroundColor: darkInputStyles.price.bg,
      textColor: darkInputStyles.price.color,
      borderColor: darkInputStyles.price.border,
    });
  }
  if (darkInputStyles.textarea) {
    colorEntries.push({
      view: '/super-admin/settings',
      theme: 'dark',
      element: 'Feature Limits JSON Textarea',
      backgroundColor: darkInputStyles.textarea.bg,
      textColor: darkInputStyles.textarea.color,
      borderColor: darkInputStyles.textarea.border,
    });
  }
  if (darkInputStyles.trial) {
    colorEntries.push({
      view: '/super-admin/settings',
      theme: 'dark',
      element: 'Default Trial Days Input',
      backgroundColor: darkInputStyles.trial.bg,
      textColor: darkInputStyles.trial.color,
      borderColor: darkInputStyles.trial.border,
    });
  }
  if (darkInputStyles.select) {
    colorEntries.push({
      view: '/super-admin/settings',
      theme: 'dark',
      element: 'Default Tier Select',
      backgroundColor: darkInputStyles.select.bg,
      textColor: darkInputStyles.select.color,
      borderColor: darkInputStyles.select.border,
    });
  }
  if (darkInputStyles.label) {
    colorEntries.push({
      view: '/super-admin/settings',
      theme: 'dark',
      element: 'Form Field Label',
      backgroundColor: 'transparent',
      textColor: darkInputStyles.label.color,
    });
  }
  if (darkInputStyles.saveBtn) {
    colorEntries.push({
      view: '/super-admin/settings',
      theme: 'dark',
      element: 'Save Changes Button',
      backgroundColor: darkInputStyles.saveBtn.bg,
      textColor: darkInputStyles.saveBtn.color,
    });
  }

  // Light Mode Active Form
  await setTheme('light');
  await captureScreenshot('super_admin_settings_form_active_light.png');

  const lightInputStyles = await page.evaluate(() => {
    const priceInput = document.querySelector('input[type="number"]') as HTMLInputElement;
    const priceStyle = priceInput ? window.getComputedStyle(priceInput) : null;

    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    const textareaStyle = textarea ? window.getComputedStyle(textarea) : null;

    const allNumberInputs = document.querySelectorAll('input[type="number"]');
    const trialInput = allNumberInputs.length > 1 ? (allNumberInputs[1] as HTMLInputElement) : null;
    const trialStyle = trialInput ? window.getComputedStyle(trialInput) : null;

    const label = document.querySelector('label') as HTMLLabelElement;
    const labelStyle = label ? window.getComputedStyle(label) : null;

    const allButtons = Array.from(document.querySelectorAll('button'));
    const saveBtn = allButtons.find((b) => b.textContent?.includes('Save Changes')) as HTMLButtonElement | undefined;
    const saveBtnStyle = saveBtn ? window.getComputedStyle(saveBtn) : null;

    return {
      price: priceStyle ? { bg: priceStyle.backgroundColor, color: priceStyle.color } : null,
      textarea: textareaStyle ? { bg: textareaStyle.backgroundColor, color: textareaStyle.color } : null,
      trial: trialStyle ? { bg: trialStyle.backgroundColor, color: trialStyle.color } : null,
      label: labelStyle ? { color: labelStyle.color } : null,
      saveBtn: saveBtnStyle ? { bg: saveBtnStyle.backgroundColor, color: saveBtnStyle.color } : null,
    };
  });

  if (lightInputStyles.price) {
    colorEntries.push({
      view: '/super-admin/settings',
      theme: 'light',
      element: 'Monthly Price Input',
      backgroundColor: lightInputStyles.price.bg,
      textColor: lightInputStyles.price.color,
    });
  }
  if (lightInputStyles.textarea) {
    colorEntries.push({
      view: '/super-admin/settings',
      theme: 'light',
      element: 'Feature Limits JSON Textarea',
      backgroundColor: lightInputStyles.textarea.bg,
      textColor: lightInputStyles.textarea.color,
    });
  }
  if (lightInputStyles.trial) {
    colorEntries.push({
      view: '/super-admin/settings',
      theme: 'light',
      element: 'Default Trial Days Input',
      backgroundColor: lightInputStyles.trial.bg,
      textColor: lightInputStyles.trial.color,
    });
  }

  // ==========================================
  // VIEW 3: /super-admin/dashboard (Recent Activity Tables)
  // ==========================================
  console.log('\n--- VERIFYING /super-admin/dashboard (RECENT ACTIVITY TABLES) ---');
  await page.goto('http://localhost:3000/super-admin/dashboard', { waitUntil: 'networkidle' });

  // Light Mode Dashboard Activity
  await setTheme('light');
  await captureScreenshot('super_admin_dashboard_activity_light.png');

  // Dark Mode Dashboard Activity
  await setTheme('dark');
  await captureScreenshot('super_admin_dashboard_activity_dark.png');

  // Measure Table Row Text, Timestamps, Actor / Org Names, Badges
  const tableStylesDark = await page.evaluate(() => {
    const tableHeader = document.querySelector('thead th');
    const headerStyle = tableHeader ? window.getComputedStyle(tableHeader) : null;

    const orgLink = document.querySelector('tbody tr td a');
    const orgLinkStyle = orgLink ? window.getComputedStyle(orgLink) : null;

    const monoSlug = document.querySelector('tbody tr td .font-mono');
    const monoSlugStyle = monoSlug ? window.getComputedStyle(monoSlug) : null;

    const planBadge = document.querySelector('tbody tr td span.inline-flex');
    const planBadgeStyle = planBadge ? window.getComputedStyle(planBadge) : null;

    const createdTd = document.querySelector('tbody tr td:last-child');
    const createdStyle = createdTd ? window.getComputedStyle(createdTd) : null;

    const allLinks = Array.from(document.querySelectorAll('a'));
    const inspectBtn = allLinks.find((a) => a.textContent?.includes('Inspect'));
    const inspectBtnStyle = inspectBtn ? window.getComputedStyle(inspectBtn) : null;

    return {
      header: headerStyle ? { color: headerStyle.color } : null,
      orgLink: orgLinkStyle ? { color: orgLinkStyle.color } : null,
      monoSlug: monoSlugStyle ? { color: monoSlugStyle.color } : null,
      planBadge: planBadgeStyle ? { bg: planBadgeStyle.backgroundColor, color: planBadgeStyle.color, border: planBadgeStyle.borderColor } : null,
      created: createdStyle ? { color: createdStyle.color } : null,
      inspectBtn: inspectBtnStyle ? { bg: inspectBtnStyle.backgroundColor, color: inspectBtnStyle.color, border: inspectBtnStyle.borderColor } : null,
    };
  });

  if (tableStylesDark.header) {
    colorEntries.push({
      view: '/super-admin/dashboard',
      theme: 'dark',
      element: 'Recent Activity Table Header',
      backgroundColor: 'transparent',
      textColor: tableStylesDark.header.color,
    });
  }
  if (tableStylesDark.orgLink) {
    colorEntries.push({
      view: '/super-admin/dashboard',
      theme: 'dark',
      element: 'Recent Activity Org Name (Actor)',
      backgroundColor: 'transparent',
      textColor: tableStylesDark.orgLink.color,
    });
  }
  if (tableStylesDark.monoSlug) {
    colorEntries.push({
      view: '/super-admin/dashboard',
      theme: 'dark',
      element: 'Recent Activity Org Slug',
      backgroundColor: 'transparent',
      textColor: tableStylesDark.monoSlug.color,
    });
  }
  if (tableStylesDark.planBadge) {
    colorEntries.push({
      view: '/super-admin/dashboard',
      theme: 'dark',
      element: 'Activity Tier Badge',
      backgroundColor: tableStylesDark.planBadge.bg,
      textColor: tableStylesDark.planBadge.color,
      borderColor: tableStylesDark.planBadge.border,
    });
  }
  if (tableStylesDark.created) {
    colorEntries.push({
      view: '/super-admin/dashboard',
      theme: 'dark',
      element: 'Activity Timestamp Cell',
      backgroundColor: 'transparent',
      textColor: tableStylesDark.created.color,
    });
  }
  if (tableStylesDark.inspectBtn) {
    colorEntries.push({
      view: '/super-admin/dashboard',
      theme: 'dark',
      element: 'Activity Action "Inspect" Button',
      backgroundColor: tableStylesDark.inspectBtn.bg,
      textColor: tableStylesDark.inspectBtn.color,
      borderColor: tableStylesDark.inspectBtn.border,
    });
  }

  // ==========================================
  // VIEW 4: Multi-Route Theme Persistence Journey
  // ==========================================
  console.log('\n--- VERIFYING MULTI-ROUTE JOURNEY ---');
  // Journey in Dark Mode:
  // /super-admin/settings -> /super-admin/dashboard -> /super-admin/organizations -> back to /super-admin/settings
  await setTheme('dark');
  await page.goto('http://localhost:3000/super-admin/settings', { waitUntil: 'networkidle' });
  await page.goto('http://localhost:3000/super-admin/dashboard', { waitUntil: 'networkidle' });
  await page.goto('http://localhost:3000/super-admin/organizations', { waitUntil: 'networkidle' });
  await page.goto('http://localhost:3000/super-admin/settings', { waitUntil: 'networkidle' });

  await captureScreenshot('multi_route_super_admin_9b2_dark.png');

  // Journey in Light Mode:
  await setTheme('light');
  await page.goto('http://localhost:3000/super-admin/settings', { waitUntil: 'networkidle' });
  await page.goto('http://localhost:3000/super-admin/dashboard', { waitUntil: 'networkidle' });
  await page.goto('http://localhost:3000/super-admin/organizations', { waitUntil: 'networkidle' });
  await page.goto('http://localhost:3000/super-admin/settings', { waitUntil: 'networkidle' });

  await captureScreenshot('multi_route_super_admin_9b2_light.png');

  await browser.close();

  // Print results
  console.log('\n=== COMPUTED COLOR RESULTS TABLE ===');
  console.table(colorEntries);

  // Critical Assertions
  const darkPriceBg = darkInputStyles.price?.bg;
  const darkTextareaBg = darkInputStyles.textarea?.bg;
  const darkTrialBg = darkInputStyles.trial?.bg;

  console.log('\n[CRITICAL CHECK] Dark Mode Input Backgrounds:');
  console.log(`  Price Input: ${darkPriceBg}`);
  console.log(`  Textarea: ${darkTextareaBg}`);
  console.log(`  Trial Days: ${darkTrialBg}`);

  const isWhite = (c?: string) => c === 'rgb(255, 255, 255)' || c === '#ffffff';
  if (isWhite(darkPriceBg) || isWhite(darkTextareaBg) || isWhite(darkTrialBg)) {
    console.error('❌ CRITICAL ERROR: Dark mode input background resolved to white!');
    process.exit(1);
  } else {
    console.log('✅ Dark Mode Input Backgrounds resolved to dark theme colors, NOT white!');
  }

  console.log('\n=== SUB-BATCH 9B2 PLAYWRIGHT BROWSER VERIFICATION COMPLETE ===');
}

verifySuperAdmin9B2().catch((err) => {
  console.error('Failed 9B2 verification:', err);
  process.exit(1);
});
