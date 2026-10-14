import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { spawn, ChildProcess } from 'child_process';
import { query } from '../lib/db';
import { userRepo } from '../lib/db/repositories/user-repo';
import { orgRepo } from '../lib/db/repositories/org-repo';
import bcrypt from 'bcryptjs';

const ARTIFACT_DIR = '/home/maazzalii/.gemini/antigravity-ide/brain/5cf0bc26-e0b2-4113-8af2-1ddd933ffa2c';
const BATCH_ASSETS_DIR = path.join(process.cwd(), 'assets/screenshots/team-1');
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

async function verifyTeam1E2E() {
  console.log('=== STARTING TEAM-1 E2E PLAYWRIGHT VERIFICATION ===');

  let serverProcess: ChildProcess | null = null;
  const PORT = '3000';
  const BASE_URL = `http://localhost:${PORT}`;

  // Kill any hanging server on port 3000 to ensure fresh code
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

  // 1. Seed test database data
  const ts = Date.now();
  const ownerEmail = `team1_e2e_owner_${ts}@innoventix.io`;
  const ownerPass = 'Team1Password123!';
  const passHash = await bcrypt.hash(ownerPass, 10);

  const owner = await userRepo.create({
    email: ownerEmail,
    fullName: 'Jordan Miller',
    passwordHash: passHash,
    role: 'user',
  });

  const org = await orgRepo.create({
    name: 'Innoventix Cloud Engineering',
    slug: `innoventix-cloud-${ts}`,
    ownerUserId: owner.id,
  });

  // Pre-seed an existing pending invitation
  const existingRawToken = crypto.randomBytes(32).toString('hex');
  const existingTokenHash = crypto.createHash('sha256').update(existingRawToken).digest('hex');
  await query(
    `INSERT INTO invitations (organization_id, email, role, token_hash, invited_by, status, expires_at)
     VALUES ($1, $2, $3, $4, $5, 'pending', NOW() + INTERVAL '7 days')`,
    [org.id, 'marcus.vance@innoventix.io', 'member', existingTokenHash, owner.id]
  );

  // Pre-seed an expired invitation
  const expiredRawToken = crypto.randomBytes(32).toString('hex');
  const expiredTokenHash = crypto.createHash('sha256').update(expiredRawToken).digest('hex');
  await query(
    `INSERT INTO invitations (organization_id, email, role, token_hash, invited_by, status, expires_at)
     VALUES ($1, $2, $3, $4, $5, 'expired', NOW() - INTERVAL '2 days')`,
    [org.id, 'elena.rostova@innoventix.io', 'viewer', expiredTokenHash, owner.id]
  );

  console.log(`[E2E] Created owner user: ${ownerEmail}`);
  console.log(`[E2E] Created organization: ${org.name} (${org.id})`);
  console.log(`[E2E] Seeded expired token: ${expiredRawToken}`);

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

    // 3. Capture 1: Invite Modal Open — Light
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
    await saveScreenshot('invite_modal_light.png');

    // 4. Capture 2: Invite Modal Open — Dark
    console.log('[E2E] Capturing Invite Member dialog — Dark mode...');
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    });
    await page.waitForTimeout(500);
    await saveScreenshot('invite_modal_dark.png');

    // 5. Create an invite from the dialog
    console.log('[E2E] Submitting invite for sophia.chen@innoventix.io...');
    await page.fill('input[type="email"]', 'sophia.chen@innoventix.io');
    const submitBtn = page.getByRole('button', { name: /Send Invite/i });
    await submitBtn.click();

    // Wait for dialog to close and invite toast / copied link button to appear
    await page.waitForSelector('[data-testid="invite-toast"]', { state: 'visible', timeout: 15000 });
    await page.waitForTimeout(500);

    // 6. Capture 3: Invite Created — Success State with Link — Light
    console.log('[E2E] Capturing Invite Created success state — Light...');
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    });
    await page.waitForTimeout(500);
    await saveScreenshot('invite_created_light.png');

    // 7. Capture 4: Invite Created — Success State with Link — Dark
    console.log('[E2E] Capturing Invite Created success state — Dark...');
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    });
    await page.waitForTimeout(500);
    await saveScreenshot('invite_created_dark.png');

    // 8. Capture 5: Pending Invites List — Light
    console.log('[E2E] Capturing Pending Invites list — Light...');
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    });
    await page.waitForSelector('[data-testid="pending-invitations-list"]', { state: 'visible' });
    await page.waitForTimeout(500);
    await saveScreenshot('pending_invites_light.png');

    // 9. Capture 6: Pending Invites List — Dark
    console.log('[E2E] Capturing Pending Invites list — Dark...');
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    });
    await page.waitForTimeout(500);
    await saveScreenshot('pending_invites_dark.png');

    // 10. Test Copy Link on pending invitations list and verify clipboard
    console.log('[E2E] Testing Copy Link on pending invitations row...');
    const copyButton = page.locator('[data-testid^="copy-invite-link-"]').first();
    await copyButton.click();
    await page.waitForTimeout(600);

    const clipboardText = await page.evaluate(async () => {
      try {
        return await navigator.clipboard.readText();
      } catch (err) {
        return `CLIPBOARD_ERROR: ${(err as Error).message}`;
      }
    });
    console.log('CLIPBOARD:', clipboardText);

    // 11. Capture 7: Expired Invite Landing Page — Light
    console.log('[E2E] Navigating to expired invite page — Light...');
    await page.goto(`${BASE_URL}/invite/${expiredRawToken}`, { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    });
    await page.waitForTimeout(500);
    await saveScreenshot('invite_expired_light.png');

    // 12. Capture 8: Expired Invite Landing Page — Dark
    console.log('[E2E] Navigating to expired invite page — Dark...');
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    });
    await page.waitForTimeout(500);
    await saveScreenshot('invite_expired_dark.png');

    console.log('✅ ALL 8 PLAYWRIGHT SCREENSHOTS CAPTURED SUCCESSFULLY');
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

verifyTeam1E2E().catch((e) => {
  console.error('FAILED:', e);
  process.exit(1);
});
