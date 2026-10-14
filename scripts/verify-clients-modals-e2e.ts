import { UserRepository, OrganizationRepository } from '../lib/db/repositories';
import { query } from '../lib/db';
import bcrypt from 'bcryptjs';
import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = '/home/maazzalii/.gemini/antigravity-ide/brain/4d42e8c1-8525-48b1-af23-ff9d4d840500';

interface ComputedColorReport {
  component: string;
  theme: string;
  surfaceBg: string;
  borderColor: string;
  headingColor: string;
  textColor: string;
  inputBg?: string;
  inputBorder?: string;
  primaryBtnBg?: string;
  primaryBtnColor?: string;
  modalBackdrop?: string;
}

async function verifyClientsModals() {
  console.log('=== STARTING CLIENTS FORMS & MODALS (7B) BROWSER VERIFICATION ===');

  const ts = Date.now();
  const email = `clients_modals_${ts}@example.com`;
  const rawPassword = 'PlaywrightPass123!';
  const passwordHash = await bcrypt.hash(rawPassword, 10);

  const userRepo = new UserRepository();
  const orgRepo = new OrganizationRepository();

  const user = await userRepo.create({
    email,
    passwordHash,
    fullName: 'Client Operations Director',
    role: 'org_admin',
    requirePasswordChange: false,
  });

  const org = await orgRepo.create({
    name: 'Vanguard Global Advisory ' + ts,
    slug: 'vanguard-adv-' + ts,
    ownerUserId: user.id,
  });

  console.log(`[E2E] Provisioned user ${user.email} with workspace ${org.slug}`);

  // Seed sample client tags
  await query(
    `INSERT INTO tags (organization_id, name, color)
     VALUES 
       ($1, 'Enterprise', 'emerald'),
       ($1, 'Priority', 'amber'),
       ($1, 'In Review', 'sky')
     ON CONFLICT DO NOTHING`,
    [org.id]
  );

  // Seed sample clients (one connected, one manual)
  const client1Res = await query<{ id: string }>(
    `INSERT INTO clients (
       organization_id, name, company, email, phone, platform, country, currency,
       payment_schedule, status, communication_mode, notes, tags
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'USD', 'Monthly Retainer', 'active', 'connected', 'Dedicated enterprise client with Slack channel integration.', $8)
     RETURNING id`,
    [
      org.id,
      'Nexus Global Enterprises',
      'Nexus Holdings Inc',
      `nexus_${ts}@enterprises.com`,
      '+1 (555) 345-6789',
      'Slack',
      'United States',
      ['Enterprise', 'Priority'],
    ]
  );
  const client1Id = client1Res.rows[0].id;

  const client2Res = await query<{ id: string }>(
    `INSERT INTO clients (
       organization_id, name, company, email, phone, platform, country, currency,
       payment_schedule, status, communication_mode, notes, tags
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'GBP', 'Per Project', 'active', 'manual', 'Manual communication mode client awaiting Connected Hub upgrade.', $8)
     RETURNING id`,
    [
      org.id,
      'Horizon Media Labs',
      'Horizon Creative Group',
      `horizon_${ts}@medialabs.co.uk`,
      '+44 20 7946 0888',
      'WhatsApp',
      'United Kingdom',
      ['In Review'],
    ]
  );
  const client2Id = client2Res.rows[0].id;

  console.log(`[E2E] Seeded Client 1 (Connected): ${client1Id}, Client 2 (Manual): ${client2Id}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
  const page = await context.newPage();

  const colorReports: ComputedColorReport[] = [];

  // Theme toggle helper
  async function setTheme(theme: 'light' | 'dark') {
    await page.evaluate((t) => {
      if (t === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light');
      }
    }, theme);
    await page.waitForTimeout(250);
  }

  // 1. Authenticate
  console.log('[E2E] Logging in...');
  await page.goto('http://localhost:3000/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', rawPassword);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard**', { timeout: 15000 });
  console.log('[E2E] Successfully authenticated.');

  // ══════════════════════════════════════════════════════════════
  // VIEW 1: /clients/new (ClientForm & TagSelect)
  // ══════════════════════════════════════════════════════════════
  console.log('\n--- VERIFYING ClientForm (/clients/new) ---');
  await page.goto('http://localhost:3000/clients/new');
  await page.waitForSelector('text=Add New Client', { timeout: 10000 });

  // 1.1 Form - Light Theme
  await setTheme('light');
  const formLightPath = path.join(ARTIFACT_DIR, 'clients_new_form_light.png');
  await page.screenshot({ path: formLightPath, fullPage: true });
  console.log(`[E2E] Captured: ${formLightPath}`);

  const formLightStyles = await page.evaluate(() => {
    const card = document.querySelector('form');
    const h1 = document.querySelector('h1');
    const label = document.querySelector('label');
    const input = document.querySelector('input[name="name"]');
    const submitBtn = document.querySelector('button[type="submit"]');
    return {
      component: 'ClientForm',
      theme: 'Light',
      surfaceBg: card ? getComputedStyle(card).backgroundColor : 'N/A',
      borderColor: input ? getComputedStyle(input).borderColor : 'N/A',
      headingColor: h1 ? getComputedStyle(h1).color : 'N/A',
      textColor: label ? getComputedStyle(label).color : 'N/A',
      inputBg: input ? getComputedStyle(input).backgroundColor : 'N/A',
      inputBorder: input ? getComputedStyle(input).borderColor : 'N/A',
      primaryBtnBg: submitBtn ? getComputedStyle(submitBtn).backgroundColor : 'N/A',
      primaryBtnColor: submitBtn ? getComputedStyle(submitBtn).color : 'N/A',
    };
  });
  colorReports.push(formLightStyles);

  // 1.2 Form - Dark Theme
  await setTheme('dark');
  const formDarkPath = path.join(ARTIFACT_DIR, 'clients_new_form_dark.png');
  await page.screenshot({ path: formDarkPath, fullPage: true });
  console.log(`[E2E] Captured: ${formDarkPath}`);

  const formDarkStyles = await page.evaluate(() => {
    const card = document.querySelector('form');
    const h1 = document.querySelector('h1');
    const label = document.querySelector('label');
    const input = document.querySelector('input[name="name"]');
    const submitBtn = document.querySelector('button[type="submit"]');
    return {
      component: 'ClientForm',
      theme: 'Dark',
      surfaceBg: card ? getComputedStyle(card).backgroundColor : 'N/A',
      borderColor: input ? getComputedStyle(input).borderColor : 'N/A',
      headingColor: h1 ? getComputedStyle(h1).color : 'N/A',
      textColor: label ? getComputedStyle(label).color : 'N/A',
      inputBg: input ? getComputedStyle(input).backgroundColor : 'N/A',
      inputBorder: input ? getComputedStyle(input).borderColor : 'N/A',
      primaryBtnBg: submitBtn ? getComputedStyle(submitBtn).backgroundColor : 'N/A',
      primaryBtnColor: submitBtn ? getComputedStyle(submitBtn).color : 'N/A',
    };
  });
  colorReports.push(formDarkStyles);

  // ══════════════════════════════════════════════════════════════
  // VIEW 2: TagSelect (Inline Creator Triggered)
  // ══════════════════════════════════════════════════════════════
  console.log('\n--- VERIFYING TagSelect (Inline Creator) ---');
  // Click "Create Tag" button in TagSelect
  const createTagBtn = page.locator('button:has-text("Create Tag")');
  await createTagBtn.click();
  await page.waitForSelector('text=Create New Client Tag', { timeout: 5000 });

  // 2.1 TagSelect - Dark Theme
  const tagSelectDarkPath = path.join(ARTIFACT_DIR, 'clients_tag_select_dark.png');
  await page.screenshot({ path: tagSelectDarkPath });
  console.log(`[E2E] Captured: ${tagSelectDarkPath}`);

  const tagDarkStyles = await page.evaluate(() => {
    const creatorBox = document.querySelector('.animate-in');
    const tagInput = creatorBox ? creatorBox.querySelector('input') : null;
    return {
      component: 'TagSelect Inline Creator',
      theme: 'Dark',
      surfaceBg: creatorBox ? getComputedStyle(creatorBox).backgroundColor : 'N/A',
      borderColor: creatorBox ? getComputedStyle(creatorBox).borderColor : 'N/A',
      headingColor: creatorBox ? getComputedStyle(creatorBox).color : 'N/A',
      textColor: tagInput ? getComputedStyle(tagInput).color : 'N/A',
      inputBg: tagInput ? getComputedStyle(tagInput).backgroundColor : 'N/A',
      inputBorder: tagInput ? getComputedStyle(tagInput).borderColor : 'N/A',
    };
  });
  colorReports.push(tagDarkStyles);

  // 2.2 TagSelect - Light Theme
  await setTheme('light');
  const tagSelectLightPath = path.join(ARTIFACT_DIR, 'clients_tag_select_light.png');
  await page.screenshot({ path: tagSelectLightPath });
  console.log(`[E2E] Captured: ${tagSelectLightPath}`);

  const tagLightStyles = await page.evaluate(() => {
    const creatorBox = document.querySelector('.animate-in');
    const tagInput = creatorBox ? creatorBox.querySelector('input') : null;
    return {
      component: 'TagSelect Inline Creator',
      theme: 'Light',
      surfaceBg: creatorBox ? getComputedStyle(creatorBox).backgroundColor : 'N/A',
      borderColor: creatorBox ? getComputedStyle(creatorBox).borderColor : 'N/A',
      headingColor: creatorBox ? getComputedStyle(creatorBox).color : 'N/A',
      textColor: tagInput ? getComputedStyle(tagInput).color : 'N/A',
      inputBg: tagInput ? getComputedStyle(tagInput).backgroundColor : 'N/A',
      inputBorder: tagInput ? getComputedStyle(tagInput).borderColor : 'N/A',
    };
  });
  colorReports.push(tagLightStyles);

  // ══════════════════════════════════════════════════════════════
  // VIEW 3: TagManagerModal (/clients -> Manage Tags)
  // ══════════════════════════════════════════════════════════════
  console.log('\n--- VERIFYING TagManagerModal (/clients) ---');
  await page.goto('http://localhost:3000/clients');
  await page.waitForSelector('text=Clients Directory', { timeout: 10000 });

  // Open Tag Manager Modal
  await page.click('button:has-text("Manage Tags")');
  await page.waitForSelector('h2:has-text("Client Tag Manager")', { timeout: 5000 });

  // 3.1 TagManagerModal - Light Theme
  await setTheme('light');
  const tagManagerLightPath = path.join(ARTIFACT_DIR, 'clients_tag_manager_modal_light.png');
  await page.screenshot({ path: tagManagerLightPath });
  console.log(`[E2E] Captured: ${tagManagerLightPath}`);

  const tagMgrLightStyles = await page.evaluate(() => {
    const modal = document.querySelector('[role="dialog"]') || document.querySelector('.shadow-2xl');
    const backdrop = modal?.parentElement;
    const h2 = modal?.querySelector('h2');
    const input = modal?.querySelector('input[type="text"]');
    const addBtn = Array.from(modal?.querySelectorAll('button') || []).find((b: any) => b.textContent?.includes('Add Tag')) || null;
    return {
      component: 'TagManagerModal',
      theme: 'Light',
      surfaceBg: modal ? getComputedStyle(modal).backgroundColor : 'N/A',
      borderColor: modal ? getComputedStyle(modal).borderColor : 'N/A',
      headingColor: h2 ? getComputedStyle(h2).color : 'N/A',
      textColor: input ? getComputedStyle(input).color : 'N/A',
      inputBg: input ? getComputedStyle(input).backgroundColor : 'N/A',
      inputBorder: input ? getComputedStyle(input).borderColor : 'N/A',
      primaryBtnBg: addBtn ? getComputedStyle(addBtn).backgroundColor : 'N/A',
      primaryBtnColor: addBtn ? getComputedStyle(addBtn).color : 'N/A',
      modalBackdrop: backdrop ? getComputedStyle(backdrop).backgroundColor : 'N/A',
    };
  });
  colorReports.push(tagMgrLightStyles);

  // 3.2 TagManagerModal - Dark Theme
  await setTheme('dark');
  const tagManagerDarkPath = path.join(ARTIFACT_DIR, 'clients_tag_manager_modal_dark.png');
  await page.screenshot({ path: tagManagerDarkPath });
  console.log(`[E2E] Captured: ${tagManagerDarkPath}`);

  const tagMgrDarkStyles = await page.evaluate(() => {
    const modal = document.querySelector('[role="dialog"]') || document.querySelector('.shadow-2xl');
    const backdrop = modal?.parentElement;
    const h2 = modal?.querySelector('h2');
    const input = modal?.querySelector('input[type="text"]');
    const addBtn = Array.from(modal?.querySelectorAll('button') || []).find((b: any) => b.textContent?.includes('Add Tag')) || null;
    return {
      component: 'TagManagerModal',
      theme: 'Dark',
      surfaceBg: modal ? getComputedStyle(modal).backgroundColor : 'N/A',
      borderColor: modal ? getComputedStyle(modal).borderColor : 'N/A',
      headingColor: h2 ? getComputedStyle(h2).color : 'N/A',
      textColor: input ? getComputedStyle(input).color : 'N/A',
      inputBg: input ? getComputedStyle(input).backgroundColor : 'N/A',
      inputBorder: input ? getComputedStyle(input).borderColor : 'N/A',
      primaryBtnBg: addBtn ? getComputedStyle(addBtn).backgroundColor : 'N/A',
      primaryBtnColor: addBtn ? getComputedStyle(addBtn).color : 'N/A',
      modalBackdrop: backdrop ? getComputedStyle(backdrop).backgroundColor : 'N/A',
    };
  });
  colorReports.push(tagMgrDarkStyles);

  // Close Tag Manager modal
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  // ══════════════════════════════════════════════════════════════
  // VIEW 4: CommunicationModeSwitchModal (/clients/[client2Id] - manual mode)
  // ══════════════════════════════════════════════════════════════
  console.log('\n--- VERIFYING CommunicationModeSwitchModal ---');
  await page.goto(`http://localhost:3000/clients/${client2Id}`);
  await page.waitForSelector('text=Horizon Media Labs', { timeout: 10000 });

  // Click "Switch to Connected Mode"
  const switchBtn = page.locator('button:has-text("Switch to Connected Mode")');
  await switchBtn.click();
  await page.waitForSelector('text=Enable Connected Mode', { timeout: 5000 });

  // 4.1 CommMode - Dark Theme
  await setTheme('dark');
  const commModeDarkPath = path.join(ARTIFACT_DIR, 'clients_comm_mode_modal_dark.png');
  await page.screenshot({ path: commModeDarkPath });
  console.log(`[E2E] Captured: ${commModeDarkPath}`);

  const commDarkStyles = await page.evaluate(() => {
    const modal = document.querySelector('[role="dialog"]') || document.querySelector('.shadow-2xl');
    const backdrop = modal?.parentElement;
    const h2 = modal?.querySelector('h2');
    const confirmBtn = Array.from(modal?.querySelectorAll('button') || []).find((b: any) => b.textContent?.includes('Confirm')) || null;
    return {
      component: 'CommunicationModeSwitchModal',
      theme: 'Dark',
      surfaceBg: modal ? getComputedStyle(modal).backgroundColor : 'N/A',
      borderColor: modal ? getComputedStyle(modal).borderColor : 'N/A',
      headingColor: h2 ? getComputedStyle(h2).color : 'N/A',
      textColor: h2 ? getComputedStyle(h2).color : 'N/A',
      primaryBtnBg: confirmBtn ? getComputedStyle(confirmBtn).backgroundColor : 'N/A',
      primaryBtnColor: confirmBtn ? getComputedStyle(confirmBtn).color : 'N/A',
      modalBackdrop: backdrop ? getComputedStyle(backdrop).backgroundColor : 'N/A',
    };
  });
  colorReports.push(commDarkStyles);

  // 4.2 CommMode - Light Theme
  await setTheme('light');
  const commModeLightPath = path.join(ARTIFACT_DIR, 'clients_comm_mode_modal_light.png');
  await page.screenshot({ path: commModeLightPath });
  console.log(`[E2E] Captured: ${commModeLightPath}`);

  const commLightStyles = await page.evaluate(() => {
    const modal = document.querySelector('[role="dialog"]') || document.querySelector('.shadow-2xl');
    const backdrop = modal?.parentElement;
    const h2 = modal?.querySelector('h2');
    const confirmBtn = Array.from(modal?.querySelectorAll('button') || []).find((b: any) => b.textContent?.includes('Confirm')) || null;
    return {
      component: 'CommunicationModeSwitchModal',
      theme: 'Light',
      surfaceBg: modal ? getComputedStyle(modal).backgroundColor : 'N/A',
      borderColor: modal ? getComputedStyle(modal).borderColor : 'N/A',
      headingColor: h2 ? getComputedStyle(h2).color : 'N/A',
      textColor: h2 ? getComputedStyle(h2).color : 'N/A',
      primaryBtnBg: confirmBtn ? getComputedStyle(confirmBtn).backgroundColor : 'N/A',
      primaryBtnColor: confirmBtn ? getComputedStyle(confirmBtn).color : 'N/A',
      modalBackdrop: backdrop ? getComputedStyle(backdrop).backgroundColor : 'N/A',
    };
  });
  colorReports.push(commLightStyles);

  // Close Comm Mode modal by clicking Cancel
  await page.click('button:has-text("Cancel")');
  await page.waitForTimeout(300);

  // ══════════════════════════════════════════════════════════════
  // VIEW 5: ClientEditModal (/clients/[client1Id] -> Edit Profile)
  // ══════════════════════════════════════════════════════════════
  console.log('\n--- VERIFYING ClientEditModal ---');
  await page.goto(`http://localhost:3000/clients/${client1Id}`);
  await page.waitForSelector('text=Nexus Global Enterprises', { timeout: 10000 });

  // Click "Edit Profile"
  await page.click('button:has-text("Edit Profile")');
  await page.waitForSelector('h2:has-text("Edit Client Profile")', { timeout: 5000 });

  // 5.1 ClientEdit - Light Theme
  await setTheme('light');
  const clientEditLightPath = path.join(ARTIFACT_DIR, 'clients_edit_modal_light.png');
  await page.screenshot({ path: clientEditLightPath });
  console.log(`[E2E] Captured: ${clientEditLightPath}`);

  const editLightStyles = await page.evaluate(() => {
    const modal = document.querySelector('.shadow-2xl');
    const backdrop = modal?.parentElement;
    const h2 = modal?.querySelector('h2');
    const input = modal?.querySelector('input[name="name"]');
    const saveBtn = Array.from(modal?.querySelectorAll('button') || []).find((b: any) => b.textContent?.includes('Save')) || null;
    return {
      component: 'ClientEditModal',
      theme: 'Light',
      surfaceBg: modal ? getComputedStyle(modal).backgroundColor : 'N/A',
      borderColor: modal ? getComputedStyle(modal).borderColor : 'N/A',
      headingColor: h2 ? getComputedStyle(h2).color : 'N/A',
      textColor: input ? getComputedStyle(input).color : 'N/A',
      inputBg: input ? getComputedStyle(input).backgroundColor : 'N/A',
      inputBorder: input ? getComputedStyle(input).borderColor : 'N/A',
      primaryBtnBg: saveBtn ? getComputedStyle(saveBtn).backgroundColor : 'N/A',
      primaryBtnColor: saveBtn ? getComputedStyle(saveBtn).color : 'N/A',
      modalBackdrop: backdrop ? getComputedStyle(backdrop).backgroundColor : 'N/A',
    };
  });
  colorReports.push(editLightStyles);

  // 5.2 ClientEdit - Dark Theme
  await setTheme('dark');
  const clientEditDarkPath = path.join(ARTIFACT_DIR, 'clients_edit_modal_dark.png');
  await page.screenshot({ path: clientEditDarkPath });
  console.log(`[E2E] Captured: ${clientEditDarkPath}`);

  const editDarkStyles = await page.evaluate(() => {
    const modal = document.querySelector('.shadow-2xl');
    const backdrop = modal?.parentElement;
    const h2 = modal?.querySelector('h2');
    const input = modal?.querySelector('input[name="name"]');
    const saveBtn = Array.from(modal?.querySelectorAll('button') || []).find((b: any) => b.textContent?.includes('Save')) || null;
    return {
      component: 'ClientEditModal',
      theme: 'Dark',
      surfaceBg: modal ? getComputedStyle(modal).backgroundColor : 'N/A',
      borderColor: modal ? getComputedStyle(modal).borderColor : 'N/A',
      headingColor: h2 ? getComputedStyle(h2).color : 'N/A',
      textColor: input ? getComputedStyle(input).color : 'N/A',
      inputBg: input ? getComputedStyle(input).backgroundColor : 'N/A',
      inputBorder: input ? getComputedStyle(input).borderColor : 'N/A',
      primaryBtnBg: saveBtn ? getComputedStyle(saveBtn).backgroundColor : 'N/A',
      primaryBtnColor: saveBtn ? getComputedStyle(saveBtn).color : 'N/A',
      modalBackdrop: backdrop ? getComputedStyle(backdrop).backgroundColor : 'N/A',
    };
  });
  colorReports.push(editDarkStyles);

  // Close modal
  await page.click('button:has-text("Cancel")');
  await page.waitForTimeout(300);

  // ══════════════════════════════════════════════════════════════
  // MULTI-ROUTE THEME PERSISTENCE
  // /clients → /clients/new → /clients/[client1Id] → /settings → /dashboard
  // ══════════════════════════════════════════════════════════════
  console.log('\n--- VERIFYING MULTI-ROUTE THEME PERSISTENCE ---');

  // Step 1: Dark mode on /clients
  await page.goto('http://localhost:3000/clients');
  await setTheme('dark');
  let isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
  if (!isDark) throw new Error('Theme did not set to dark on /clients');
  console.log('[E2E] Step 1 PASS: /clients in Dark mode');

  // Step 2: Navigate to /clients/new -> confirm dark persists
  await page.goto('http://localhost:3000/clients/new');
  await page.waitForSelector('text=Add New Client', { timeout: 10000 });
  isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
  if (!isDark) throw new Error('Theme lost dark mode on /clients/new');
  console.log('[E2E] Step 2 PASS: /clients/new retains Dark mode');

  // Step 3: Navigate to /clients/[client1Id] -> confirm dark persists
  await page.goto(`http://localhost:3000/clients/${client1Id}`);
  await page.waitForSelector('text=Nexus Global Enterprises', { timeout: 10000 });
  isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
  if (!isDark) throw new Error('Theme lost dark mode on /clients/[id]');
  console.log('[E2E] Step 3 PASS: /clients/[id] retains Dark mode');

  // Step 4: Navigate to /settings -> switch to light
  await page.goto('http://localhost:3000/settings');
  await page.waitForURL('**/settings/**', { timeout: 10000 });
  await setTheme('light');
  let isLight = await page.evaluate(() => !document.documentElement.classList.contains('dark'));
  if (!isLight) throw new Error('Theme did not switch to light on /settings');
  console.log('[E2E] Step 4 PASS: /settings in Light mode');

  // Step 5: Navigate to /dashboard -> confirm light persists
  await page.goto('http://localhost:3000/dashboard');
  await page.waitForSelector('text=Workspace Overview', { timeout: 10000 });
  isLight = await page.evaluate(() => !document.documentElement.classList.contains('dark'));
  if (!isLight) throw new Error('Theme lost light mode on /dashboard');
  console.log('[E2E] Step 5 PASS: /dashboard retains Light mode');

  console.log('\n=== COMPUTED COLOR MEASUREMENTS REPORT ===');
  console.log(JSON.stringify(colorReports, null, 2));

  await browser.close();
  console.log('\n=== E2E BROWSER VERIFICATION COMPLETE: ALL 10 SCREENSHOTS CAPTURED & PERSISTENCE VERIFIED ===\n');
  process.exit(0);
}

verifyClientsModals().catch((err) => {
  console.error('[E2E ERROR]', err);
  process.exit(1);
});
