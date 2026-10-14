import { UserRepository, OrganizationRepository } from '../lib/db/repositories';
import { query } from '../lib/db';
import bcrypt from 'bcryptjs';
import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = '/home/maazzalii/.gemini/antigravity-ide/brain/9eb8ad3f-7a90-4e9e-b71a-434921a8930c';

async function verifyDarkModeInputs() {
  console.log('=== REAL BROWSER VERIFICATION: DARK MODE INPUT BACKGROUND CHECK ===\n');

  const ts = Date.now();
  const email = `darkmode_verify_${ts}@example.com`;
  const rawPassword = 'VerifyPass123!';
  const passwordHash = await bcrypt.hash(rawPassword, 10);

  const userRepo = new UserRepository();
  const orgRepo = new OrganizationRepository();

  const user = await userRepo.create({
    email,
    passwordHash,
    fullName: 'Dark Mode Inspector',
    role: 'org_admin',
    requirePasswordChange: false,
  });

  const org = await orgRepo.create({
    name: 'Token Audit Org ' + ts,
    slug: 'token-audit-' + ts,
    ownerUserId: user.id,
  });

  // Seed sample client
  const clientRes = await query<{ id: string }>(
    `INSERT INTO clients (
       organization_id, name, company, email, phone, platform, country, currency,
       payment_schedule, status, communication_mode, notes, tags
     )
     VALUES ($1, 'Acme Global Corp', 'Acme Holdings', 'acme@example.com', '+1-555-0199', 'Slack', 'United States', 'USD', 'Monthly Retainer', 'active', 'connected', 'Key enterprise client.', ARRAY['Enterprise'])
     RETURNING id`,
    [org.id]
  );
  const clientId = clientRes.rows[0].id;

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
  const page = await context.newPage();

  async function setDarkMode() {
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    });
    await page.waitForTimeout(200);
  }

  const results: Record<string, { selector: string; bgColor: string; color: string; isDark: boolean }> = {};

  // ─────────────────────────────────────────────────────────────
  // CHECK 1: /login (before logging in)
  // ─────────────────────────────────────────────────────────────
  console.log('[1/5] Checking /login in dark mode...');
  await page.goto('http://localhost:3000/login');
  await setDarkMode();
  const loginInput = await page.evaluate(() => {
    const input = document.querySelector('input[type="email"]') as HTMLInputElement;
    const style = window.getComputedStyle(input);
    return {
      bgColor: style.backgroundColor,
      color: style.color,
    };
  });
  results['/login'] = {
    selector: 'input[type="email"]',
    bgColor: loginInput.bgColor,
    color: loginInput.color,
    isDark: loginInput.bgColor !== 'rgb(255, 255, 255)',
  };
  console.log(`  /login input backgroundColor: ${loginInput.bgColor} (color: ${loginInput.color})`);

  // Now login
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', rawPassword);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard**', { timeout: 15000 });
  await setDarkMode();

  // ─────────────────────────────────────────────────────────────
  // CHECK 2: /dashboard
  // ─────────────────────────────────────────────────────────────
  console.log('\n[2/5] Checking /dashboard in dark mode...');
  await page.goto('http://localhost:3000/dashboard');
  await setDarkMode();
  const dashboardInput = await page.evaluate(() => {
    const input = document.querySelector('input, select') as HTMLElement;
    if (!input) return { selector: 'none', bgColor: 'N/A', color: 'N/A' };
    const style = window.getComputedStyle(input);
    return {
      selector: input.tagName.toLowerCase() + (input.getAttribute('name') ? `[name="${input.getAttribute('name')}"]` : ''),
      bgColor: style.backgroundColor,
      color: style.color,
    };
  });
  results['/dashboard'] = {
    selector: dashboardInput.selector,
    bgColor: dashboardInput.bgColor,
    color: dashboardInput.color,
    isDark: dashboardInput.bgColor !== 'rgb(255, 255, 255)',
  };
  console.log(`  /dashboard input (${dashboardInput.selector}) backgroundColor: ${dashboardInput.bgColor}`);

  // ─────────────────────────────────────────────────────────────
  // CHECK 3: /clients/new (STEP 4)
  // ─────────────────────────────────────────────────────────────
  console.log('\n[3/5] Checking /clients/new in dark mode (STEP 4)...');
  await page.goto('http://localhost:3000/clients/new');
  await page.waitForSelector('input[name="name"]', { timeout: 10000 });
  await setDarkMode();

  const clientsNewInput = await page.evaluate(() => {
    const input = document.querySelector('input[name="name"]') as HTMLInputElement;
    const style = window.getComputedStyle(input);
    return {
      bgColor: style.backgroundColor,
      color: style.color,
    };
  });
  results['/clients/new'] = {
    selector: 'input[name="name"]',
    bgColor: clientsNewInput.bgColor,
    color: clientsNewInput.color,
    isDark: clientsNewInput.bgColor !== 'rgb(255, 255, 255)',
  };
  console.log(`  /clients/new input[name="name"] backgroundColor: ${clientsNewInput.bgColor} (color: ${clientsNewInput.color})`);

  const clientsNewScreenshot = path.join(ARTIFACT_DIR, 'clients_new_dark_fixed.png');
  await page.screenshot({ path: clientsNewScreenshot, fullPage: true });
  console.log(`  Screenshot saved: ${clientsNewScreenshot}`);

  // ─────────────────────────────────────────────────────────────
  // CHECK 4: /clients/[id]
  // ─────────────────────────────────────────────────────────────
  console.log(`\n[4/5] Checking /clients/${clientId} in dark mode...`);
  await page.goto(`http://localhost:3000/clients/${clientId}`);
  await page.waitForSelector('text=Acme Global Corp', { timeout: 10000 });
  await setDarkMode();

  const clientsDetailScreenshot = path.join(ARTIFACT_DIR, 'clients_id_dark_fixed.png');
  await page.screenshot({ path: clientsDetailScreenshot, fullPage: true });
  console.log(`  Screenshot saved: ${clientsDetailScreenshot}`);

  // Open Edit Client Modal on /clients/[id] to check its inputs
  const editBtn = await page.$('button:has-text("Edit Profile")');
  let clientDetailInputBg = 'N/A';
  let clientDetailInputColor = 'N/A';
  if (editBtn) {
    await editBtn.click();
    await page.waitForSelector('input[name="name"]', { timeout: 5000 });
    const modalInput = await page.evaluate(() => {
      const input = document.querySelector('input[name="name"]') as HTMLInputElement;
      const style = window.getComputedStyle(input);
      return {
        bgColor: style.backgroundColor,
        color: style.color,
      };
    });
    clientDetailInputBg = modalInput.bgColor;
    clientDetailInputColor = modalInput.color;
    console.log(`  /clients/[id] edit modal input backgroundColor: ${clientDetailInputBg}`);
    // Close modal
    const closeBtn = await page.$('button[aria-label="Close modal"]');
    if (closeBtn) await closeBtn.click();
  }
  results['/clients/[id]'] = {
    selector: 'Edit modal input[name="name"]',
    bgColor: clientDetailInputBg,
    color: clientDetailInputColor,
    isDark: clientDetailInputBg !== 'rgb(255, 255, 255)',
  };

  // ─────────────────────────────────────────────────────────────
  // CHECK 5: /projects (Kanban / Modal)
  // ─────────────────────────────────────────────────────────────
  console.log('\n[5/5] Checking /projects (New Project Modal & filters) in dark mode...');
  await page.goto('http://localhost:3000/projects');
  await page.waitForSelector('h1', { timeout: 10000 });
  await setDarkMode();

  // Check filter input
  const projectSearchInput = await page.evaluate(() => {
    const input = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
    if (!input) return null;
    const style = window.getComputedStyle(input);
    return {
      bgColor: style.backgroundColor,
      color: style.color,
    };
  });
  if (projectSearchInput) {
    console.log(`  /projects search input backgroundColor: ${projectSearchInput.bgColor}`);
  }

  // Open Create Project modal
  const newProjectBtn = await page.$('button:has-text("New Project"), button:has-text("Create Project")');
  let projectModalInputBg = 'N/A';
  let projectModalInputColor = 'N/A';
  if (newProjectBtn) {
    await newProjectBtn.click();
    await page.waitForSelector('input[name="title"], input[placeholder*="project name" i], input[type="text"]', { timeout: 5000 });
    const modalInput = await page.evaluate(() => {
      const input = document.querySelector('.fixed input, [role="dialog"] input, input[name="title"], input[type="text"]') as HTMLInputElement;
      if (!input) return { bgColor: 'N/A', color: 'N/A' };
      const style = window.getComputedStyle(input);
      return {
        bgColor: style.backgroundColor,
        color: style.color,
      };
    });
    projectModalInputBg = modalInput.bgColor;
    projectModalInputColor = modalInput.color;
    console.log(`  /projects modal input backgroundColor: ${projectModalInputBg}`);
  }
  results['/projects/new (modal)'] = {
    selector: 'New Project Modal input',
    bgColor: projectModalInputBg,
    color: projectModalInputColor,
    isDark: projectModalInputBg !== 'rgb(255, 255, 255)',
  };

  // ─────────────────────────────────────────────────────────────
  // CHECK 6: /settings/team (Invite Member Dialog)
  // ─────────────────────────────────────────────────────────────
  console.log('\n[6/6] Checking /settings/team (Invite Member Dialog) in dark mode...');
  await page.goto('http://localhost:3000/settings/team?action=invite');
  await page.waitForSelector('input[type="email"], [data-testid="invite-dialog"]', { timeout: 10000 });
  await setDarkMode();

  const teamModalInput = await page.evaluate(() => {
    const input = document.querySelector('input[type="email"], input[name="email"]') as HTMLInputElement;
    if (!input) return { bgColor: 'N/A', color: 'N/A' };
    const style = window.getComputedStyle(input);
    return {
      bgColor: style.backgroundColor,
      color: style.color,
    };
  });
  console.log(`  /settings/team invite input backgroundColor: ${teamModalInput.bgColor} (color: ${teamModalInput.color})`);
  results['/settings/team (invite dialog)'] = {
    selector: 'Invite member input[type="email"]',
    bgColor: teamModalInput.bgColor,
    color: teamModalInput.color,
    isDark: teamModalInput.bgColor !== 'rgb(255, 255, 255)',
  };

  await browser.close();

  console.log('\n══════════════════════════════════════════════════════════════════════════════');
  console.log('SUMMARY TABLE: COMPUTED INPUT BACKGROUND COLOR IN DARK MODE ACROSS 5+ ROUTES');
  console.log('══════════════════════════════════════════════════════════════════════════════');
  console.table(results);

  const anyWhite = Object.values(results).some((r) => r.bgColor === 'rgb(255, 255, 255)');
  if (anyWhite) {
    console.error('FAIL: Found an input with rgb(255, 255, 255) background in dark mode!');
    process.exit(1);
  } else {
    console.log('SUCCESS: All checked routes render dark background on inputs in dark mode!');
  }
}

verifyDarkModeInputs().catch((err) => {
  console.error('Error during verification:', err);
  process.exit(1);
});
