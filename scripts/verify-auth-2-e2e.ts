import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { spawn, ChildProcess } from 'child_process';
import { query } from '../lib/db';
import { userRepo } from '../lib/db/repositories/user-repo';
import { orgRepo } from '../lib/db/repositories/org-repo';
import bcrypt from 'bcryptjs';

const ARTIFACT_DIR = '/home/maazzalii/.gemini/antigravity-ide/brain/14ad1ea3-4d08-4064-a0d2-19239f235c28';
const BATCH_ASSETS_DIR = path.join(process.cwd(), 'assets/screenshots/auth-2');
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

async function verifyAuth2E2E() {
  console.log('=== STARTING AUTH-2 E2E PLAYWRIGHT VERIFICATION ===');

  let serverProcess: ChildProcess | null = null;
  const PORT = '3000';
  const BASE_URL = `http://localhost:${PORT}`;

  // Ensure standalone assets are present
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
      console.log(`[E2E] Server ready on ${BASE_URL}`);
      break;
    }
  }

  // Seed test user with unverified email
  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const password = 'Password123!';
  const passwordHash = await bcrypt.hash(password, 10);

  const unverifiedEmail = `auth2_unverified_${id}@example.com`;
  const unverifiedUser = await userRepo.create({
    email: unverifiedEmail,
    fullName: 'Alex Unverified',
    passwordHash,
  });
  // Explicitly ensure email_verified = false
  await query(`UPDATE users SET email_verified = false, email_verified_at = NULL WHERE id = $1`, [unverifiedUser.id]);

  const org = await orgRepo.create({
    name: `Auth2 Verification Org ${id}`,
    slug: `auth2-org-${id}`,
    ownerUserId: unverifiedUser.id,
  });

  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

    // Step A: Rate Limit Verification on /sign-in
    console.log('[E2E] Testing 20 rapid loads of /sign-in...');
    const statuses: number[] = [];
    for (let i = 0; i < 20; i++) {
      const res = await page.goto(`${BASE_URL}/sign-in`);
      if (res) statuses.push(res.status());
    }
    console.log('SIGN-IN STATUSES:', statuses);
    const all200 = statuses.length === 20 && statuses.every((s) => s === 200);
    console.log(`[E2E] All 20 rapid /sign-in requests returned 200: ${all200}`);

    // Step 1: Signup form — empty state — Light
    await page.goto(`${BASE_URL}/signup`);
    await page.waitForSelector('form');
    // Ensure Light theme
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark');
    });
    await page.waitForTimeout(400);
    const path1 = path.join(BATCH_ASSETS_DIR, 'signup_empty_light.png');
    await page.screenshot({ path: path1, fullPage: true });
    copyToArtifact('signup_empty_light.png');

    // Step 2: Signup form — empty state — Dark
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });
    await page.waitForTimeout(400);
    const path2 = path.join(BATCH_ASSETS_DIR, 'signup_empty_dark.png');
    await page.screenshot({ path: path2, fullPage: true });
    copyToArtifact('signup_empty_dark.png');

    // Step 3: Signup form — with field errors shown — Dark
    // Submit empty or invalid to trigger inline validation errors
    await page.click('button[type="submit"]');
    await page.waitForTimeout(600);
    const path4 = path.join(BATCH_ASSETS_DIR, 'signup_errors_dark.png');
    await page.screenshot({ path: path4, fullPage: true });
    copyToArtifact('signup_errors_dark.png');

    // Step 4: Signup form — with field errors shown — Light
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark');
    });
    await page.waitForTimeout(400);
    const path3 = path.join(BATCH_ASSETS_DIR, 'signup_errors_light.png');
    await page.screenshot({ path: path3, fullPage: true });
    copyToArtifact('signup_errors_light.png');

    // Step 5: Unverified banner — Light
    // Login as unverified user
    await page.goto(`${BASE_URL}/login`);
    await page.waitForSelector('form');
    await page.fill('input[type="email"]', unverifiedEmail);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');

    await page.waitForURL('**/dashboard**', { timeout: 10000 });
    await page.waitForSelector('[data-testid="email-verification-banner"]', { timeout: 6000 });

    // Light mode
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark');
    });
    await page.waitForTimeout(500);
    const path5 = path.join(BATCH_ASSETS_DIR, 'unverified_banner_light.png');
    await page.screenshot({ path: path5, fullPage: false });
    copyToArtifact('unverified_banner_light.png');

    // Step 6: Unverified banner — Dark
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });
    await page.waitForTimeout(500);
    const path6 = path.join(BATCH_ASSETS_DIR, 'unverified_banner_dark.png');
    await page.screenshot({ path: path6, fullPage: false });
    copyToArtifact('unverified_banner_dark.png');

    console.log('=== AUTH-2 E2E SCREENSHOTS SUCCESSFULLY CAPTURED ===');
  } finally {
    await browser.close();
    if (serverProcess) {
      serverProcess.kill('SIGTERM');
    }
    // Clean up test seed data
    try {
      await query(`DELETE FROM organizations WHERE id = $1`, [org.id]);
      await query(`DELETE FROM users WHERE id = $1`, [unverifiedUser.id]);
      console.log('[E2E] Cleaned up test seed data');
    } catch {}
  }
}

verifyAuth2E2E().catch((err) => {
  console.error('[E2E_ERROR]', err);
  process.exit(1);
});
