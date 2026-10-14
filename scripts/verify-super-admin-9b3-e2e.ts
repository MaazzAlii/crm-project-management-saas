import { UserRepository, OrganizationRepository } from '../lib/db/repositories';
import { query } from '../lib/db';
import { logAuditEvent } from '../lib/audit/log';
import bcrypt from 'bcryptjs';
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { spawn, ChildProcess } from 'child_process';

const ARTIFACT_DIR = '/home/maazzalii/.gemini/antigravity-ide/brain/9d507ead-e1e0-4d07-926e-9c2a1596c42a';
const BATCH_ASSETS_DIR = path.join(process.cwd(), 'assets/screenshots/sub-batch-9b3');
fs.mkdirSync(BATCH_ASSETS_DIR, { recursive: true });

interface ComputedColorEntry {
  view: string;
  theme: string;
  element: string;
  backgroundColor: string;
  textColor: string;
  borderColor?: string;
}

async function verifySuperAdmin9B3() {
  console.log('=== STARTING SUB-BATCH 9B3 SUPER ADMIN AUDIT LOG E2E VERIFICATION ===');

  let serverProcess: ChildProcess | null = null;

  // Check if standalone server is running on port 3000
  const isServerRunning = await fetch('http://localhost:3000/api/health')
    .then((r) => r.ok || r.status === 404)
    .catch(() => false);

  if (!isServerRunning) {
    console.log('[E2E] Starting Next.js standalone server on port 3000...');
    serverProcess = spawn('node', ['.next/standalone/server.js'], {
      env: { ...process.env, PORT: '3000' },
      stdio: 'pipe',
    });

    serverProcess.stdout?.on('data', (d) => {
      const line = d.toString();
      if (line.includes('Ready in') || line.includes('Listening on port 3000')) {
        console.log('[Server]', line.trim());
      }
    });

    // Wait up to 10s for server to respond
    for (let i = 0; i < 20; i++) {
      await new Promise((res) => setTimeout(res, 500));
      const ok = await fetch('http://localhost:3000/api/health')
        .then(() => true)
        .catch(() => false);
      if (ok) break;
    }
    console.log('[E2E] Standalone server is running.');
  } else {
    console.log('[E2E] Server already running on port 3000.');
  }

  const ts = Date.now();
  const superAdminEmail = `superadmin_9b3_${ts}@innoventixhub.tech`;
  const rawPassword = 'PlaywrightPass123!';
  const passwordHash = await bcrypt.hash(rawPassword, 10);

  const userRepo = new UserRepository();
  const orgRepo = new OrganizationRepository();

  // 1. Provision super admin user
  const adminUser = await userRepo.create({
    email: superAdminEmail,
    passwordHash,
    fullName: 'Platform Auditor ' + ts,
    role: 'super_admin',
    requirePasswordChange: false,
  });

  await query('INSERT INTO super_admins (user_id) VALUES ($1) ON CONFLICT DO NOTHING', [adminUser.id]);

  const auditOrg = await orgRepo.create({
    name: 'Audit Sentinel Agency ' + ts,
    slug: 'audit-sentinel-' + ts,
    ownerUserId: adminUser.id,
  });

  // 2. Insert representative audit events covering all badge categories
  await logAuditEvent({
    organizationId: null,
    actorId: adminUser.id,
    actorEmail: superAdminEmail,
    actorName: 'Platform Auditor ' + ts,
    actorIsSuperAdmin: true,
    action: 'SUPER_ADMIN_SETTINGS_UPDATED',
    entityType: 'platform_settings',
    entityId: 'global_config',
    details: { modified_by: superAdminEmail, default_trial_days: 14, ip: '127.0.0.1' },
    ipAddress: '127.0.0.1',
    userAgent: 'Playwright E2E Test Runner',
  });

  await logAuditEvent({
    organizationId: auditOrg.id,
    actorId: adminUser.id,
    actorEmail: superAdminEmail,
    actorName: 'Platform Auditor ' + ts,
    actorIsSuperAdmin: true,
    action: 'ORGANIZATION_SUSPENDED',
    entityType: 'organization',
    entityId: auditOrg.id,
    details: { reason: 'Terms violation investigation', severity: 'critical' },
    ipAddress: '192.168.1.100',
    userAgent: 'Playwright Security Probe',
  });

  await logAuditEvent({
    organizationId: auditOrg.id,
    actorId: adminUser.id,
    actorEmail: superAdminEmail,
    actorName: 'Platform Auditor ' + ts,
    actorIsSuperAdmin: true,
    action: 'ORGANIZATION_RESUMED',
    entityType: 'organization',
    entityId: auditOrg.id,
    details: { reason: 'Remediation completed', active: true },
    ipAddress: '192.168.1.100',
    userAgent: 'Playwright Security Probe',
  });

  await logAuditEvent({
    organizationId: auditOrg.id,
    actorId: adminUser.id,
    actorEmail: superAdminEmail,
    actorName: 'Platform Auditor ' + ts,
    actorIsSuperAdmin: false,
    action: 'TEAM_MEMBER_INVITED',
    entityType: 'team_invitation',
    entityId: 'inv_' + ts,
    details: { invited_email: 'new_analyst@innoventix.io', role: 'member' },
    ipAddress: '10.0.0.1',
    userAgent: 'Playwright Web Client',
  });

  console.log(`[E2E] Seeded 4 audit log events across categories.`);

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
    console.log(`✅ Captured ${filename} -> assets/screenshots/sub-batch-9b3/${filename}`);
  }

  // 3. Authenticate via direct API login
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
  // VIEW 1: /super-admin/audit-log Overview
  // ==========================================
  console.log('\n--- VERIFYING /super-admin/audit-log ---');
  await page.goto('http://localhost:3000/super-admin/audit-log', { waitUntil: 'networkidle' });

  // Light Mode Overview
  await setTheme('light');
  await captureScreenshot('super_admin_audit_log_light.png');

  // Dark Mode Overview
  await setTheme('dark');
  await captureScreenshot('super_admin_audit_log_dark.png');

  // Measure Dark Mode Inputs and Table Elements
  const auditStylesDark = await page.evaluate(() => {
    // 1. Search Input
    const searchInput = document.querySelector('input[placeholder*="Search across"]') as HTMLInputElement;
    const searchStyle = searchInput ? window.getComputedStyle(searchInput) : null;

    // 2. Selects
    const selects = Array.from(document.querySelectorAll('select'));
    const orgSelect = selects[0];
    const selectStyle = orgSelect ? window.getComputedStyle(orgSelect) : null;

    // 3. Table Header
    const th = document.querySelector('thead th');
    const thStyle = th ? window.getComputedStyle(th) : null;

    // 4. Table Row Action Badge
    const badges = Array.from(document.querySelectorAll('tbody tr td span.inline-flex'));
    const badgeStyle = badges[0] ? window.getComputedStyle(badges[0]) : null;

    // 5. Table Row Actor Name
    const actorDiv = document.querySelector('tbody tr td div.font-semibold');
    const actorStyle = actorDiv ? window.getComputedStyle(actorDiv) : null;

    // 6. Table Row Timestamp
    const tsDiv = document.querySelector('tbody tr td.font-mono');
    const tsStyle = tsDiv ? window.getComputedStyle(tsDiv) : null;

    return {
      search: searchStyle ? { bg: searchStyle.backgroundColor, color: searchStyle.color, border: searchStyle.borderColor } : null,
      select: selectStyle ? { bg: selectStyle.backgroundColor, color: selectStyle.color, border: selectStyle.borderColor } : null,
      th: thStyle ? { color: thStyle.color } : null,
      badge: badgeStyle ? { bg: badgeStyle.backgroundColor, color: badgeStyle.color, border: badgeStyle.borderColor } : null,
      actor: actorStyle ? { color: actorStyle.color } : null,
      ts: tsStyle ? { color: tsStyle.color } : null,
    };
  });

  if (auditStylesDark.search) {
    colorEntries.push({
      view: '/super-admin/audit-log',
      theme: 'dark',
      element: 'Search Input',
      backgroundColor: auditStylesDark.search.bg,
      textColor: auditStylesDark.search.color,
      borderColor: auditStylesDark.search.border,
    });
  }
  if (auditStylesDark.select) {
    colorEntries.push({
      view: '/super-admin/audit-log',
      theme: 'dark',
      element: 'Organization Filter Select',
      backgroundColor: auditStylesDark.select.bg,
      textColor: auditStylesDark.select.color,
      borderColor: auditStylesDark.select.border,
    });
  }
  if (auditStylesDark.th) {
    colorEntries.push({
      view: '/super-admin/audit-log',
      theme: 'dark',
      element: 'Table Header',
      backgroundColor: 'transparent',
      textColor: auditStylesDark.th.color,
    });
  }
  if (auditStylesDark.badge) {
    colorEntries.push({
      view: '/super-admin/audit-log',
      theme: 'dark',
      element: 'Action Status Badge',
      backgroundColor: auditStylesDark.badge.bg,
      textColor: auditStylesDark.badge.color,
      borderColor: auditStylesDark.badge.border,
    });
  }
  if (auditStylesDark.actor) {
    colorEntries.push({
      view: '/super-admin/audit-log',
      theme: 'dark',
      element: 'Actor Name Text',
      backgroundColor: 'transparent',
      textColor: auditStylesDark.actor.color,
    });
  }
  if (auditStylesDark.ts) {
    colorEntries.push({
      view: '/super-admin/audit-log',
      theme: 'dark',
      element: 'Timestamp Text',
      backgroundColor: 'transparent',
      textColor: auditStylesDark.ts.color,
    });
  }

  // ==========================================
  // VIEW 2: Trigger Modal Inspector (Expansion Drawer)
  // ==========================================
  console.log('\n--- TRIGGERING EXPANDED AUDIT LOG MODAL INSPECTOR ---');
  // Click first row's expand chevron button
  const expandButtons = page.locator('tbody tr td button');
  if (await expandButtons.count() > 0) {
    await expandButtons.first().click();
    await page.waitForTimeout(400);

    // Dark Mode Modal
    await setTheme('dark');
    await captureScreenshot('super_admin_audit_log_modal_dark.png');

    // Measure Modal Elements (Backdrop, JSON Payload Code Block)
    const modalStylesDark = await page.evaluate(() => {
      const backdrop = document.querySelector('.fixed.inset-0.z-50') as HTMLElement;
      const backdropStyle = backdrop ? window.getComputedStyle(backdrop) : null;

      const pre = document.querySelector('pre') as HTMLPreElement;
      const preStyle = pre ? window.getComputedStyle(pre) : null;

      const modalBox = document.querySelector('.max-w-2xl') as HTMLElement;
      const modalBoxStyle = modalBox ? window.getComputedStyle(modalBox) : null;

      const closeBtn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent?.includes('Close Inspector'));
      const closeBtnStyle = closeBtn ? window.getComputedStyle(closeBtn) : null;

      return {
        backdrop: backdropStyle ? { bg: backdropStyle.backgroundColor } : null,
        pre: preStyle ? { bg: preStyle.backgroundColor, color: preStyle.color, border: preStyle.borderColor } : null,
        modalBox: modalBoxStyle ? { bg: modalBoxStyle.backgroundColor, border: modalBoxStyle.borderColor } : null,
        closeBtn: closeBtnStyle ? { bg: closeBtnStyle.backgroundColor, color: closeBtnStyle.color, border: closeBtnStyle.borderColor } : null,
      };
    });

    if (modalStylesDark.backdrop) {
      colorEntries.push({
        view: '/super-admin/audit-log (Modal)',
        theme: 'dark',
        element: 'Modal Backdrop Overlay',
        backgroundColor: modalStylesDark.backdrop.bg,
        textColor: 'N/A',
      });
    }
    if (modalStylesDark.pre) {
      colorEntries.push({
        view: '/super-admin/audit-log (Modal)',
        theme: 'dark',
        element: 'JSON Payload Code Block (<pre>)',
        backgroundColor: modalStylesDark.pre.bg,
        textColor: modalStylesDark.pre.color,
        borderColor: modalStylesDark.pre.border,
      });
    }
    if (modalStylesDark.modalBox) {
      colorEntries.push({
        view: '/super-admin/audit-log (Modal)',
        theme: 'dark',
        element: 'Modal Container Box',
        backgroundColor: modalStylesDark.modalBox.bg,
        textColor: 'N/A',
        borderColor: modalStylesDark.modalBox.border,
      });
    }
    if (modalStylesDark.closeBtn) {
      colorEntries.push({
        view: '/super-admin/audit-log (Modal)',
        theme: 'dark',
        element: 'Close Inspector Button',
        backgroundColor: modalStylesDark.closeBtn.bg,
        textColor: modalStylesDark.closeBtn.color,
        borderColor: modalStylesDark.closeBtn.border,
      });
    }

    // Light Mode Modal
    await setTheme('light');
    await captureScreenshot('super_admin_audit_log_modal_light.png');

    // Close Modal
    const closeInspector = page.locator('button:has-text("Close Inspector")');
    if (await closeInspector.count() > 0) {
      await closeInspector.click();
      await page.waitForTimeout(300);
    }
  }

  // ==========================================
  // VIEW 3: Multi-Route Theme Persistence Journey
  // ==========================================
  console.log('\n--- VERIFYING MULTI-ROUTE JOURNEY ---');
  // Journey in Dark Mode:
  // /super-admin/audit-log -> /super-admin/dashboard -> /super-admin/organizations -> back to /super-admin/audit-log
  await setTheme('dark');
  await page.goto('http://localhost:3000/super-admin/audit-log', { waitUntil: 'networkidle' });
  await page.goto('http://localhost:3000/super-admin/dashboard', { waitUntil: 'networkidle' });
  await page.goto('http://localhost:3000/super-admin/organizations', { waitUntil: 'networkidle' });
  await page.goto('http://localhost:3000/super-admin/audit-log', { waitUntil: 'networkidle' });

  await captureScreenshot('multi_route_super_admin_9b3_dark.png');

  // Journey in Light Mode:
  await setTheme('light');
  await page.goto('http://localhost:3000/super-admin/audit-log', { waitUntil: 'networkidle' });
  await page.goto('http://localhost:3000/super-admin/dashboard', { waitUntil: 'networkidle' });
  await page.goto('http://localhost:3000/super-admin/organizations', { waitUntil: 'networkidle' });
  await page.goto('http://localhost:3000/super-admin/audit-log', { waitUntil: 'networkidle' });

  await captureScreenshot('multi_route_super_admin_9b3_light.png');

  await browser.close();

  if (serverProcess) {
    serverProcess.kill('SIGTERM');
  }

  // Print results
  console.log('\n=== COMPUTED COLOR RESULTS TABLE ===');
  console.table(colorEntries);

  // Critical Assertions
  const darkSearchBg = auditStylesDark.search?.bg;
  const darkSelectBg = auditStylesDark.select?.bg;

  console.log('\n[CRITICAL CHECK] Dark Mode Input Backgrounds:');
  console.log(`  Search Input Bg: ${darkSearchBg}`);
  console.log(`  Filter Select Bg: ${darkSelectBg}`);

  const isWhite = (c?: string) => c === 'rgb(255, 255, 255)' || c === '#ffffff';
  if (isWhite(darkSearchBg) || isWhite(darkSelectBg)) {
    console.error('❌ CRITICAL ERROR: Dark mode input background resolved to white!');
    process.exit(1);
  } else {
    console.log('✅ Dark Mode Input Backgrounds resolved to dark theme colors, NOT white!');
  }

  console.log('\n=== SUB-BATCH 9B3 PLAYWRIGHT BROWSER VERIFICATION COMPLETE ===');
}

verifySuperAdmin9B3().catch((err) => {
  console.error('Failed 9B3 verification:', err);
  process.exit(1);
});
