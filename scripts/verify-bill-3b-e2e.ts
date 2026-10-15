import { chromium, Page } from 'playwright';
import path from 'path';
import fs from 'fs';
import { spawn, ChildProcess } from 'child_process';
import { generateAccessToken } from '../lib/auth/jwt';
import { query } from '../lib/db';
import { invalidatePlanCache } from '../lib/billing/current-plan';

const ARTIFACT_DIR = '/home/maazzalii/.gemini/antigravity-ide/brain/805948a2-ee1e-43c5-a4ef-cf38e1068ca3';
const BATCH_ASSETS_DIR = path.join(process.cwd(), 'assets/screenshots/bill-3b');
fs.mkdirSync(BATCH_ASSETS_DIR, { recursive: true });
fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

function copyToArtifact(filename: string) {
  const src = path.join(BATCH_ASSETS_DIR, filename);
  const dst = path.join(ARTIFACT_DIR, filename);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dst);
    console.log(`[E2E] Copied artifact: ${filename}`);
  }
}

async function setTheme(page: Page, theme: 'light' | 'dark') {
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
  await page.waitForTimeout(400);
}

async function verifyBill3BE2E() {
  console.log('=== STARTING BILL-3B E2E PLAYWRIGHT VERIFICATION ===');

  let serverProcess: ChildProcess | null = null;
  const PORT = '3000';
  const BASE_URL = `http://localhost:${PORT}`;

  // Ensure standalone assets are synced
  const standaloneStatic = path.join(process.cwd(), '.next/standalone/.next/static');
  const standalonePublic = path.join(process.cwd(), '.next/standalone/public');
  if (fs.existsSync(path.join(process.cwd(), '.next/static'))) {
    fs.cpSync(path.join(process.cwd(), '.next/static'), standaloneStatic, { recursive: true });
  }
  if (fs.existsSync(path.join(process.cwd(), 'public'))) {
    fs.cpSync(path.join(process.cwd(), 'public'), standalonePublic, { recursive: true });
  }

  // Free port 3000 if occupied
  try {
    const pids = require('child_process').execSync(`lsof -t -i:${PORT} || true`).toString().trim();
    if (pids) {
      console.log(`[E2E] Freeing port ${PORT} (PID ${pids})...`);
      for (const pid of pids.split('\n')) {
        try { process.kill(Number(pid), 'SIGKILL'); } catch {}
      }
      await new Promise((r) => setTimeout(r, 1000));
    }
  } catch {}

  console.log(`[E2E] Starting standalone server on port ${PORT}...`);
  serverProcess = spawn('node', ['.next/standalone/server.js'], {
    env: { ...process.env, PORT, COOKIE_SECURE: 'false' },
    stdio: 'pipe',
  });

  serverProcess.stdout?.on('data', (d) => {
    const line = d.toString();
    if (line.includes('Listening on port') || line.includes('Ready in')) {
      console.log(`[Server] ${line.trim()}`);
    }
  });

  serverProcess.stderr?.on('data', (d) => {
    console.error(`[Server Err] ${d.toString().trim()}`);
  });

  // Wait for server readiness
  let ready = false;
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`${BASE_URL}/login`);
      if (res.ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }

  if (!ready) {
    console.error('[E2E] Standalone server failed to start within timeout');
    serverProcess?.kill('SIGKILL');
    process.exit(1);
  }

  console.log('[E2E] Standalone server is ready.');

  // Target test organization
  const TEST_ORG_ID = '0025e57d-f662-4c28-a325-4d38a144c48e';
  const SUPER_ADMIN_ID = '31a52cea-7af8-4cb8-aefe-3d014e69f865';
  const SUPER_ADMIN_EMAIL = 'admin@innoventix.io';

  // Step 0: Ensure test org has clean no-override state
  console.log('[E2E] Resetting test org override state...');
  await query(
    `UPDATE organization_plans
     SET plan_override = NULL,
         plan_override_expires_at = NULL,
         plan_override_granted_by = NULL,
         plan_override_granted_at = NULL,
         plan_override_note = NULL
     WHERE organization_id = $1`,
    [TEST_ORG_ID]
  );
  invalidatePlanCache(TEST_ORG_ID);

  // Mint super admin JWT
  const accessToken = generateAccessToken({
    userId: SUPER_ADMIN_ID,
    email: SUPER_ADMIN_EMAIL,
    role: 'super_admin',
  });

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 1100 },
  });

  // Add auth cookies
  await context.addCookies([
    {
      name: 'innoventix_session',
      value: accessToken,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
    },
    {
      name: 'organization_id',
      value: TEST_ORG_ID,
      domain: 'localhost',
      path: '/',
      sameSite: 'Lax',
    },
  ]);

  const page = await context.newPage();

  try {
    const orgDetailUrl = `${BASE_URL}/super-admin/organizations/${TEST_ORG_ID}`;
    console.log(`[E2E] Navigating to ${orgDetailUrl}...`);
    await page.goto(orgDetailUrl, { waitUntil: 'networkidle' });

    // Wait for PlanOverrideCard to mount
    await page.waitForSelector('[data-testid="grant-override-btn"]', { timeout: 15000 });

    // ─────────────────────────────────────────────────────────────
    // 1. override_none_light.png
    // ─────────────────────────────────────────────────────────────
    console.log('[E2E] Capturing override_none_light.png...');
    await setTheme(page, 'light');
    const p1 = path.join(BATCH_ASSETS_DIR, 'override_none_light.png');
    await page.screenshot({ path: p1, fullPage: false });
    copyToArtifact('override_none_light.png');

    // ─────────────────────────────────────────────────────────────
    // 2. override_none_dark.png
    // ─────────────────────────────────────────────────────────────
    console.log('[E2E] Capturing override_none_dark.png...');
    await setTheme(page, 'dark');
    const p2 = path.join(BATCH_ASSETS_DIR, 'override_none_dark.png');
    await page.screenshot({ path: p2, fullPage: false });
    copyToArtifact('override_none_dark.png');

    // ─────────────────────────────────────────────────────────────
    // 3. Open Grant Modal & capture grant_modal_dark.png
    // ─────────────────────────────────────────────────────────────
    console.log('[E2E] Opening Grant Modal in dark mode...');
    await page.click('[data-testid="grant-override-btn"]');
    await page.waitForSelector('[data-testid="confirm-grant-btn"]', { state: 'visible', timeout: 5000 });
    await page.waitForTimeout(300);

    const p3 = path.join(BATCH_ASSETS_DIR, 'grant_modal_dark.png');
    await page.screenshot({ path: p3, fullPage: false });
    copyToArtifact('grant_modal_dark.png');

    // ─────────────────────────────────────────────────────────────
    // 4. grant_modal_light.png
    // ─────────────────────────────────────────────────────────────
    console.log('[E2E] Capturing grant_modal_light.png in light mode...');
    await setTheme(page, 'light');
    const p4 = path.join(BATCH_ASSETS_DIR, 'grant_modal_light.png');
    await page.screenshot({ path: p4, fullPage: false });
    copyToArtifact('grant_modal_light.png');

    // ─────────────────────────────────────────────────────────────
    // 5. Grant 3-Month Override & capture override_active_light.png
    // ─────────────────────────────────────────────────────────────
    console.log('[E2E] Selecting 3 Months duration option and adding note...');
    await page.click('[data-testid="duration-opt-3_month"]');
    await page.fill(
      '[data-testid="override-note-input"]',
      'Sponsored Beta Partnership grant approved by Platform Super-Admin.'
    );
    await page.waitForTimeout(300);

    console.log('[E2E] Submitting grant override...');
    await page.click('[data-testid="confirm-grant-btn"]');

    // Wait for modal to close and active override elements to appear
    await page.waitForSelector('[data-testid="revoke-override-btn"]', { state: 'visible', timeout: 10000 });
    await page.waitForTimeout(1000);
    // Reload page to guarantee full server render with fresh entitlements
    await page.goto(orgDetailUrl, { waitUntil: 'networkidle' });
    await setTheme(page, 'light');
    await page.waitForSelector('[data-testid="revoke-override-btn"]', { state: 'visible', timeout: 10000 });

    console.log('[E2E] Capturing override_active_light.png...');
    const p5 = path.join(BATCH_ASSETS_DIR, 'override_active_light.png');
    await page.screenshot({ path: p5, fullPage: false });
    copyToArtifact('override_active_light.png');

    // ─────────────────────────────────────────────────────────────
    // 6. Open Revoke Modal & capture revoke_modal_light.png
    // ─────────────────────────────────────────────────────────────
    console.log('[E2E] Opening Revoke Confirmation Modal...');
    await page.click('[data-testid="revoke-override-btn"]');
    await page.waitForSelector('[data-testid="confirm-revoke-btn"]', { state: 'visible', timeout: 5000 });
    await page.waitForTimeout(300);

    console.log('[E2E] Capturing revoke_modal_light.png...');
    const p6 = path.join(BATCH_ASSETS_DIR, 'revoke_modal_light.png');
    await page.screenshot({ path: p6, fullPage: false });
    copyToArtifact('revoke_modal_light.png');

    // ─────────────────────────────────────────────────────────────
    // Cleanup: Confirm Revocation
    // ─────────────────────────────────────────────────────────────
    console.log('[E2E] Confirming Revoke to cleanup test state...');
    await page.click('[data-testid="confirm-revoke-btn"]');
    await page.waitForSelector('[data-testid="grant-override-btn"]', { state: 'visible', timeout: 10000 });
    await page.waitForTimeout(500);

    // Verify DB cleaned up
    const finalCheck = await query(
      `SELECT plan_override FROM organization_plans WHERE organization_id = $1`,
      [TEST_ORG_ID]
    );
    console.log(`[E2E] Final DB plan_override check:`, finalCheck.rows[0]?.plan_override ?? 'null');

    console.log('=== BILL-3B PLAYWRIGHT E2E COMPLETED SUCCESSFULLY ===');
  } catch (err) {
    console.error('[E2E] Error encountered during test:', err);
    throw err;
  } finally {
    await browser.close();
    if (serverProcess) {
      console.log('[E2E] Stopping standalone server...');
      serverProcess.kill('SIGKILL');
    }
  }
}

verifyBill3BE2E()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
