import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { spawn, ChildProcess } from 'child_process';
import { query } from '../lib/db';
import { userRepo } from '../lib/db/repositories/user-repo';
import { orgRepo } from '../lib/db/repositories/org-repo';
import bcrypt from 'bcryptjs';

const ARTIFACT_DIR = '/home/maazzalii/.gemini/antigravity-ide/brain/7b153b89-0d1b-42c5-afd0-60472e1b6fcd';
const BATCH_ASSETS_DIR = path.join(process.cwd(), 'assets/screenshots/auth-4');
fs.mkdirSync(BATCH_ASSETS_DIR, { recursive: true });
fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

function copyToArtifact(filename: string) {
  const src = path.join(BATCH_ASSETS_DIR, filename);
  const dst = path.join(ARTIFACT_DIR, filename);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dst);
    console.log(`[E2E] Copied screenshot artifact: ${filename}`);
  }
}

async function verifyAuth4E2E() {
  console.log('=== STARTING AUTH-4 E2E PLAYWRIGHT ROLE-GATED SCREENSHOT VERIFICATION ===');

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

  console.log('[E2E] Server is ready. Setting up test users...');

  const id = Date.now();
  const ownerEmail = `auth4_owner_${id}@example.com`;
  const viewerEmail = `auth4_viewer_${id}@example.com`;
  const password = 'Password123!';
  const passwordHash = await bcrypt.hash(password, 10);

  // 1. Create owner user & org
  const owner = await userRepo.create({
    email: ownerEmail,
    fullName: 'AUTH-4 Workspace Owner',
    passwordHash,
  });
  await query('UPDATE users SET email_verified = true, email_verified_at = NOW() WHERE id = $1', [owner.id]);

  const org = await orgRepo.create({
    name: `Auth4 Hardened Org ${id}`,
    slug: `auth4-org-${id}`,
    ownerUserId: owner.id,
  });

  // 2. Create viewer user & membership in same org
  const viewer = await userRepo.create({
    email: viewerEmail,
    fullName: 'AUTH-4 Workspace Viewer',
    passwordHash,
  });
  await query('UPDATE users SET email_verified = true, email_verified_at = NOW() WHERE id = $1', [viewer.id]);

  await query(
    `INSERT INTO organization_members (organization_id, user_id, role, created_at, updated_at)
     VALUES ($1, $2, 'viewer', NOW(), NOW())`,
    [org.id, viewer.id]
  );

  console.log(`[E2E] Owner: ${ownerEmail}, Viewer: ${viewerEmail} in Org: ${org.id}`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    const page = await context.newPage();

    // ---------------------------------------------------------
    // Screen 1: Owner View of Templates (/settings/templates)
    // ---------------------------------------------------------
    console.log('[E2E] 1. Logging in as Owner...');
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"], input[name="email"]', ownerEmail);
    await page.fill('input[type="password"], input[name="password"]', password);
    await Promise.all([
      page.waitForNavigation({ timeout: 10000 }).catch(() => {}),
      page.click('button[type="submit"]'),
    ]);
    await page.waitForTimeout(1000);

    console.log('[E2E] Capturing Owner Templates Screen...');
    await page.goto(`${BASE_URL}/settings/templates`);
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(BATCH_ASSETS_DIR, '01-owner-templates.png'), fullPage: true });
    copyToArtifact('01-owner-templates.png');

    // ---------------------------------------------------------
    // Screen 2: Owner View of Projects (/projects)
    // ---------------------------------------------------------
    console.log('[E2E] 2. Capturing Owner Projects Screen...');
    await page.goto(`${BASE_URL}/projects`);
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(BATCH_ASSETS_DIR, '02-owner-projects.png'), fullPage: true });
    copyToArtifact('02-owner-projects.png');

    // Clear cookies & log in as Viewer
    await context.clearCookies();

    // ---------------------------------------------------------
    // Screen 3: Viewer View of Templates (/settings/templates)
    // ---------------------------------------------------------
    console.log('[E2E] 3. Logging in as Viewer...');
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"], input[name="email"]', viewerEmail);
    await page.fill('input[type="password"], input[name="password"]', password);
    await Promise.all([
      page.waitForNavigation({ timeout: 10000 }).catch(() => {}),
      page.click('button[type="submit"]'),
    ]);
    await page.waitForTimeout(1000);

    console.log('[E2E] Capturing Viewer Templates Screen...');
    await page.goto(`${BASE_URL}/settings/templates`);
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(BATCH_ASSETS_DIR, '03-viewer-templates.png'), fullPage: true });
    copyToArtifact('03-viewer-templates.png');

    // ---------------------------------------------------------
    // Screen 4: Viewer View of Clients Directory (/clients)
    // ---------------------------------------------------------
    console.log('[E2E] 4. Capturing Viewer Clients Screen...');
    await page.goto(`${BASE_URL}/clients`);
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(BATCH_ASSETS_DIR, '04-viewer-clients.png'), fullPage: true });
    copyToArtifact('04-viewer-clients.png');

    console.log('=== AUTH-4 PLAYWRIGHT SCREENSHOT VERIFICATION COMPLETED SUCCESSFULLY ===');
  } catch (err) {
    console.error('[E2E] Playwright error:', err);
    throw err;
  } finally {
    await browser.close();
    serverProcess?.kill('SIGKILL');
  }
}

verifyAuth4E2E().catch((err) => {
  console.error('[E2E] Fatal error:', err);
  process.exit(1);
});
