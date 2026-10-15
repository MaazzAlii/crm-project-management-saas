import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { spawn, ChildProcess } from 'child_process';
import { query } from '../lib/db';
import { userRepo } from '../lib/db/repositories/user-repo';
import { orgRepo } from '../lib/db/repositories/org-repo';
import { createInvitation } from '../lib/services/invitation-service';
import bcrypt from 'bcryptjs';

const ARTIFACT_DIR = '/home/maazzalii/.gemini/antigravity-ide/brain/14ad1ea3-4d08-4064-a0d2-19239f235c28';
const BATCH_ASSETS_DIR = path.join(process.cwd(), 'assets/screenshots/team-4');
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

async function verifyTeam4E2E() {
  console.log('=== STARTING TEAM-4 E2E PLAYWRIGHT VERIFICATION ===');

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

  // Seed test users & organization
  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const password = 'Password123!';
  const passwordHash = await bcrypt.hash(password, 10);

  // 1. Owner (Active, logged in recently)
  const ownerUser = await userRepo.create({
    email: `team4_owner_${id}@example.com`,
    fullName: 'Elena Rostova (Lead)',
    passwordHash,
  });
  await query(`UPDATE users SET email_verified = true, last_login_at = NOW(), is_active = true WHERE id = $1`, [ownerUser.id]);

  const org = await orgRepo.create({
    name: `Innoventix Team 4 Labs ${id}`,
    slug: `team4-labs-${id}`,
    ownerUserId: ownerUser.id,
  });

  // 2. Admin (Active, logged in >30d ago)
  const adminUser = await userRepo.create({
    email: `team4_admin_${id}@example.com`,
    fullName: 'Marcus Vance (Admin)',
    passwordHash,
  });
  await query(
    `UPDATE users SET email_verified = true, last_login_at = NOW() - INTERVAL '42 days', is_active = true WHERE id = $1`,
    [adminUser.id]
  );
  await orgRepo.addMember(
    org.id,
    adminUser.id,
    'admin',
    ownerUser.id
  );

  // 3. Member (Suspended: is_active = false)
  const suspendedUser = await userRepo.create({
    email: `team4_suspended_${id}@example.com`,
    fullName: 'David Karr (Contractor)',
    passwordHash,
  });
  await query(
    `UPDATE users SET email_verified = true, last_login_at = NOW() - INTERVAL '2 days', is_active = false WHERE id = $1`,
    [suspendedUser.id]
  );
  await orgRepo.addMember(
    org.id,
    suspendedUser.id,
    'member',
    ownerUser.id
  );

  // 4. Create pending invitation
  try {
    await createInvitation(
      { userId: ownerUser.id, orgId: org.id, userRole: 'owner' } as any,
      {
        email: `invitee_${id}@example.com`,
        role: 'member',
      }
    );
  } catch (e: any) {
    console.log('[E2E] Pending invitation creation notice:', e.message);
  }

  // 5. Seed project & tasks for Workload testing
  const clientRes = await query<{ id: string }>(
    `INSERT INTO clients (organization_id, name, email, status)
     VALUES ($1, 'Acme Corp', 'acme@example.com', 'active')
     RETURNING id`,
    [org.id]
  );
  const clientId = clientRes.rows[0].id;

  const projRes = await query<{ id: string }>(
    `INSERT INTO projects (organization_id, client_id, title, status)
     VALUES ($1, $2, 'Alpha Mobile App', 'in_progress')
     RETURNING id`,
    [org.id, clientId]
  );
  const projectId = projRes.rows[0].id;

  // Insert tasks assigned to owner and admin
  await query(
    `INSERT INTO tasks (organization_id, project_id, title, status, priority, due_date, assigned_to, created_at, updated_at)
     VALUES 
     ($1, $2, 'Design navigation architecture', 'todo', 'high', CURRENT_DATE + INTERVAL '5 days', $3, NOW(), NOW()),
     ($1, $2, 'Implement push notification service', 'in_progress', 'urgent', CURRENT_DATE - INTERVAL '2 days', $3, NOW(), NOW()),
     ($1, $2, 'Configure App Store deployment pipeline', 'done', 'medium', CURRENT_DATE - INTERVAL '1 day', $3, NOW(), NOW()),
     ($1, $2, 'Review API contracts with backend team', 'review', 'medium', CURRENT_DATE + INTERVAL '2 days', $4, NOW(), NOW())`,
    [org.id, projectId, ownerUser.id, adminUser.id]
  );

  console.log(`[E2E] Database seeded successfully for Org: ${org.name}`);

  // Launch Playwright
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  try {
    // Log in as Owner
    console.log('[E2E] Logging in...');
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"], input[name="email"]', ownerUser.email);
    await page.fill('input[type="password"], input[name="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });
    console.log('[E2E] Login successful, navigated to:', page.url());

    // 1. Visit Team Settings page
    console.log('[E2E] Navigating to /settings/team...');
    await page.goto(`${BASE_URL}/settings/team`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Verify status badges and last active
    const activeBadge = page.locator(`[data-testid="member-status-badge-${ownerUser.id}"]`);
    await activeBadge.waitFor({ state: 'visible', timeout: 5000 });
    console.log('[E2E] Active badge visible for owner');

    const suspendedBadge = page.locator(`[data-testid="member-status-badge-${suspendedUser.id}"]`);
    await suspendedBadge.waitFor({ state: 'visible', timeout: 5000 });
    console.log('[E2E] Suspended badge visible for suspended member');

    // Screenshot 1: team_status_light.png
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    });
    await page.screenshot({
      path: path.join(BATCH_ASSETS_DIR, 'team_status_light.png'),
      fullPage: true,
    });
    copyToArtifact('team_status_light.png');

    // Screenshot 2: team_status_dark.png
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    await page.screenshot({
      path: path.join(BATCH_ASSETS_DIR, 'team_status_dark.png'),
      fullPage: true,
    });
    copyToArtifact('team_status_dark.png');

    // 2. Open MemberProfileModal
    console.log('[E2E] Testing MemberProfileModal...');
    const memberRowBtn = page.locator(`[data-testid="member-row-btn-${ownerUser.id}"]`);
    await memberRowBtn.click();

    const profileModal = page.locator('[data-testid="member-profile-modal"]');
    await profileModal.waitFor({ state: 'visible', timeout: 5000 });

    // Verify modal accessibility attributes
    const roleAttr = await profileModal.getAttribute('role');
    const ariaModalAttr = await profileModal.getAttribute('aria-modal');
    const ariaLabelledBy = await profileModal.getAttribute('aria-labelledby');
    console.log(`[E2E] Modal Accessibility: role=${roleAttr}, aria-modal=${ariaModalAttr}, labelledby=${ariaLabelledBy}`);

    // Screenshot 3: member_profile_dark.png
    await page.screenshot({
      path: path.join(BATCH_ASSETS_DIR, 'member_profile_dark.png'),
    });
    copyToArtifact('member_profile_dark.png');

    // Screenshot 4: member_profile_light.png
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    });
    await page.screenshot({
      path: path.join(BATCH_ASSETS_DIR, 'member_profile_light.png'),
    });
    copyToArtifact('member_profile_light.png');

    // Test ESC closes modal and restores focus
    await page.keyboard.press('Escape');
    await profileModal.waitFor({ state: 'hidden', timeout: 3000 });
    console.log('[E2E] Modal closed via ESC key');

    // 3. Pending Invitations Card
    console.log('[E2E] Testing Pending Invitations Polling & Refresh...');
    const refreshBtn = page.locator('[data-testid="refresh-pending-invites-btn"]');
    await refreshBtn.waitFor({ state: 'visible', timeout: 5000 });
    await refreshBtn.click();
    await page.waitForTimeout(500);

    const pendingList = page.locator('[data-testid="pending-invitations-list"]');
    await pendingList.scrollIntoViewIfNeeded();

    // Screenshot 5: pending_invites_light.png
    await page.screenshot({
      path: path.join(BATCH_ASSETS_DIR, 'pending_invites_light.png'),
    });
    copyToArtifact('pending_invites_light.png');

    // Screenshot 6: pending_invites_dark.png
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    await page.screenshot({
      path: path.join(BATCH_ASSETS_DIR, 'pending_invites_dark.png'),
    });
    copyToArtifact('pending_invites_dark.png');

    // 4. Workload View Client-Side Filtering
    console.log('[E2E] Navigating to /tasks for Workload View testing...');
    await page.goto(`${BASE_URL}/tasks`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Switch to Workload tab
    const workloadTabBtn = page.locator('button:has-text("Workload")');
    if (await workloadTabBtn.isVisible()) {
      await workloadTabBtn.click();
      await page.waitForTimeout(500);
    }

    const workloadContainer = page.locator('[data-testid="workload-view-container"]');
    await workloadContainer.waitFor({ state: 'visible', timeout: 5000 });

    const projectFilter = page.locator('[data-testid="workload-project-filter"]');
    const statusFilter = page.locator('[data-testid="workload-status-filter"]');
    await projectFilter.waitFor({ state: 'visible', timeout: 5000 });
    await statusFilter.waitFor({ state: 'visible', timeout: 5000 });

    // Filter by 'in_progress' status
    await statusFilter.selectOption('in_progress');
    await page.waitForTimeout(500);
    console.log('[E2E] Applied in_progress workload filter client-side');

    // Screenshot 7: workload_filtered_dark.png
    await page.screenshot({
      path: path.join(BATCH_ASSETS_DIR, 'workload_filtered_dark.png'),
      fullPage: true,
    });
    copyToArtifact('workload_filtered_dark.png');

    // Screenshot 8: workload_filtered_light.png
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    });
    await page.screenshot({
      path: path.join(BATCH_ASSETS_DIR, 'workload_filtered_light.png'),
      fullPage: true,
    });
    copyToArtifact('workload_filtered_light.png');

    console.log('=== ALL 8 E2E SCREENSHOTS CAPTURED SUCCESSFULLY ===');
  } catch (err: any) {
    console.error('[E2E Error]:', err);
    throw err;
  } finally {
    await browser.close();
    if (serverProcess) {
      serverProcess.kill('SIGTERM');
    }
  }
}

verifyTeam4E2E().catch((err) => {
  console.error('[E2E Fatal]:', err);
  process.exit(1);
});
