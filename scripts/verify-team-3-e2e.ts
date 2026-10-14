import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { spawn, ChildProcess } from 'child_process';
import { query } from '../lib/db';
import { userRepo } from '../lib/db/repositories/user-repo';
import { orgRepo } from '../lib/db/repositories/org-repo';
import bcrypt from 'bcryptjs';

const ARTIFACT_DIR = '/home/maazzalii/.gemini/antigravity-ide/brain/5cf0bc26-e0b2-4113-8af2-1ddd933ffa2c';
const BATCH_ASSETS_DIR = path.join(process.cwd(), 'assets/screenshots/team-3');
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

async function verifyTeam3E2E() {
  console.log('=== STARTING TEAM-3 E2E PLAYWRIGHT VERIFICATION ===');

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

  // 1. Seed test database data:
  // - Owner: Elena Rostova
  // - Admin: Marcus Vance
  // - Member: Sophia Chen
  const ts = Date.now();
  const passHash = await bcrypt.hash('Team3Password123!', 10);

  const owner = await userRepo.create({
    email: `team3_owner_${ts}@innoventix.io`,
    fullName: 'Elena Rostova (Owner)',
    passwordHash: passHash,
    role: 'user',
  });

  const admin = await userRepo.create({
    email: `team3_admin_${ts}@innoventix.io`,
    fullName: 'Marcus Vance (Admin)',
    passwordHash: passHash,
    role: 'user',
  });

  const member = await userRepo.create({
    email: `team3_member_${ts}@innoventix.io`,
    fullName: 'Sophia Chen (Member)',
    passwordHash: passHash,
    role: 'user',
  });

  const org = await orgRepo.create({
    name: 'Innoventix Cyber Defense',
    slug: `innoventix-cyber-${ts}`,
    ownerUserId: owner.id,
  });

  // Add Marcus as admin and Sophia as member
  await orgRepo.addMember(org.id, admin.id, 'admin');
  await orgRepo.addMember(org.id, member.id, 'member');

  console.log(`[E2E] Created Owner: ${owner.email}`);
  console.log(`[E2E] Created Admin: ${admin.email}`);
  console.log(`[E2E] Created Member: ${member.email}`);
  console.log(`[E2E] Created Org: ${org.name} (${org.id})`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  async function saveScreenshot(page: any, name: string) {
    const assetPath = path.join(BATCH_ASSETS_DIR, name);
    const artifactPath = path.join(ARTIFACT_DIR, name);
    await page.screenshot({ path: assetPath, fullPage: true });
    fs.copyFileSync(assetPath, artifactPath);
    const size = (fs.statSync(assetPath).size / 1024).toFixed(1);
    console.log(`📸 [Screenshot] ${name} (${size} KB) saved to assets and artifacts`);
  }

  try {
    // -------------------------------------------------------------
    // OWNER SESSION
    // -------------------------------------------------------------
    console.log('\n--- 1. Testing as OWNER ---');
    const ownerContext = await browser.newContext({ viewport: { width: 1280, height: 950 } });
    const ownerPage = await ownerContext.newPage();

    await ownerPage.goto(`${BASE_URL}/login?redirectTo=/settings/team`, { waitUntil: 'networkidle' });
    await ownerPage.fill('input[type="email"]', owner.email);
    await ownerPage.fill('input[type="password"]', 'Team3Password123!');
    await ownerPage.click('button[type="submit"]');
    await ownerPage.waitForURL('**/settings/team', { timeout: 15000 });
    console.log('[E2E] Owner logged in and arrived on /settings/team');

    // Wait for member table
    await ownerPage.waitForSelector(`[data-testid="role-select-${member.id}"]`, { state: 'visible' });

    // Verify remove button on owner row is disabled
    const ownerRemoveBtn = ownerPage.locator(`[data-testid="remove-member-${owner.id}"]`);
    const isOwnerDisabled = await ownerRemoveBtn.isDisabled();
    console.log(`[E2E] Owner remove button disabled: ${isOwnerDisabled}`);

    // Capture 5 & 6: remove_owner_disabled (Light & Dark)
    console.log('[E2E] Capturing remove_owner_disabled_light.png...');
    await ownerPage.evaluate(() => {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    });
    await ownerPage.waitForTimeout(300);
    await saveScreenshot(ownerPage, 'remove_owner_disabled_light.png');

    console.log('[E2E] Capturing remove_owner_disabled_dark.png...');
    await ownerPage.evaluate(() => {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    });
    await ownerPage.waitForTimeout(300);
    await saveScreenshot(ownerPage, 'remove_owner_disabled_dark.png');

    // Capture 1 & 2: role_dropdown_owner (Light & Dark)
    // Focus and scroll member role select into view
    const memberRoleSelect = ownerPage.locator(`[data-testid="role-select-${member.id}"]`);
    await memberRoleSelect.scrollIntoViewIfNeeded();

    console.log('[E2E] Capturing role_dropdown_owner_light.png...');
    await ownerPage.evaluate(() => {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    });
    await memberRoleSelect.focus();
    await ownerPage.waitForTimeout(300);
    await saveScreenshot(ownerPage, 'role_dropdown_owner_light.png');

    console.log('[E2E] Capturing role_dropdown_owner_dark.png...');
    await ownerPage.evaluate(() => {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    });
    await memberRoleSelect.focus();
    await ownerPage.waitForTimeout(300);
    await saveScreenshot(ownerPage, 'role_dropdown_owner_dark.png');

    // Capture 7 & 8: last_owner_block (Light & Dark)
    // Hover/focus on disabled owner remove button to show tooltip or inspect title
    await ownerRemoveBtn.hover();
    await ownerPage.waitForTimeout(300);

    console.log('[E2E] Capturing last_owner_block_dark.png...');
    await saveScreenshot(ownerPage, 'last_owner_block_dark.png');

    console.log('[E2E] Capturing last_owner_block_light.png...');
    await ownerPage.evaluate(() => {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    });
    await ownerRemoveBtn.hover();
    await ownerPage.waitForTimeout(300);
    await saveScreenshot(ownerPage, 'last_owner_block_light.png');

    await ownerContext.close();

    // -------------------------------------------------------------
    // ADMIN SESSION
    // -------------------------------------------------------------
    console.log('\n--- 2. Testing as ADMIN ---');
    const adminContext = await browser.newContext({ viewport: { width: 1280, height: 950 } });
    const adminPage = await adminContext.newPage();

    await adminPage.goto(`${BASE_URL}/login?redirectTo=/settings/team`, { waitUntil: 'networkidle' });
    await adminPage.fill('input[type="email"]', admin.email);
    await adminPage.fill('input[type="password"]', 'Team3Password123!');
    await adminPage.click('button[type="submit"]');
    await adminPage.waitForURL('**/settings/team', { timeout: 15000 });
    console.log('[E2E] Admin logged in and arrived on /settings/team');

    // Wait for member table
    await adminPage.waitForSelector(`[data-testid="role-select-${member.id}"]`, { state: 'visible' });

    // Verify Admin role option does not exist for admin user
    const hasAdminOption = await adminPage.locator(`[data-testid="role-select-${member.id}"] option[value="admin"]`).count();
    console.log(`[E2E] Admin option visible in role dropdown for Admin: ${hasAdminOption > 0 ? 'YES (UNEXPECTED)' : 'NO (CORRECT)'}`);

    // Capture 3 & 4: role_dropdown_admin (Light & Dark)
    const adminMemberRoleSelect = adminPage.locator(`[data-testid="role-select-${member.id}"]`);
    await adminMemberRoleSelect.scrollIntoViewIfNeeded();

    console.log('[E2E] Capturing role_dropdown_admin_light.png...');
    await adminPage.evaluate(() => {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    });
    await adminMemberRoleSelect.focus();
    await adminPage.waitForTimeout(300);
    await saveScreenshot(adminPage, 'role_dropdown_admin_light.png');

    console.log('[E2E] Capturing role_dropdown_admin_dark.png...');
    await adminPage.evaluate(() => {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    });
    await adminMemberRoleSelect.focus();
    await adminPage.waitForTimeout(300);
    await saveScreenshot(adminPage, 'role_dropdown_admin_dark.png');

    await adminContext.close();
    console.log('\n✅ All 8 TEAM-3 Playwright screenshots captured successfully!');
  } finally {
    await browser.close();
    if (serverProcess) {
      serverProcess.kill('SIGTERM');
    }
  }
}

verifyTeam3E2E().then(() => {
  process.exit(0);
}).catch((err) => {
  console.error('Fatal E2E error:', err);
  process.exit(1);
});
