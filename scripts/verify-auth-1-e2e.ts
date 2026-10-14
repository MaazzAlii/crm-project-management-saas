import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { spawn, ChildProcess } from 'child_process';
import { query } from '../lib/db';
import { userRepo } from '../lib/db/repositories/user-repo';
import { createPasswordResetToken } from '../lib/auth/password-reset';
import bcrypt from 'bcryptjs';

const ARTIFACT_DIR = '/home/maazzalii/.gemini/antigravity-ide/brain/5cf0bc26-e0b2-4113-8af2-1ddd933ffa2c';
const BATCH_ASSETS_DIR = path.join(process.cwd(), 'assets/screenshots/auth-1');
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

interface SegmentStyle {
  state: string;
  segment1: string;
  segment2: string;
  segment3: string;
  segment4: string;
  text: string;
}

async function verifyAuth1E2E() {
  console.log('=== STARTING AUTH-1 E2E PLAYWRIGHT VERIFICATION ===');

  let serverProcess: ChildProcess | null = null;
  const PORT = '3000';
  const BASE_URL = `http://localhost:${PORT}`;

  // Check if server is running
  const isServerRunning = await fetch(`${BASE_URL}/api/health`)
    .then((r) => r.ok || r.status === 404)
    .catch(() => false);

  if (!isServerRunning) {
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
      const up = await fetch(`${BASE_URL}/reset-password`).then((r) => r.status < 500).catch(() => false);
      if (up) {
        console.log(`[E2E] Server is up on port ${PORT}!`);
        break;
      }
    }
  } else {
    console.log(`[E2E] Server is already running on port ${PORT}`);
  }

  // Create a verified user and generate a reset token
  const ts = Date.now();
  const testEmail = `auth1_e2e_${ts}@example.com`;
  const hash = await bcrypt.hash('OldSecretPass123!', 10);
  await userRepo.create({
    email: testEmail,
    fullName: 'Auth-1 E2E User',
    passwordHash: hash,
    role: 'user',
  });

  const resetResult = await createPasswordResetToken(testEmail);
  const resetToken = resetResult?.token || 'test-token';
  console.log(`[E2E] Generated reset token for ${testEmail}: ${resetToken}`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
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

  page.on('console', (msg) => console.log('[BrowserConsole]', msg.text()));
  page.on('pageerror', (err) => console.log('[BrowserError]', err.message));
  page.on('response', (res) => {
    if (res.url().includes('/api/auth/')) {
      console.log(`[API Response] ${res.status()} ${res.url()}`);
    }
  });

  try {
    // 1. /forgot-password — Light
    console.log('[E2E] Capturing /forgot-password — Light...');
    await page.goto(`${BASE_URL}/forgot-password`, { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    });
    await page.waitForTimeout(500);
    await saveScreenshot('forgot_password_light.png');

    // 2. /forgot-password — Dark
    console.log('[E2E] Capturing /forgot-password — Dark...');
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    });
    await page.waitForTimeout(500);
    await saveScreenshot('forgot_password_dark.png');

    // 3. /forgot-password — Success State (Light)
    console.log('[E2E] Capturing /forgot-password — Success State (Light)...');
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    });
    await page.fill('#forgot-email', testEmail);
    await page.click('button[type="submit"]');
    // Wait for success message or error (SMTP timeout is 10s, so allow up to 25s)
    try {
      await page.waitForSelector('text=Check your inbox', { timeout: 25000 });
    } catch (e) {
      const pageText = await page.innerText('body');
      console.log('[Page Text on Failure]:', pageText.slice(0, 300));
      throw e;
    }
    await page.waitForTimeout(500);
    await saveScreenshot('forgot_password_sent_light.png');

    // 4. /reset-password/[token] — Light
    console.log('[E2E] Capturing /reset-password?token=... — Light...');
    await page.goto(`${BASE_URL}/reset-password?token=${resetToken}`, { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    });
    await page.waitForTimeout(500);
    await saveScreenshot('reset_password_light.png');

    // 5. /reset-password/[token] — Dark
    console.log('[E2E] Capturing /reset-password?token=... — Dark...');
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    });
    await page.waitForTimeout(500);
    await saveScreenshot('reset_password_dark.png');

    // 6. Password Strength Meter — 3 States (Weak / Fair / Strong) — Dark
    console.log('[E2E] Capturing Password Strength Meter 3 states in Dark mode...');
    const segmentResults: SegmentStyle[] = [];

    // Helper to get segment styles
    const getStrengthDetails = async (stateName: string): Promise<SegmentStyle> => {
      const seg1 = await page.$eval('[data-testid="strength-segment-1"]', (el) => window.getComputedStyle(el).backgroundColor);
      const seg2 = await page.$eval('[data-testid="strength-segment-2"]', (el) => window.getComputedStyle(el).backgroundColor);
      const seg3 = await page.$eval('[data-testid="strength-segment-3"]', (el) => window.getComputedStyle(el).backgroundColor);
      const seg4 = await page.$eval('[data-testid="strength-segment-4"]', (el) => window.getComputedStyle(el).backgroundColor);
      const text = await page.$eval('[data-testid="strength-label"]', (el) => el.textContent?.trim() || '');
      return {
        state: stateName,
        segment1: seg1,
        segment2: seg2,
        segment3: seg3,
        segment4: seg4,
        text,
      };
    }

    // State A: Weak
    await page.fill('#reset-password', 'weak');
    await page.waitForTimeout(300);
    segmentResults.push(await getStrengthDetails('weak'));

    // State B: Fair
    await page.fill('#reset-password', 'password123');
    await page.waitForTimeout(300);
    segmentResults.push(await getStrengthDetails('fair'));

    // State C: Strong
    await page.fill('#reset-password', 'SuperStrongPass123!');
    await page.waitForTimeout(300);
    segmentResults.push(await getStrengthDetails('strong'));

    // Take screenshot of Strong state in Dark mode
    await saveScreenshot('password_strength_dark.png');

    console.log('\n=== COMPUTED COLOR TABLE ===');
    console.log('| State | Segment 1 | Segment 2 | Segment 3 | Segment 4 | Text |');
    console.log('|---|---|---|---|---|---|');
    for (const r of segmentResults) {
      console.log(`| ${r.state} | ${r.segment1} | ${r.segment2} | ${r.segment3} | ${r.segment4} | ${r.text} |`);
    }

    // Save table to JSON for report reference
    fs.writeFileSync(
      path.join(ARTIFACT_DIR, 'strength_computed_colors.json'),
      JSON.stringify(segmentResults, null, 2)
    );

    console.log('\n✅ Playwright E2E verification completed successfully.');
  } finally {
    await browser.close();
    if (serverProcess) {
      serverProcess.kill();
    }
  }
}

verifyAuth1E2E().catch((err) => {
  console.error('[E2E Error]', err);
  process.exit(1);
});
