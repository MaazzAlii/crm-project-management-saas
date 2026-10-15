import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { spawn, ChildProcess } from 'child_process';
import { query } from '../lib/db';
import { userRepo } from '../lib/db/repositories/user-repo';
import { orgRepo } from '../lib/db/repositories/org-repo';
import bcrypt from 'bcryptjs';

const ARTIFACT_DIR = '/home/maazzalii/.gemini/antigravity-ide/brain/14ad1ea3-4d08-4064-a0d2-19239f235c28';
const BATCH_ASSETS_DIR = path.join(process.cwd(), 'assets/screenshots/bill-1');
fs.mkdirSync(BATCH_ASSETS_DIR, { recursive: true });
fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

// Ensure standalone assets are present
const standaloneStatic = path.join(process.cwd(), '.next/standalone/.next/static');
const standalonePublic = path.join(process.cwd(), '.next/standalone/public');
if (fs.existsSync(path.join(process.cwd(), '.next/static'))) {
  fs.cpSync(path.join(process.cwd(), '.next/static'), standaloneStatic, { recursive: true });
}
if (fs.existsSync(path.join(process.cwd(), 'public'))) {
  fs.cpSync(path.join(process.cwd(), 'public'), standalonePublic, { recursive: true });
}

async function verifyBill1E2E() {
  console.log('=== STARTING BILL-1 E2E PLAYWRIGHT VERIFICATION ===');

  let serverProcess: ChildProcess | null = null;
  const PORT = '3000';
  const BASE_URL = `http://localhost:${PORT}`;

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
      console.log(`[E2E] Server is UP on ${BASE_URL}`);
      break;
    }
  }

  // Set up test organization on Free tier at limit
  const id = `${Date.now()}_bill1`;
  const ownerEmail = `bill1_e2e_${id}@example.com`;
  const password = 'Password123!';
  const passwordHash = await bcrypt.hash(password, 10);

  const owner = await userRepo.create({
    email: ownerEmail,
    fullName: 'Bill1 Owner',
    passwordHash,
  });

  const org = await orgRepo.create({
    name: 'Bill1 Free Org',
    slug: `bill1-org-${id}`,
    ownerUserId: owner.id,
  });

  // Ensure Free tier
  await query(
    `INSERT INTO organization_plans (organization_id, plan_id, status, plan_override)
     VALUES ($1, 'free', 'active', NULL)
     ON CONFLICT (organization_id) DO UPDATE SET plan_override = NULL, plan_id = 'free'`,
    [org.id]
  );

  // Seed 5 clients (free plan limit)
  for (let i = 1; i <= 5; i++) {
    await query(
      `INSERT INTO clients (organization_id, name, email, status)
       VALUES ($1, $2, $3, 'active')`,
      [org.id, `Existing Client ${i}`, `client${i}_${id}@test.com`]
    );
  }

  const clientRow = (await query('SELECT id FROM clients WHERE organization_id = $1 LIMIT 1', [org.id])).rows[0];

  // Seed 3 projects (free plan limit)
  for (let i = 1; i <= 3; i++) {
    await query(
      `INSERT INTO projects (organization_id, client_id, title, status)
       VALUES ($1, $2, $3, 'Active')`,
      [org.id, clientRow.id, `Existing Project ${i}`]
    );
  }

  // Seed 1 channel (free plan limit)
  await query(
    `INSERT INTO communication_channels (organization_id, provider, external_account_id, channel_name, status)
     VALUES ($1, 'whatsapp', $2, 'Official WhatsApp', 'active')`,
    [org.id, `wa_${id}`]
  );

  // Seed 25 AI requests (free plan monthly limit)
  for (let i = 0; i < 25; i++) {
    await query(
      `INSERT INTO ai_usage_log (organization_id, user_id, feature, provider, status, created_at)
       VALUES ($1, $2, 'completion', 'openai', 'success', NOW())`,
      [org.id, owner.id]
    );
  }

  const browser = await chromium.launch({ headless: true });

  const takeScreenshot = async (page: any, filename: string) => {
    const dest1 = path.join(BATCH_ASSETS_DIR, filename);
    const dest2 = path.join(ARTIFACT_DIR, filename);
    await page.screenshot({ path: dest1, fullPage: true });
    fs.copyFileSync(dest1, dest2);
    console.log(`[Screenshot Saved] ${filename}`);
  };

  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    // 1. Log in
    console.log('[E2E] Logging in as Free Org Owner...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.fill('input[type="email"], input[name="email"]', ownerEmail);
    await page.fill('input[type="password"], input[name="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });
    console.log('[E2E] Login successful, URL:', page.url());

    // 2. Client Limit Enforcement Test
    console.log('[E2E] Testing Client Limit Enforcement on /clients/new...');
    await page.goto(`${BASE_URL}/clients/new`, { waitUntil: 'networkidle' });
    await page.fill('input[name="name"], input#name', '6th Over Quota Client');
    await page.fill('input[name="email"], input#email', 'overlimit@example.com');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    // Capture Light Mode Client Limit
    await takeScreenshot(page, 'client_limit_light.png');

    // Switch to Dark Mode
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    await page.waitForTimeout(300);
    await takeScreenshot(page, 'client_limit_dark.png');

    // Switch back to Light Mode
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    });

    // 3. Project Limit Enforcement Test
    console.log('[E2E] Testing Project Limit Enforcement on /projects...');
    await page.goto(`${BASE_URL}/projects`, { waitUntil: 'networkidle' });
    // Click "New Project" button
    const newProjBtn = page.locator('button:has-text("New Project"), a:has-text("New Project"), button:has-text("Create Project")').first();
    if (await newProjBtn.isVisible()) {
      await newProjBtn.click();
      await page.waitForTimeout(500);
      const titleInput = page.locator('input[placeholder*="Project Title"], input[name="title"]').first();
      if (await titleInput.isVisible()) {
        await titleInput.fill('4th Over Quota Project');
        const submitBtn = page.locator('button:has-text("Create Project")').first();
        if (await submitBtn.isVisible()) {
          await submitBtn.click();
          await page.waitForTimeout(1000);
        }
      }
    }
    await takeScreenshot(page, 'project_limit_light.png');

    // Dark Mode Project Limit
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    await page.waitForTimeout(300);
    await takeScreenshot(page, 'project_limit_dark.png');

    // Switch back to Light Mode
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    });

    // 4. Channel / Integrations Quota Test
    console.log('[E2E] Testing Channel & Integrations Quota on /settings/integrations...');
    await page.goto(`${BASE_URL}/settings/integrations`, { waitUntil: 'networkidle' });
    await takeScreenshot(page, 'channel_limit_light.png');

    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    await page.waitForTimeout(300);
    await takeScreenshot(page, 'channel_limit_dark.png');

    // Switch back to Light Mode
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    });

    // 5. AI Settings / Billing Quota Test
    console.log('[E2E] Testing AI & Billing Plan Limits on /settings/billing...');
    await page.goto(`${BASE_URL}/settings/billing`, { waitUntil: 'networkidle' });
    await takeScreenshot(page, 'ai_limit_light.png');

    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    await page.waitForTimeout(300);
    await takeScreenshot(page, 'ai_limit_dark.png');

    console.log('=== ALL E2E SCREENSHOTS CAPTURED SUCCESSFULLY ===');
  } catch (err) {
    console.error('[E2E Error]', err);
    throw err;
  } finally {
    await browser.close();
    if (serverProcess) {
      serverProcess.kill('SIGTERM');
    }
    // Clean up E2E test data
    await query('DELETE FROM clients WHERE organization_id = $1', [org.id]);
    await query('DELETE FROM projects WHERE organization_id = $1', [org.id]);
    await query('DELETE FROM communication_channels WHERE organization_id = $1', [org.id]);
    await query('DELETE FROM ai_usage_log WHERE organization_id = $1', [org.id]);
    await query('DELETE FROM organization_plans WHERE organization_id = $1', [org.id]);
    await query('DELETE FROM organization_members WHERE organization_id = $1', [org.id]);
    await query('DELETE FROM organizations WHERE id = $1', [org.id]);
    await query('DELETE FROM auth.users WHERE id = $1', [owner.id]);
  }
}

verifyBill1E2E().catch((err) => {
  console.error(err);
  process.exit(1);
});
