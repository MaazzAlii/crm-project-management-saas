import path from 'path';
import fs from 'fs';

// Load .env.local natively without external dependencies
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

process.env.IMPERSONATION_ORIGIN_SECRET =
  process.env.IMPERSONATION_ORIGIN_SECRET || 'dev_origin_secret_32_characters_long_val!';

import { chromium } from 'playwright';
import { spawn, ChildProcess } from 'child_process';
import { generateAccessToken } from '../lib/auth/jwt';
import { signOriginToken } from '../lib/auth/impersonation';

const ARTIFACT_DIR = '/home/maazzalii/.gemini/antigravity-ide/brain/7b153b89-0d1b-42c5-afd0-60472e1b6fcd';
const BATCH_ASSETS_DIR = path.join(process.cwd(), 'assets/screenshots/admin-1');
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

async function verifyAdmin1E2E() {
  console.log('=== STARTING ADMIN-1 E2E PLAYWRIGHT VERIFICATION ===');

  let serverProcess: ChildProcess | null = null;
  const PORT = '3000';
  const BASE_URL = `http://localhost:${PORT}`;

  // Sync static assets to standalone
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
    env: {
      ...process.env,
      PORT,
      COOKIE_SECURE: 'false',
      ALLOW_DEV_AUTH_BYPASS: 'true',
      IMPERSONATION_ORIGIN_SECRET: process.env.IMPERSONATION_ORIGIN_SECRET || 'dev_origin_secret_32_characters_long_val!',
    },
    stdio: 'pipe',
  });

  serverProcess.stdout?.on('data', (d) => {
    const line = d.toString();
    if (line.includes('Listening on port') || line.includes('Ready in')) {
      console.log(`[Server] ${line.trim()}`);
    }
  });

  serverProcess.stderr?.on('data', (d) => {
    console.error(`[Server ERR] ${d.toString().trim()}`);
  });

  // Wait for server to become responsive
  let ready = false;
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`${BASE_URL}/login`);
      if (res.status === 200) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }

  if (!ready) {
    throw new Error('Standalone server failed to start within 30 seconds');
  }
  console.log('[E2E] Server is healthy and accepting traffic.');

  const browser = await chromium.launch({ headless: true });

  try {
    // Identities
    const superAdminUserId = '31a52cea-7af8-4cb8-aefe-3d014e69f865';
    const tenantOrgId = '00000000-0000-0000-0000-000000000001';
    const tenantUserId = '0f15373f-f43b-40b9-bd50-d1bb01c3c68f';

    // 1. Generate Super Admin Token
    const superAdminToken = generateAccessToken({
      userId: superAdminUserId,
      email: 'admin@innoventix.io',
      role: 'super_admin',
      orgId: tenantOrgId,
    });

    // 2. Generate Tenant Token & Origin Token for Impersonation
    const impersonatedTenantToken = generateAccessToken({
      userId: tenantUserId,
      email: 'innoventixhub@gmail.com',
      role: 'owner',
      orgId: tenantOrgId,
    });

    const originToken = signOriginToken({
      superAdminId: superAdminUserId,
      impersonatedUserId: tenantUserId,
      impersonatedOrgId: tenantOrgId,
      impersonatedOrgName: 'Innoventix Hub',
      impersonatedUserName: 'Innoventix Enterprise Admin',
      impersonatedUserEmail: 'innoventixhub@gmail.com',
      startedAt: Date.now(),
      expiresAt: Date.now() + 3600_000,
    });

    // -------------------------------------------------------------
    // SCENE 1: Impersonation Banner (Light & Dark)
    // -------------------------------------------------------------
    console.log('[E2E] Capturing Impersonation Banner on /dashboard...');
    const impersonationContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });

    await impersonationContext.addCookies([
      {
        name: 'innoventix_session',
        value: impersonatedTenantToken,
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        sameSite: 'Lax',
      },
      {
        name: 'innoventix_super_admin_origin',
        value: originToken,
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        sameSite: 'Lax',
      },
    ]);

    const impPage = await impersonationContext.newPage();
    await impPage.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });

    // Wait for impersonation banner
    await impPage.waitForSelector('[data-testid="impersonation-banner"]', { timeout: 10000 });

    // Light Theme
    const impLightPath = path.join(BATCH_ASSETS_DIR, 'impersonation_banner_light.png');
    await impPage.screenshot({ path: impLightPath, fullPage: false });
    copyToArtifact('impersonation_banner_light.png');

    // Dark Theme
    await impPage.evaluate(() => {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    await impPage.waitForTimeout(300);
    const impDarkPath = path.join(BATCH_ASSETS_DIR, 'impersonation_banner_dark.png');
    await impPage.screenshot({ path: impDarkPath, fullPage: false });
    copyToArtifact('impersonation_banner_dark.png');

    await impersonationContext.close();

    // -------------------------------------------------------------
    // SCENE 2: User Management Modal (Edit & Delete Tabs)
    // -------------------------------------------------------------
    console.log('[E2E] Capturing User Management Modal on Org Detail...');
    const adminContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });

    await adminContext.addCookies([
      {
        name: 'innoventix_session',
        value: superAdminToken,
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        sameSite: 'Lax',
      },
      {
        name: 'dev_super_admin',
        value: 'true',
        domain: 'localhost',
        path: '/',
        httpOnly: false,
        sameSite: 'Lax',
      },
    ]);

    const orgPage = await adminContext.newPage();
    orgPage.on('console', (msg) => console.log('[Browser Console]', msg.text()));
    const response = await orgPage.goto(`${BASE_URL}/super-admin/organizations/${tenantOrgId}`, { waitUntil: 'networkidle' });
    console.log(`[E2E] Org Page Status: ${response?.status()}, URL: ${orgPage.url()}`);

    // If redirected or error, inspect body
    const bodySnippet = await orgPage.evaluate(() => document.body.innerText.slice(0, 300));
    console.log(`[E2E] Org Page Body Snippet: ${bodySnippet.replace(/\n+/g, ' ')}`);

    // Click "Manage" on the user row
    const manageBtnSelector = `[data-testid^="manage-user-btn-"]`;
    await orgPage.waitForSelector(manageBtnSelector, { timeout: 10000 });
    const manageBtn = orgPage.locator(manageBtnSelector).first();
    await manageBtn.click();

    // Wait for modal
    await orgPage.waitForSelector('[data-testid="user-management-modal"]', { timeout: 5000 });
    await orgPage.waitForTimeout(400);

    // Capture User Edit tab (Light)
    const userEditLightPath = path.join(BATCH_ASSETS_DIR, 'user_edit_light.png');
    await orgPage.screenshot({ path: userEditLightPath, fullPage: false });
    copyToArtifact('user_edit_light.png');

    // Click "Delete Account" tab in modal
    const deleteTabBtn = orgPage.locator('button:has-text("Delete Account")');
    await deleteTabBtn.click();
    await orgPage.waitForTimeout(400);

    // Capture User Delete tab (Light)
    const userDeleteLightPath = path.join(BATCH_ASSETS_DIR, 'user_delete_modal_light.png');
    await orgPage.screenshot({ path: userDeleteLightPath, fullPage: false });
    copyToArtifact('user_delete_modal_light.png');

    // -------------------------------------------------------------
    // SCENE 3: Dashboard Metrics Cards & Tables (Light & Dark)
    // -------------------------------------------------------------
    console.log('[E2E] Capturing Operator Dashboard Metrics...');
    const dashPage = await adminContext.newPage();
    await dashPage.goto(`${BASE_URL}/super-admin/dashboard`, { waitUntil: 'networkidle' });
    await dashPage.waitForSelector('text=Platform Operator Overview', { timeout: 10000 });
    await dashPage.waitForTimeout(500);

    // Dashboard Light
    const dashLightPath = path.join(BATCH_ASSETS_DIR, 'dashboard_metrics_light.png');
    await dashPage.screenshot({ path: dashLightPath, fullPage: false });
    copyToArtifact('dashboard_metrics_light.png');

    // Dashboard Dark
    await dashPage.evaluate(() => {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    await dashPage.waitForTimeout(300);
    const dashDarkPath = path.join(BATCH_ASSETS_DIR, 'dashboard_metrics_dark.png');
    await dashPage.screenshot({ path: dashDarkPath, fullPage: false });
    copyToArtifact('dashboard_metrics_dark.png');

    await adminContext.close();

    console.log('=== ALL 6 E2E SCREENSHOTS CAPTURED SUCCESSFULLY ===');
  } finally {
    await browser.close();
    if (serverProcess) {
      serverProcess.kill('SIGTERM');
      console.log('[E2E] Standalone server terminated.');
    }
  }
}

verifyAdmin1E2E().catch((err) => {
  console.error('[E2E Error]', err);
  process.exit(1);
});
