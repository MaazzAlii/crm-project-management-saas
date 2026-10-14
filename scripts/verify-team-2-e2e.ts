import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { spawn, ChildProcess } from 'child_process';
import { query } from '../lib/db';
import { userRepo } from '../lib/db/repositories/user-repo';
import { orgRepo } from '../lib/db/repositories/org-repo';
import bcrypt from 'bcryptjs';

const ARTIFACT_DIR = '/home/maazzalii/.gemini/antigravity-ide/brain/5cf0bc26-e0b2-4113-8af2-1ddd933ffa2c';
const BATCH_ASSETS_DIR = path.join(process.cwd(), 'assets/screenshots/team-2');
fs.mkdirSync(BATCH_ASSETS_DIR, { recursive: true });
fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

// Ensure standalone assets are present
const standaloneStatic = path.join(process.cwd(), '.next/standalone/.next/static');
const standalonePublic = path.join(process.cwd(), '.next/standalone/public');
if (!fs.existsSync(standaloneStatic) && fs.existsSync(path.join(process.cwd(), '.next/static'))) {
  fs.cpSync(path.join(process.cwd(), '.next/static'), standaloneStatic, { recursive: true });
}
if (!fs.existsSync(standalonePublic) && fs.existsSync(path.join(process.cwd(), 'public'))) {
  fs.cpSync(path.join(process.cwd(), 'public'), standalonePublic, { recursive: true });
}

async function verifyTeam2E2E() {
  console.log('=== STARTING TEAM-2 E2E PLAYWRIGHT VERIFICATION ===');

  let serverProcess: ChildProcess | null = null;
  const PORT = '3000';
  const BASE_URL = `http://localhost:${PORT}`;

  // Kill any running server on port 3000 to ensure fresh code
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
    env: { ...process.env, PORT, COOKIE_SECURE: 'false', EMAIL_PROVIDER: 'console' },
    stdio: 'pipe',
  });

  serverProcess.stdout?.on('data', (d) => {
    const line = d.toString();
    if (line.includes('Ready') || line.includes('Listening')) {
      console.log('[Server]', line.trim());
    }
  });

  for (let i = 0; i < 30; i++) {
    await new Promise((res) => setTimeout(res, 500));
    const up = await fetch(`${BASE_URL}/login`).then((r) => r.status < 500).catch(() => false);
    if (up) {
      console.log(`[E2E] Server is up on port ${PORT}!`);
      break;
    }
  }

  // 1. Seed test database data: Owner on Free Plan (max 3 members, 2 pending)
  const ts = Date.now();
  const ownerEmail = `team2_e2e_owner_${ts}@innoventix.io`;
  const ownerPass = 'Team2Password123!';
  const passHash = await bcrypt.hash(ownerPass, 10);

  const owner = await userRepo.create({
    email: ownerEmail,
    fullName: 'Elena Rostova',
    passwordHash: passHash,
    role: 'user',
  });

  const org = await orgRepo.create({
    name: 'Innoventix Growth Labs',
    slug: `innoventix-growth-${ts}`,
    ownerUserId: owner.id,
  });

  console.log(`[E2E] Created owner user: ${ownerEmail}`);
  console.log(`[E2E] Created Free org: ${org.name} (${org.id})`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 950 },
    permissions: ['clipboard-read', 'clipboard-write'],
  });
  const page = await context.newPage();

  async function saveScreenshot(name: string) {
    const assetPath = path.join(BATCH_ASSETS_DIR, name);
    const artifactPath = path.join(ARTIFACT_DIR, name);
    await page.screenshot({ path: assetPath, fullPage: true });
    fs.copyFileSync(assetPath, artifactPath);
    const size = (fs.statSync(assetPath).size / 1024).toFixed(1);
    console.log(`📸 [Screenshot] ${name} (${size} KB) saved to assets and artifacts`);
  }

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.log('[BrowserConsoleError]', msg.text());
    }
  });

  try {
    // 2. Sign in as owner and navigate to /settings/team
    console.log('[E2E] Logging in to /settings/team...');
    await page.goto(`${BASE_URL}/login?redirectTo=/settings/team`, { waitUntil: 'networkidle' });
    await page.fill('input[type="email"]', ownerEmail);
    await page.fill('input[type="password"]', ownerPass);
    await page.click('button[type="submit"]');

    await page.waitForURL('**/settings/team', { timeout: 15000 });
    console.log('[E2E] Landed on /settings/team');

    // 3. Capture 1: Invite dialog — before limit — Light
    console.log('[E2E] Opening Invite Member dialog — Light mode...');
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    });
    await page.waitForTimeout(300);

    const inviteBtn = page.getByRole('button', { name: /Invite Member/i });
    await inviteBtn.click();
    await page.waitForSelector('[data-testid="invite-dialog"]', { state: 'visible' });
    await page.waitForTimeout(500);
    await saveScreenshot('invite_ok_light.png');

    // 4. Capture 2: Invite dialog — before limit — Dark
    console.log('[E2E] Capturing Invite Member dialog — Dark mode...');
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    });
    await page.waitForTimeout(500);
    await saveScreenshot('invite_ok_dark.png');

    // 5. Capture 5: Bulk invite input — Light
    console.log('[E2E] Entering bulk comma-separated emails — Light mode...');
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    });
    const emailInput = page.locator('[data-testid="email-input"]');
    await emailInput.fill('marcus.vance@innoventix.io, sarah.connor@innoventix.io');
    await page.waitForTimeout(400);
    await saveScreenshot('bulk_invite_light.png');

    // 6. Capture 6: Bulk invite input — Dark
    console.log('[E2E] Capturing bulk invite input — Dark mode...');
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    });
    await page.waitForTimeout(400);
    await saveScreenshot('bulk_invite_dark.png');

    // 7. Submit bulk invite to exhaust the 2 pending invitations limit on Free plan
    console.log('[E2E] Submitting bulk invite...');
    const submitBtn = page.getByRole('button', { name: /Send Invite/i });
    await submitBtn.click();

    // Wait for invite dialog to finish and close, and toast to appear
    await page.waitForSelector('[data-testid="invite-toast"]', { state: 'visible', timeout: 20000 });
    console.log('[E2E] Bulk invitations processed successfully');
    await page.waitForTimeout(1000);

    // 8. Re-open Invite Member dialog to verify Seat Limit Reached & Upgrade CTA Card
    console.log('[E2E] Re-opening Invite dialog with exhausted limit...');
    const inviteBtn2 = page.getByRole('button', { name: /Invite Member/i });
    await inviteBtn2.click();
    await page.waitForSelector('[data-testid="invite-dialog"]', { state: 'visible' });
    await page.waitForSelector('[data-testid="upgrade-cta"]', { state: 'visible', timeout: 10000 });
    await page.waitForTimeout(500);

    // 9. Capture 3: Seat limit reached — upgrade CTA visible — Light
    console.log('[E2E] Capturing Seat Limit Reached & Upgrade CTA — Light mode...');
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    });
    await page.waitForTimeout(500);
    await saveScreenshot('seat_limit_cta_light.png');

    // 10. Capture 4: Seat limit reached — upgrade CTA visible — Dark
    console.log('[E2E] Capturing Seat Limit Reached & Upgrade CTA — Dark mode...');
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    });
    await page.waitForTimeout(500);
    await saveScreenshot('seat_limit_cta_dark.png');

    // 11. Verify navigation to /settings/billing upon clicking the Upgrade CTA
    console.log('[E2E] Clicking Upgrade CTA and verifying navigation to /settings/billing...');
    await page.click('[data-testid="upgrade-cta"]');
    await page.waitForURL('**/settings/billing', { timeout: 15000 });
    console.log('✅ Navigation verified: successfully navigated to /settings/billing!');

    console.log('✅ ALL 6 PLAYWRIGHT SCREENSHOTS + NAVIGATION VERIFIED SUCCESSFULLY');
  } catch (err) {
    console.error('[E2E_ERROR]:', err);
    throw err;
  } finally {
    await browser.close();
    if (serverProcess) {
      serverProcess.kill('SIGTERM');
    }
  }
}

verifyTeam2E2E()
  .then(() => {
    process.exit(0);
  })
  .catch((e) => {
    console.error('FAILED:', e);
    process.exit(1);
  });
