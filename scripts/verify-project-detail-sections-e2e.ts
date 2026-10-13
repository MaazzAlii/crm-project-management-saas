import { UserRepository, OrganizationRepository } from '../lib/db/repositories';
import { query } from '../lib/db';
import bcrypt from 'bcryptjs';
import { chromium } from 'playwright';

const ARTIFACT_DIR = '/home/maazzalii/.gemini/antigravity-ide/brain/cf073fd7-d5ad-42d9-9757-652ed5a77ddf';

async function verifyProjectDetailSections() {
  console.log('=== STARTING PROJECT DETAIL SECTIONS (6D2) BROWSER VERIFICATION ===');

  const ts = Date.now();
  const email = `sections_lead_${ts}@example.com`;
  const rawPassword = 'PlaywrightPass123!';
  const passwordHash = await bcrypt.hash(rawPassword, 10);

  const userRepo = new UserRepository();
  const orgRepo = new OrganizationRepository();

  const user = await userRepo.create({
    email,
    passwordHash,
    fullName: 'Technical Delivery Lead',
    role: 'org_admin',
    requirePasswordChange: false,
  });

  const org = await orgRepo.create({
    name: 'Innoventix Delivery ' + ts,
    slug: 'delivery-ws-' + ts,
    ownerUserId: user.id,
  });

  console.log(`[E2E] Provisioned user ${user.email} with workspace ${org.slug}`);

  // Seed client
  const clientRes = await query<{ id: string }>(
    `INSERT INTO clients (organization_id, name, email, company)
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [org.id, 'Apex Global Tech', `apex_${ts}@example.com`, 'Apex Global']
  );
  const clientId = clientRes.rows[0].id;

  // Seed Project 1 (Populated with deliverable & task)
  const project1Res = await query<{ id: string }>(
    `INSERT INTO projects (
       organization_id, client_id, assigned_to, title, description,
       status, amount, currency, start_date, deadline
     )
     VALUES ($1, $2, $3, $4, $5, 'Planning', 95000, 'USD', NOW(), NOW() + INTERVAL '30 days')
     RETURNING id`,
    [
      org.id,
      clientId,
      user.id,
      'Cloud Platform Modernization',
      'Kubernetes multi-cluster deployment with unified observability.'
    ]
  );
  const project1Id = project1Res.rows[0].id;

  // Seed Deliverable in Project 1
  await query(
    `INSERT INTO deliverables (organization_id, project_id, title, status, drive_link)
     VALUES ($1, $2, $3, 'pending', 'https://drive.google.com/spec-doc')`,
    [org.id, project1Id, 'Sprint 1 Architecture Specs']
  );

  // Seed Task in Project 1
  await query(
    `INSERT INTO tasks (organization_id, project_id, title, priority, status, due_date)
     VALUES ($1, $2, $3, 'high', 'todo', NOW() + INTERVAL '7 days')`,
    [org.id, project1Id, 'Deploy Core Ingress Controller']
  );

  // Seed Activity Log in Project 1
  await query(
    `INSERT INTO project_activity_log (organization_id, project_id, actor_id, actor_name, action, details)
     VALUES ($1, $2, $3, $4, 'INITIALIZED_BLUEPRINT', '{"blueprint":"v1.2"}')`,
    [org.id, project1Id, user.id, user.full_name]
  );

  // Seed Project 2 (Empty for empty state verification)
  const project2Res = await query<{ id: string }>(
    `INSERT INTO projects (
       organization_id, client_id, assigned_to, title, description,
       status, amount, currency
     )
     VALUES ($1, $2, $3, 'Blank Exploration Project', 'Zero deliverables and tasks initially.', 'Planning', 10000, 'USD')
     RETURNING id`,
    [org.id, clientId, user.id]
  );
  const project2Id = project2Res.rows[0].id;
  console.log(`[E2E] Seeded test projects: ${project1Id} (active), ${project2Id} (empty)`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
  const page = await context.newPage();

  // 1. Authenticate
  console.log('[E2E] Logging in...');
  await page.goto('http://localhost:3000/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', rawPassword);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard**', { timeout: 15000 });

  // 2. Navigate to populated project
  await page.goto(`http://localhost:3000/projects/${project1Id}`);
  await page.waitForSelector('text=Deliverables & Review', { timeout: 10000 });
  await page.waitForSelector('text=Project Milestones & Task Checklist', { timeout: 10000 });
  console.log('[E2E] Project detail loaded with both sections');

  // CLARIFICATION QUERY: Inspect "Add Deliverable" action button
  const clarificationData = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Add Deliverable')
    );
    if (!btn) return { found: false };

    let current: HTMLElement | null = btn;
    const path: string[] = [];
    while (current && current.tagName !== 'BODY') {
      const cls = current.className ? '.' + current.className.trim().split(/\s+/).join('.') : '';
      path.unshift(current.tagName.toLowerCase() + cls);
      current = current.parentElement;
    }

    const computed = window.getComputedStyle(btn);
    return {
      found: true,
      tagName: btn.tagName,
      textContent: btn.textContent?.trim(),
      className: btn.className,
      domPath: path.join(' > '),
      color: computed.color,
      backgroundColor: computed.backgroundColor,
    };
  });
  console.log('[E2E] Clarification Analysis for "Deliverable action button":\n', JSON.stringify(clarificationData, null, 2));

  // 3. Measure LIGHT THEME
  console.log('[E2E] Configuring Light Mode...');
  await page.evaluate(() => {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  });
  await page.waitForTimeout(600);

  // Open "Add Deliverable" form to measure placeholder & value input
  await page.click('button:has-text("Add Deliverable")');
  await page.waitForSelector('input[placeholder*="Final Video Cut"]', { timeout: 5000 });
  const deliverableInput = page.locator('input[placeholder*="Final Video Cut"]');
  await deliverableInput.fill('High-Fidelity Wireframes');

  const lightStyles = await page.evaluate(() => {
    const delItemTitle = document.querySelector('h4');
    const delBadge = Array.from(document.querySelectorAll('span.rounded-full')).find((s) =>
      s.textContent?.includes('Pending Review')
    );
    const input = document.querySelector('input[placeholder*="Final Video Cut"]') as HTMLInputElement | null;
    const taskTitle = Array.from(document.querySelectorAll('span')).find((s) =>
      s.textContent?.includes('Deploy Core Ingress Controller')
    );
    const activityLog = Array.from(document.querySelectorAll('div')).find((d) =>
      d.textContent?.includes('INITIALIZED_BLUEPRINT')
    );
    const progressBar = document.querySelector('div.h-full.rounded-full');
    const addDeliverableBtn = Array.from(document.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Save Deliverable')
    );

    return {
      delItemTitleColor: delItemTitle ? window.getComputedStyle(delItemTitle).color : 'N/A',
      delBadgeColor: delBadge ? window.getComputedStyle(delBadge).color : 'N/A',
      delBadgeBg: delBadge ? window.getComputedStyle(delBadge).backgroundColor : 'N/A',
      inputTextColor: input ? window.getComputedStyle(input).color : 'N/A',
      inputBg: input ? window.getComputedStyle(input).backgroundColor : 'N/A',
      taskTitleColor: taskTitle ? window.getComputedStyle(taskTitle).color : 'N/A',
      activityLogColor: activityLog ? window.getComputedStyle(activityLog).color : 'N/A',
      progressBarBg: progressBar ? window.getComputedStyle(progressBar).backgroundColor : 'N/A',
      saveBtnColor: addDeliverableBtn ? window.getComputedStyle(addDeliverableBtn).color : 'N/A',
      saveBtnBg: addDeliverableBtn ? window.getComputedStyle(addDeliverableBtn).backgroundColor : 'N/A',
      fontFamily: delItemTitle ? window.getComputedStyle(delItemTitle).fontFamily : 'N/A',
    };
  });
  console.log('[E2E] Light Mode Computed Styles:\n', JSON.stringify(lightStyles, null, 2));

  // Screenshot Deliverables in Light Mode
  const deliverablesSection = page.locator('div:has(h2:has-text("Deliverables & Review"))').first();
  const timelineSection = page.locator('div.space-y-6:has(h2:has-text("Project Milestones"))').first();

  const delLightPath = `${ARTIFACT_DIR}/projects_deliverables_light.png`;
  await deliverablesSection.screenshot({ path: delLightPath });
  console.log(`[E2E] Saved Deliverables Light Mode screenshot to ${delLightPath}`);

  const timelineLightPath = `${ARTIFACT_DIR}/projects_timeline_light.png`;
  await timelineSection.screenshot({ path: timelineLightPath });
  console.log(`[E2E] Saved Timeline Light Mode screenshot to ${timelineLightPath}`);

  // Cancel form
  await page.click('button:has-text("Cancel")');
  await page.waitForTimeout(300);

  // 4. Measure DARK THEME
  console.log('[E2E] Configuring Dark Mode...');
  await page.evaluate(() => {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  });
  await page.waitForTimeout(600);

  // Open "Add Deliverable" form in dark mode
  await page.click('button:has-text("Add Deliverable")');
  await page.waitForSelector('input[placeholder*="Final Video Cut"]', { timeout: 5000 });
  await page.locator('input[placeholder*="Final Video Cut"]').fill('Dark Mode Architectural Audit');

  const darkStyles = await page.evaluate(() => {
    const delItemTitle = document.querySelector('h4');
    const delBadge = Array.from(document.querySelectorAll('span.rounded-full')).find((s) =>
      s.textContent?.includes('Pending Review')
    );
    const input = document.querySelector('input[placeholder*="Final Video Cut"]') as HTMLInputElement | null;
    const taskTitle = Array.from(document.querySelectorAll('span')).find((s) =>
      s.textContent?.includes('Deploy Core Ingress Controller')
    );
    const activityLog = Array.from(document.querySelectorAll('div')).find((d) =>
      d.textContent?.includes('INITIALIZED_BLUEPRINT')
    );
    const progressBar = document.querySelector('div.h-full.rounded-full');
    const addDeliverableBtn = Array.from(document.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Save Deliverable')
    );

    return {
      delItemTitleColor: delItemTitle ? window.getComputedStyle(delItemTitle).color : 'N/A',
      delBadgeColor: delBadge ? window.getComputedStyle(delBadge).color : 'N/A',
      delBadgeBg: delBadge ? window.getComputedStyle(delBadge).backgroundColor : 'N/A',
      inputTextColor: input ? window.getComputedStyle(input).color : 'N/A',
      inputBg: input ? window.getComputedStyle(input).backgroundColor : 'N/A',
      taskTitleColor: taskTitle ? window.getComputedStyle(taskTitle).color : 'N/A',
      activityLogColor: activityLog ? window.getComputedStyle(activityLog).color : 'N/A',
      progressBarBg: progressBar ? window.getComputedStyle(progressBar).backgroundColor : 'N/A',
      saveBtnColor: addDeliverableBtn ? window.getComputedStyle(addDeliverableBtn).color : 'N/A',
      saveBtnBg: addDeliverableBtn ? window.getComputedStyle(addDeliverableBtn).backgroundColor : 'N/A',
      fontFamily: delItemTitle ? window.getComputedStyle(delItemTitle).fontFamily : 'N/A',
    };
  });
  console.log('[E2E] Dark Mode Computed Styles:\n', JSON.stringify(darkStyles, null, 2));

  // Screenshot Deliverables in Dark Mode
  const delDarkPath = `${ARTIFACT_DIR}/projects_deliverables_dark.png`;
  await deliverablesSection.screenshot({ path: delDarkPath });
  console.log(`[E2E] Saved Deliverables Dark Mode screenshot to ${delDarkPath}`);

  const timelineDarkPath = `${ARTIFACT_DIR}/projects_timeline_dark.png`;
  await timelineSection.screenshot({ path: timelineDarkPath });
  console.log(`[E2E] Saved Timeline Dark Mode screenshot to ${timelineDarkPath}`);

  // 5. Measure EMPTY STATES on project 2
  console.log(`[E2E] Navigating to empty project ${project2Id}...`);
  await page.goto(`http://localhost:3000/projects/${project2Id}`);
  await page.waitForSelector('text=No deliverables uploaded yet.', { timeout: 10000 });
  await page.waitForSelector('text=No tasks created yet for this project.', { timeout: 10000 });

  const emptyStyles = await page.evaluate(() => {
    const emptyDelText = Array.from(document.querySelectorAll('p')).find((p) =>
      p.textContent?.includes('No deliverables uploaded yet.')
    );
    const emptyTaskText = Array.from(document.querySelectorAll('div')).find((d) =>
      d.textContent?.includes('No tasks created yet for this project.')
    );
    const emptyActivityText = Array.from(document.querySelectorAll('div')).find((d) =>
      d.textContent?.includes('No activity logged yet.')
    );

    return {
      emptyDelTextColor: emptyDelText ? window.getComputedStyle(emptyDelText).color : 'N/A',
      emptyTaskTextColor: emptyTaskText ? window.getComputedStyle(emptyTaskText).color : 'N/A',
      emptyActivityTextColor: emptyActivityText ? window.getComputedStyle(emptyActivityText).color : 'N/A',
    };
  });
  console.log('[E2E] Empty States Computed Styles:\n', JSON.stringify(emptyStyles, null, 2));

  // 6. Multi-Route Navigation Check
  console.log('[E2E] Multi-Route verification (/projects/[id] → /projects → /dashboard)...');
  for (const theme of ['light', 'dark']) {
    await page.evaluate((t) => {
      if (t === 'dark') {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
    }, theme);

    for (const route of [`/projects/${project1Id}`, '/projects', '/dashboard']) {
      await page.goto(`http://localhost:3000${route}`);
      await page.waitForTimeout(400);
      const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
      const expectedDark = theme === 'dark';
      if (isDark !== expectedDark) throw new Error(`Theme mismatch on ${route}: expected ${theme}`);
      console.log(`[E2E] Route ${route} verified in ${theme} mode (dark=${isDark})`);
    }
  }

  await browser.close();
  console.log('=== PROJECT DETAIL SECTIONS BROWSER VERIFICATION COMPLETED SUCCESSFULLY ===');
  process.exit(0);
}

verifyProjectDetailSections().catch((err) => {
  console.error('[E2E] FATAL ERROR:', err);
  process.exit(1);
});
