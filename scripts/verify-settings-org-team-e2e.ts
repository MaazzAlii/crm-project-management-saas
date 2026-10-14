import { UserRepository, OrganizationRepository } from '../lib/db/repositories';
import { query } from '../lib/db';
import bcrypt from 'bcryptjs';
import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = '/home/maazzalii/.gemini/antigravity-ide/brain/9eb8ad3f-7a90-4e9e-b71a-434921a8930c';

interface ComputedColorEntry {
  view: string;
  theme: string;
  element: string;
  backgroundColor: string;
  textColor: string;
  borderColor?: string;
}

async function verifySettingsOrgTeam() {
  console.log('=== STARTING SUB-BATCH 8A SETTINGS ORG & TEAM E2E VERIFICATION ===');

  const ts = Date.now();
  const ownerEmail = `settings_owner_${ts}@example.com`;
  const rawPassword = 'PlaywrightPass123!';
  const passwordHash = await bcrypt.hash(rawPassword, 10);

  const userRepo = new UserRepository();
  const orgRepo = new OrganizationRepository();

  // 1. Provision owner & workspace
  const owner = await userRepo.create({
    email: ownerEmail,
    passwordHash,
    fullName: 'Executive Lead ' + ts,
    role: 'org_admin',
    requirePasswordChange: false,
  });

  const org = await orgRepo.create({
    name: 'Innoventix Enterprise Solutions ' + ts,
    slug: 'innoventix-ent-' + ts,
    ownerUserId: owner.id,
  });

  // Seed second member to populate table
  const teammate = await userRepo.create({
    email: `teammate_${ts}@example.com`,
    passwordHash,
    fullName: 'Senior Engineer ' + ts,
    role: 'user',
    requirePasswordChange: false,
  });

  await query(
    `INSERT INTO organization_members (organization_id, user_id, role)
     VALUES ($1, $2, 'member')`,
    [org.id, teammate.id]
  );

  // Seed pending invitation
  await query(
    `INSERT INTO invitations (organization_id, email, role, token_hash, status, expires_at, invited_by)
     VALUES ($1, $2, 'viewer', $3, 'pending', NOW() + INTERVAL '7 days', $4)`,
    [org.id, `invitee_${ts}@partnercorp.com`, `hash_${ts}`, owner.id]
  );

  console.log(`[E2E] Provisioned owner ${owner.email} with workspace ${org.slug}, team member, and pending invite`);

  // Launch browser
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  const colorEntries: ComputedColorEntry[] = [];

  // Helper to switch theme
  async function setTheme(theme: 'light' | 'dark') {
    await page.evaluate((targetTheme) => {
      const html = document.documentElement;
      if (targetTheme === 'dark') {
        html.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        html.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
    }, theme);
    await page.waitForTimeout(300);
  }

  // Helper to read theme
  async function getTheme(): Promise<string> {
    return page.evaluate(() => {
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    });
  }

  // 1. Authenticate
  console.log('[E2E] Logging in...');
  await page.goto('http://localhost:3000/login');
  await page.fill('input[type="email"]', ownerEmail);
  await page.fill('input[type="password"]', rawPassword);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard**', { timeout: 15000 });
  console.log('[E2E] Successfully authenticated.');

  // ══════════════════════════════════════════════════════════════
  // VIEW 1: /settings/organization
  // ══════════════════════════════════════════════════════════════
  console.log('\n--- VERIFYING /settings/organization ---');
  await page.goto('http://localhost:3000/settings/organization');
  await page.waitForSelector('text=General Organization Profile', { timeout: 10000 });

  // 1.1 Organization - Light
  await setTheme('light');
  const orgLightPath = path.join(ARTIFACT_DIR, 'settings_org_light.png');
  await page.screenshot({ path: orgLightPath, fullPage: true });
  console.log(`[E2E] Captured: ${orgLightPath}`);

  const orgLightMetrics = await page.evaluate(() => {
    const input = document.querySelector('input[type="text"]');
    const label = document.querySelector('label');
    const submitBtn = document.querySelector('button[type="submit"]');
    return {
      inputBg: input ? getComputedStyle(input).backgroundColor : 'N/A',
      inputText: input ? getComputedStyle(input).color : 'N/A',
      inputBorder: input ? getComputedStyle(input).borderColor : 'N/A',
      labelColor: label ? getComputedStyle(label).color : 'N/A',
      buttonBg: submitBtn ? getComputedStyle(submitBtn).backgroundColor : 'N/A',
      buttonText: submitBtn ? getComputedStyle(submitBtn).color : 'N/A',
    };
  });

  colorEntries.push({
    view: '/settings/organization',
    theme: 'Light',
    element: 'Form Input (Org Name)',
    backgroundColor: orgLightMetrics.inputBg,
    textColor: orgLightMetrics.inputText,
    borderColor: orgLightMetrics.inputBorder,
  });
  colorEntries.push({
    view: '/settings/organization',
    theme: 'Light',
    element: 'Form Label',
    backgroundColor: 'transparent',
    textColor: orgLightMetrics.labelColor,
  });
  colorEntries.push({
    view: '/settings/organization',
    theme: 'Light',
    element: 'Save Button (Primary)',
    backgroundColor: orgLightMetrics.buttonBg,
    textColor: orgLightMetrics.buttonText,
  });

  // 1.2 Organization - Dark
  await setTheme('dark');
  const orgDarkPath = path.join(ARTIFACT_DIR, 'settings_org_dark.png');
  await page.screenshot({ path: orgDarkPath, fullPage: true });
  console.log(`[E2E] Captured: ${orgDarkPath}`);

  const orgDarkMetrics = await page.evaluate(() => {
    const input = document.querySelector('input[type="text"]');
    const label = document.querySelector('label');
    const submitBtn = document.querySelector('button[type="submit"]');
    return {
      inputBg: input ? getComputedStyle(input).backgroundColor : 'N/A',
      inputText: input ? getComputedStyle(input).color : 'N/A',
      inputBorder: input ? getComputedStyle(input).borderColor : 'N/A',
      labelColor: label ? getComputedStyle(label).color : 'N/A',
      buttonBg: submitBtn ? getComputedStyle(submitBtn).backgroundColor : 'N/A',
      buttonText: submitBtn ? getComputedStyle(submitBtn).color : 'N/A',
    };
  });

  colorEntries.push({
    view: '/settings/organization',
    theme: 'Dark',
    element: 'Form Input (Org Name)',
    backgroundColor: orgDarkMetrics.inputBg,
    textColor: orgDarkMetrics.inputText,
    borderColor: orgDarkMetrics.inputBorder,
  });
  colorEntries.push({
    view: '/settings/organization',
    theme: 'Dark',
    element: 'Form Label',
    backgroundColor: 'transparent',
    textColor: orgDarkMetrics.labelColor,
  });
  colorEntries.push({
    view: '/settings/organization',
    theme: 'Dark',
    element: 'Save Button (Primary)',
    backgroundColor: orgDarkMetrics.buttonBg,
    textColor: orgDarkMetrics.buttonText,
  });

  console.log(`[E2E] Organization Dark Input Background: ${orgDarkMetrics.inputBg}`);
  if (orgDarkMetrics.inputBg === 'rgb(255, 255, 255)') {
    throw new Error('CRITICAL FAILURE: Organization input background is white in dark mode!');
  }

  // ══════════════════════════════════════════════════════════════
  // VIEW 2: /settings/team
  // ══════════════════════════════════════════════════════════════
  console.log('\n--- VERIFYING /settings/team ---');
  await page.goto('http://localhost:3000/settings/team');
  await page.waitForSelector('text=Organization Team Members', { timeout: 10000 });

  // 2.1 Team - Light
  await setTheme('light');
  const teamLightPath = path.join(ARTIFACT_DIR, 'settings_team_light.png');
  await page.screenshot({ path: teamLightPath, fullPage: true });
  console.log(`[E2E] Captured: ${teamLightPath}`);

  const teamLightMetrics = await page.evaluate(() => {
    const inviteBtn = Array.from(document.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Invite Member')
    );
    const tableRow = document.querySelector('tbody tr');
    const rowText = tableRow ? tableRow.querySelector('td')?.textContent : '';
    const rowEl = tableRow ? tableRow.querySelector('td div.font-semibold') : null;
    const ownerBadge = Array.from(document.querySelectorAll('span')).find((s) =>
      s.textContent?.includes('Owner')
    );
    const memberBadge = Array.from(document.querySelectorAll('span, select')).find((s) =>
      s.textContent?.includes('Member')
    );
    const pendingBadge = document.querySelector('[data-testid="status-badge-pending"]');

    return {
      inviteBtnBg: inviteBtn ? getComputedStyle(inviteBtn).backgroundColor : 'N/A',
      inviteBtnText: inviteBtn ? getComputedStyle(inviteBtn).color : 'N/A',
      rowTextColor: rowEl ? getComputedStyle(rowEl).color : 'N/A',
      ownerBadgeBg: ownerBadge ? getComputedStyle(ownerBadge).backgroundColor : 'N/A',
      ownerBadgeText: ownerBadge ? getComputedStyle(ownerBadge).color : 'N/A',
      pendingBadgeBg: pendingBadge ? getComputedStyle(pendingBadge).backgroundColor : 'N/A',
      pendingBadgeText: pendingBadge ? getComputedStyle(pendingBadge).color : 'N/A',
    };
  });

  colorEntries.push({
    view: '/settings/team',
    theme: 'Light',
    element: 'Primary Action Button (Invite)',
    backgroundColor: teamLightMetrics.inviteBtnBg,
    textColor: teamLightMetrics.inviteBtnText,
  });
  colorEntries.push({
    view: '/settings/team',
    theme: 'Light',
    element: 'Table Row Text',
    backgroundColor: 'transparent',
    textColor: teamLightMetrics.rowTextColor,
  });
  colorEntries.push({
    view: '/settings/team',
    theme: 'Light',
    element: 'Owner Status Badge',
    backgroundColor: teamLightMetrics.ownerBadgeBg,
    textColor: teamLightMetrics.ownerBadgeText,
  });
  colorEntries.push({
    view: '/settings/team',
    theme: 'Light',
    element: 'Pending Invite Badge',
    backgroundColor: teamLightMetrics.pendingBadgeBg,
    textColor: teamLightMetrics.pendingBadgeText,
  });

  // 2.2 Team - Dark
  await setTheme('dark');
  const teamDarkPath = path.join(ARTIFACT_DIR, 'settings_team_dark.png');
  await page.screenshot({ path: teamDarkPath, fullPage: true });
  console.log(`[E2E] Captured: ${teamDarkPath}`);

  const teamDarkMetrics = await page.evaluate(() => {
    const inviteBtn = Array.from(document.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Invite Member')
    );
    const tableRow = document.querySelector('tbody tr');
    const rowEl = tableRow ? tableRow.querySelector('td div.font-semibold') : null;
    const ownerBadge = Array.from(document.querySelectorAll('span')).find((s) =>
      s.textContent?.includes('Owner')
    );
    const pendingBadge = document.querySelector('[data-testid="status-badge-pending"]');

    return {
      inviteBtnBg: inviteBtn ? getComputedStyle(inviteBtn).backgroundColor : 'N/A',
      inviteBtnText: inviteBtn ? getComputedStyle(inviteBtn).color : 'N/A',
      rowTextColor: rowEl ? getComputedStyle(rowEl).color : 'N/A',
      ownerBadgeBg: ownerBadge ? getComputedStyle(ownerBadge).backgroundColor : 'N/A',
      ownerBadgeText: ownerBadge ? getComputedStyle(ownerBadge).color : 'N/A',
      pendingBadgeBg: pendingBadge ? getComputedStyle(pendingBadge).backgroundColor : 'N/A',
      pendingBadgeText: pendingBadge ? getComputedStyle(pendingBadge).color : 'N/A',
    };
  });

  colorEntries.push({
    view: '/settings/team',
    theme: 'Dark',
    element: 'Primary Action Button (Invite)',
    backgroundColor: teamDarkMetrics.inviteBtnBg,
    textColor: teamDarkMetrics.inviteBtnText,
  });
  colorEntries.push({
    view: '/settings/team',
    theme: 'Dark',
    element: 'Table Row Text',
    backgroundColor: 'transparent',
    textColor: teamDarkMetrics.rowTextColor,
  });
  colorEntries.push({
    view: '/settings/team',
    theme: 'Dark',
    element: 'Owner Status Badge',
    backgroundColor: teamDarkMetrics.ownerBadgeBg,
    textColor: teamDarkMetrics.ownerBadgeText,
  });
  colorEntries.push({
    view: '/settings/team',
    theme: 'Dark',
    element: 'Pending Invite Badge',
    backgroundColor: teamDarkMetrics.pendingBadgeBg,
    textColor: teamDarkMetrics.pendingBadgeText,
  });

  // ══════════════════════════════════════════════════════════════
  // VIEW 3: InviteMemberDialog from /settings/team
  // ══════════════════════════════════════════════════════════════
  console.log('\n--- VERIFYING InviteMemberDialog ---');

  // Trigger modal
  console.log('[E2E] Clicking Invite Member button...');
  await page.locator('button', { hasText: 'Invite Member' }).first().click();
  await page.waitForSelector('[data-testid="invite-dialog"]', { timeout: 10000 });
  console.log('[E2E] InviteMemberDialog is visible.');

  // 3.1 Invite Dialog - Light
  await setTheme('light');
  const dialogLightPath = path.join(ARTIFACT_DIR, 'settings_invite_dialog_light.png');
  await page.screenshot({ path: dialogLightPath, fullPage: true });
  console.log(`[E2E] Captured: ${dialogLightPath}`);

  const dialogLightMetrics = await page.evaluate(() => {
    const overlay = document.querySelector('[data-testid="invite-dialog"]');
    const input = overlay?.querySelector('input[type="email"]');
    const label = overlay?.querySelector('label');
    const sendBtn = overlay?.querySelector('button[type="submit"]');

    return {
      backdropBg: overlay ? getComputedStyle(overlay).backgroundColor : 'N/A',
      inputBg: input ? getComputedStyle(input).backgroundColor : 'N/A',
      inputText: input ? getComputedStyle(input).color : 'N/A',
      inputBorder: input ? getComputedStyle(input).borderColor : 'N/A',
      labelColor: label ? getComputedStyle(label).color : 'N/A',
      sendBtnBg: sendBtn ? getComputedStyle(sendBtn).backgroundColor : 'N/A',
      sendBtnText: sendBtn ? getComputedStyle(sendBtn).color : 'N/A',
    };
  });

  colorEntries.push({
    view: 'InviteMemberDialog',
    theme: 'Light',
    element: 'Modal Backdrop Overlay',
    backgroundColor: dialogLightMetrics.backdropBg,
    textColor: 'N/A',
  });
  colorEntries.push({
    view: 'InviteMemberDialog',
    theme: 'Light',
    element: 'Dialog Input (Email)',
    backgroundColor: dialogLightMetrics.inputBg,
    textColor: dialogLightMetrics.inputText,
    borderColor: dialogLightMetrics.inputBorder,
  });
  colorEntries.push({
    view: 'InviteMemberDialog',
    theme: 'Light',
    element: 'Dialog Label',
    backgroundColor: 'transparent',
    textColor: dialogLightMetrics.labelColor,
  });
  colorEntries.push({
    view: 'InviteMemberDialog',
    theme: 'Light',
    element: 'Send Invite Button',
    backgroundColor: dialogLightMetrics.sendBtnBg,
    textColor: dialogLightMetrics.sendBtnText,
  });

  // 3.2 Invite Dialog - Dark
  await setTheme('dark');
  const dialogDarkPath = path.join(ARTIFACT_DIR, 'settings_invite_dialog_dark.png');
  await page.screenshot({ path: dialogDarkPath, fullPage: true });
  console.log(`[E2E] Captured: ${dialogDarkPath}`);

  const dialogDarkMetrics = await page.evaluate(() => {
    const overlay = document.querySelector('[data-testid="invite-dialog"]');
    const input = overlay?.querySelector('input[type="email"]');
    const label = overlay?.querySelector('label');
    const sendBtn = overlay?.querySelector('button[type="submit"]');

    return {
      backdropBg: overlay ? getComputedStyle(overlay).backgroundColor : 'N/A',
      inputBg: input ? getComputedStyle(input).backgroundColor : 'N/A',
      inputText: input ? getComputedStyle(input).color : 'N/A',
      inputBorder: input ? getComputedStyle(input).borderColor : 'N/A',
      labelColor: label ? getComputedStyle(label).color : 'N/A',
      sendBtnBg: sendBtn ? getComputedStyle(sendBtn).backgroundColor : 'N/A',
      sendBtnText: sendBtn ? getComputedStyle(sendBtn).color : 'N/A',
    };
  });

  colorEntries.push({
    view: 'InviteMemberDialog',
    theme: 'Dark',
    element: 'Modal Backdrop Overlay',
    backgroundColor: dialogDarkMetrics.backdropBg,
    textColor: 'N/A',
  });
  colorEntries.push({
    view: 'InviteMemberDialog',
    theme: 'Dark',
    element: 'Dialog Input (Email)',
    backgroundColor: dialogDarkMetrics.inputBg,
    textColor: dialogDarkMetrics.inputText,
    borderColor: dialogDarkMetrics.inputBorder,
  });
  colorEntries.push({
    view: 'InviteMemberDialog',
    theme: 'Dark',
    element: 'Dialog Label',
    backgroundColor: 'transparent',
    textColor: dialogDarkMetrics.labelColor,
  });
  colorEntries.push({
    view: 'InviteMemberDialog',
    theme: 'Dark',
    element: 'Send Invite Button',
    backgroundColor: dialogDarkMetrics.sendBtnBg,
    textColor: dialogDarkMetrics.sendBtnText,
  });

  console.log(`[E2E] Dialog Dark Mode Input Background: ${dialogDarkMetrics.inputBg}`);
  if (dialogDarkMetrics.inputBg === 'rgb(255, 255, 255)') {
    throw new Error('CRITICAL FAILURE: InviteMemberDialog email input is white in dark mode!');
  }

  // Close modal
  await page.click('[data-testid="invite-dialog"] button:has-text("Cancel")');
  await page.waitForTimeout(300);

  // ══════════════════════════════════════════════════════════════
  // VIEW 4: Multi-Route Navigation & Theme Persistence
  // /settings/organization → /settings/team → /dashboard
  // ══════════════════════════════════════════════════════════════
  console.log('\n--- VERIFYING Multi-Route Theme Persistence ---');

  // Test Dark Route Chain
  await setTheme('dark');
  console.log('[E2E] Starting multi-route hop in DARK mode...');
  await page.goto('http://localhost:3000/settings/organization');
  const orgThemeDark = await getTheme();
  console.log(`[E2E] /settings/organization theme: ${orgThemeDark}`);
  if (orgThemeDark !== 'dark') throw new Error('Theme did not persist at /settings/organization');

  await page.goto('http://localhost:3000/settings/team');
  const teamThemeDark = await getTheme();
  console.log(`[E2E] /settings/team theme: ${teamThemeDark}`);
  if (teamThemeDark !== 'dark') throw new Error('Theme did not persist at /settings/team');

  await page.goto('http://localhost:3000/dashboard');
  const dashThemeDark = await getTheme();
  console.log(`[E2E] /dashboard theme: ${dashThemeDark}`);
  if (dashThemeDark !== 'dark') throw new Error('Theme did not persist at /dashboard');

  const dashMultiRoutePath = path.join(ARTIFACT_DIR, 'multi_route_settings_to_dashboard_dark.png');
  await page.screenshot({ path: dashMultiRoutePath });
  console.log(`[E2E] Captured: ${dashMultiRoutePath}`);

  // Test Light Route Chain
  await setTheme('light');
  console.log('[E2E] Starting multi-route hop in LIGHT mode...');
  await page.goto('http://localhost:3000/settings/organization');
  const orgThemeLight = await getTheme();
  if (orgThemeLight !== 'light') throw new Error('Theme did not persist at /settings/organization');

  await page.goto('http://localhost:3000/settings/team');
  const teamThemeLight = await getTheme();
  if (teamThemeLight !== 'light') throw new Error('Theme did not persist at /settings/team');

  await page.goto('http://localhost:3000/dashboard');
  const dashThemeLight = await getTheme();
  if (dashThemeLight !== 'light') throw new Error('Theme did not persist at /dashboard');

  console.log('[E2E] Multi-route theme persistence verified across all hops in both themes.');

  // Print results table
  console.log('\n=== COMPUTED COLOR METRICS TABLE ===');
  console.log('| View | Theme | Element | Background Color | Text Color | Border Color |');
  console.log('|---|---|---|---|---|---|');
  for (const c of colorEntries) {
    console.log(
      `| ${c.view} | ${c.theme} | ${c.element} | \`${c.backgroundColor}\` | \`${c.textColor}\` | \`${c.borderColor || 'N/A'}\` |`
    );
  }

  await browser.close();
  console.log('\n=== SUB-BATCH 8A BROWSER VERIFICATION COMPLETE: ALL CHECKS PASSED ===');
}

verifySettingsOrgTeam().catch((err) => {
  console.error('E2E Verification Failed:', err);
  process.exit(1);
});
