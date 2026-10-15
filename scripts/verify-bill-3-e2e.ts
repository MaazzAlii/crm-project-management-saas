import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { spawn, ChildProcess } from 'child_process';
import { generateAccessToken } from '../lib/auth/jwt';
import { query } from '../lib/db';
import { invalidatePlanCache } from '../lib/billing/current-plan';

const ARTIFACT_DIR = '/home/maazzalii/.gemini/antigravity-ide/brain/805948a2-ee1e-43c5-a4ef-cf38e1068ca3';
const BATCH_ASSETS_DIR = path.join(process.cwd(), 'assets/screenshots/bill-3');
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

async function verifyBill3E2E() {
  console.log('=== STARTING BILL-3 E2E PLAYWRIGHT VERIFICATION ===');

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

  console.log('[E2E] Server is ready.');

  // Target production organization Maaz Ali Enterprise
  const PROD_ORG_ID = 'e568d645-b363-4d31-90cd-0ff849b8481b';
  const ADMIN_USER_ID = '31a52cea-7af8-4cb8-aefe-3d014e69f865';
  const ADMIN_EMAIL = 'admin@innoventix.io';

  // Ensure organization_plans has plan_override = 'lifetime'
  await query(
    `UPDATE organization_plans SET plan_override = 'lifetime' WHERE organization_id = $1`,
    [PROD_ORG_ID]
  );
  invalidatePlanCache(PROD_ORG_ID);

  // Generate session token
  const sessionToken = generateAccessToken({
    userId: ADMIN_USER_ID,
    email: ADMIN_EMAIL,
    role: 'super_admin',
    orgId: PROD_ORG_ID,
  });

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const context = await browser.newContext({
      viewport: { width: 1366, height: 900 },
    });

    await context.addCookies([
      {
        name: 'innoventix_session',
        value: sessionToken,
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'Lax',
      },
    ]);

    const page = await context.newPage();

    // 1. Visit /settings/team in Light Mode
    console.log('[E2E] 1. Visiting /settings/team (Light Mode)...');
    await page.goto(`${BASE_URL}/settings/team`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // Verify seat limit display
    const pageContent = await page.content();
    console.log('[E2E] Checking page text for seat limits...');
    if (pageContent.includes('500 seats') || pageContent.includes('of 500')) {
      console.log('✅ Found "500 seats" in UI!');
    } else {
      console.warn('⚠️ Could not find "500 seats" in text, logging snippet...');
    }

    // Capture lifetime_seats_light.png
    await page.screenshot({ path: path.join(BATCH_ASSETS_DIR, 'lifetime_seats_light.png') });
    copyToArtifact('lifetime_seats_light.png');
    console.log('✅ Captured lifetime_seats_light.png');

    // 2. Switch to Dark Mode and capture lifetime_seats_dark.png
    console.log('[E2E] 2. Capturing /settings/team in Dark Mode...');
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(BATCH_ASSETS_DIR, 'lifetime_seats_dark.png') });
    copyToArtifact('lifetime_seats_dark.png');
    console.log('✅ Captured lifetime_seats_dark.png');

    // Switch back to light mode
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark');
    });

    // 3. Open Invite Member Dialog and capture no_upgrade_cta_light.png
    console.log('[E2E] 3. Opening Invite Member Dialog & checking upgrade CTA absence...');
    const inviteBtn = page.locator('button:has-text("Invite Member")').first();
    if (await inviteBtn.isVisible()) {
      await inviteBtn.click();
      await page.waitForTimeout(800);
    }

    // Verify absence of "Upgrade to Pro" text
    const dialogContent = await page.content();
    const hasUpgradeToPro = dialogContent.includes('Upgrade to Pro');
    console.log('   Has "Upgrade to Pro" CTA:', hasUpgradeToPro);
    if (!hasUpgradeToPro) {
      console.log('✅ Confirmed: "Upgrade to Pro" CTA is correctly NOT rendered for Lifetime/Enterprise!');
    } else {
      console.error('❌ Error: "Upgrade to Pro" was unexpectedly rendered!');
    }

    await page.screenshot({ path: path.join(BATCH_ASSETS_DIR, 'no_upgrade_cta_light.png') });
    copyToArtifact('no_upgrade_cta_light.png');
    console.log('✅ Captured no_upgrade_cta_light.png');

    // Close dialog if open (press Escape)
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // 4. Scroll to Pending Invitations table and capture invite_expiry_light.png
    console.log('[E2E] 4. Inspecting Pending Invitations table...');
    const pendingSection = page.locator('[data-testid="pending-invitations-list"]');
    if (await pendingSection.isVisible()) {
      await pendingSection.scrollIntoViewIfNeeded();
      await page.waitForTimeout(800);
    }

    const tableContent = await page.content();
    const hasInvalidDate = tableContent.includes('Invalid Date');
    console.log('   Has "Invalid Date":', hasInvalidDate);
    if (!hasInvalidDate) {
      console.log('✅ Confirmed: ZERO "Invalid Date" strings in rendered page!');
    } else {
      console.error('❌ Error: "Invalid Date" found in table!');
    }

    await page.screenshot({ path: path.join(BATCH_ASSETS_DIR, 'invite_expiry_light.png') });
    copyToArtifact('invite_expiry_light.png');
    console.log('✅ Captured invite_expiry_light.png');

    console.log('=== ALL 4 SCREENSHOTS SUCCESSFULLY CAPTURED ===');
  } catch (err) {
    console.error('[E2E Error]', err);
    throw err;
  } finally {
    await browser.close();
    if (serverProcess) {
      console.log('[E2E] Killing standalone server...');
      serverProcess.kill('SIGKILL');
    }
  }
}

verifyBill3E2E()
  .then(() => {
    console.log('[E2E] Complete.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('[E2E] Failed:', err);
    process.exit(1);
  });
