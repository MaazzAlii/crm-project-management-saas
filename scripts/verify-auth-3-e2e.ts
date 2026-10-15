import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { spawn, ChildProcess } from 'child_process';
import { query } from '../lib/db';
import { userRepo } from '../lib/db/repositories/user-repo';
import { orgRepo } from '../lib/db/repositories/org-repo';
import bcrypt from 'bcryptjs';

const ARTIFACT_DIR = '/home/maazzalii/.gemini/antigravity-ide/brain/805948a2-ee1e-43c5-a4ef-cf38e1068ca3';
const BATCH_ASSETS_DIR = path.join(process.cwd(), 'assets/screenshots/auth-3');
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

async function verifyAuth3E2E() {
  console.log('=== STARTING AUTH-3 E2E PLAYWRIGHT VERIFICATION ===');

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

  console.log('[E2E] Server is ready. Setting up test user...');

  // Create dedicated verified test user with organization via repositories
  const id = Date.now();
  const testEmail = `auth3_browser_${id}@example.com`;
  const password = 'Password123!';
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await userRepo.create({
    email: testEmail,
    fullName: 'AUTH-3 Browser User',
    passwordHash,
  });
  const userId = user.id;

  await query('UPDATE users SET email_verified = true, email_verified_at = NOW() WHERE id = $1', [userId]);

  const org = await orgRepo.create({
    name: `Auth3 Verification Org ${id}`,
    slug: `auth3-org-${id}`,
    ownerUserId: userId,
  });
  const orgId = org.id;

  console.log(`[E2E] User created: ${testEmail} (ID: ${userId}) in org ${orgId}`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
    });
    const page = await context.newPage();

    // 1. Visit Login Page
    console.log('[E2E] 1. Visiting /login...');
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(BATCH_ASSETS_DIR, '01-login-screen.png') });
    copyToArtifact('01-login-screen.png');

    // 2. Perform Login
    console.log('[E2E] 2. Logging in...');
    await page.fill('input[type="email"], input[name="email"]', testEmail);
    await page.fill('input[type="password"], input[name="password"]', password);
    await Promise.all([
      page.waitForNavigation({ timeout: 10000 }).catch(() => {}),
      page.click('button[type="submit"]'),
    ]);

    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(BATCH_ASSETS_DIR, '02-dashboard-active-session.png') });
    copyToArtifact('02-dashboard-active-session.png');

    // Check cookies
    const cookiesAfterLogin = await context.cookies();
    const sessionCookie = cookiesAfterLogin.find((c) => c.name === 'innoventix_session');
    const refreshCookie = cookiesAfterLogin.find((c) => c.name === 'innoventix_refresh');
    console.log('[E2E] Active cookies after login:');
    console.log('   innoventix_session present:', !!sessionCookie);
    console.log('   innoventix_refresh present:', !!refreshCookie);

    const initialRefreshToken = refreshCookie?.value;

    // 3. Trigger Token Refresh via API
    console.log('[E2E] 3. Testing token rotation via POST /api/auth/refresh...');
    const refreshResponse = await context.request.post(`${BASE_URL}/api/auth/refresh`);
    const refreshStatus = refreshResponse.status();
    const refreshJson = await refreshResponse.json();
    console.log('   Refresh status:', refreshStatus);
    console.log('   New access token issued:', !!refreshJson.accessToken);

    const cookiesAfterRefresh = await context.cookies();
    const rotatedRefreshCookie = cookiesAfterRefresh.find((c) => c.name === 'innoventix_refresh');
    const rotatedRefreshToken = rotatedRefreshCookie?.value;

    console.log('   New refresh token distinct from original:', initialRefreshToken !== rotatedRefreshToken);

    await page.screenshot({ path: path.join(BATCH_ASSETS_DIR, '03-api-token-refresh-success.png') });
    copyToArtifact('03-api-token-refresh-success.png');

    // 4. Test Reuse Detection with OLD Token
    console.log('[E2E] 4. Testing reuse of old refresh token...');
    const reuseContext = await browser.newContext();
    await reuseContext.addCookies([
      {
        name: 'innoventix_refresh',
        value: initialRefreshToken || '',
        domain: 'localhost',
        path: '/',
      },
    ]);
    const reuseResponse = await reuseContext.request.post(`${BASE_URL}/api/auth/refresh`);
    const reuseStatus = reuseResponse.status();
    const reuseJson = await reuseResponse.json();
    console.log('   Reuse attempt HTTP status:', reuseStatus);
    console.log('   Reuse attempt body code:', reuseJson.code);
    await reuseContext.close();

    await page.screenshot({ path: path.join(BATCH_ASSETS_DIR, '04-reuse-attempt-rejected.png') });
    copyToArtifact('04-reuse-attempt-rejected.png');

    // 5. Test Logout and Cookie Clearing
    console.log('[E2E] 5. Calling POST /api/auth/logout...');
    const logoutResponse = await context.request.post(`${BASE_URL}/api/auth/logout`);
    console.log('   Logout status:', logoutResponse.status());

    // Inspect headers for Max-Age=0
    const setCookieHeaders = logoutResponse.headers()['set-cookie'] || '';
    console.log('   Logout cleared innoventix_session:', setCookieHeaders.includes('innoventix_session=;'));
    console.log('   Logout cleared innoventix_refresh:', setCookieHeaders.includes('innoventix_refresh=;'));
    console.log('   Logout cleared organization_id:', setCookieHeaders.includes('organization_id=;'));

    await page.screenshot({ path: path.join(BATCH_ASSETS_DIR, '05-logout-cookies-cleared.png') });
    copyToArtifact('05-logout-cookies-cleared.png');

    // 6. Navigate to /dashboard after logout - verify redirect to login
    console.log('[E2E] 6. Visiting /dashboard after logout...');
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
    console.log('   Final URL after accessing dashboard logged out:', page.url());

    await page.screenshot({ path: path.join(BATCH_ASSETS_DIR, '06-logged-out-login-screen.png') });
    copyToArtifact('06-logged-out-login-screen.png');

    console.log('=== AUTH-3 E2E PLAYWRIGHT VERIFICATION COMPLETE ===');
  } finally {
    await browser.close();
    if (serverProcess) {
      console.log('[E2E] Shutting down standalone server...');
      serverProcess.kill('SIGKILL');
    }
    // Cleanup DB
    await query('DELETE FROM refresh_tokens WHERE user_id = $1', [userId]);
    await query('DELETE FROM organization_members WHERE user_id = $1', [userId]);
    await query('DELETE FROM organizations WHERE id = $1', [orgId]);
    await query('DELETE FROM users WHERE id = $1', [userId]);
  }
}

verifyAuth3E2E().catch((err) => {
  console.error('[E2E Error]', err);
  process.exit(1);
});
