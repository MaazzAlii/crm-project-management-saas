import { UserRepository, OrganizationRepository } from '../lib/db/repositories';
import { query } from '../lib/db';
import bcrypt from 'bcryptjs';
import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = '/home/maazzalii/.gemini/antigravity-ide/brain/cfd40e88-9ce2-47db-9cd8-d5be5de77e69';

interface ComputedColorEntry {
  view: string;
  theme: string;
  element: string;
  backgroundColor: string;
  textColor: string;
  borderColor?: string;
}

async function verifySettingsIntegrations8C2() {
  console.log('=== STARTING SUB-BATCH 8C2 SETTINGS INTEGRATIONS E2E VERIFICATION ===');

  const ts = Date.now();
  const ownerEmail = `integrations_8c2_${ts}@example.com`;
  const rawPassword = 'PlaywrightPass123!';
  const passwordHash = await bcrypt.hash(rawPassword, 10);

  const userRepo = new UserRepository();
  const orgRepo = new OrganizationRepository();

  // 1. Provision owner & workspace
  const owner = await userRepo.create({
    email: ownerEmail,
    passwordHash,
    fullName: 'Integration Admin ' + ts,
    role: 'org_admin',
    requirePasswordChange: false,
  });

  const org = await orgRepo.create({
    name: 'Innoventix Hub Corp ' + ts,
    slug: 'innoventix-hub-' + ts,
    ownerUserId: owner.id,
  });

  // Seed active Email channel and disconnected Upwork channel
  await query(
    `INSERT INTO communication_channels (organization_id, provider, external_account_id, channel_name, status, connected_at, metadata)
     VALUES
     ($1, 'email', 'support@innoventixhub.tech', 'Innoventix Support Desk', 'active', NOW(), '{"sendgrid_api_key": "SG.mock_encrypted_secret"}'::jsonb),
     ($1, 'upwork', '~0198273461abcdef', 'Upwork Direct Contracts', 'disconnected', NOW(), '{"api_key": "mock_upwork_key"}'::jsonb)`,
    [org.id]
  );

  console.log(`[E2E] Provisioned owner ${owner.email} with workspace ${org.slug}`);

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
        html.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
      } else {
        html.classList.remove('dark');
        html.setAttribute('data-theme', 'light');
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
  // VIEW 1: /settings/integrations (Hub Page & Modal)
  // ══════════════════════════════════════════════════════════════
  console.log('\n--- VERIFYING /settings/integrations (Hub Page) ---');
  await page.goto('http://localhost:3000/settings/integrations');
  await page.waitForSelector('text=Channel Integrations & Webhooks', { timeout: 10000 });

  // 1.1 Hub - Light
  await setTheme('light');
  const hubLightPath = path.join(ARTIFACT_DIR, 'settings_integrations_hub_light.png');
  await page.screenshot({ path: hubLightPath, fullPage: true });
  console.log(`[E2E] Captured: ${hubLightPath}`);

  const hubLightMetrics = await page.evaluate(() => {
    const cardTitle = document.querySelector('h1');
    const hubCard = document.querySelector('.bg-card');
    const integrationTitle = document.querySelector('h3');
    const integrationDesc = document.querySelector('h3 + p');
    const manageLink = Array.from(document.querySelectorAll('a')).find(a => a.textContent?.includes('Manage Settings'));
    const statusBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Connection Status'));
    const badges = Array.from(document.querySelectorAll('span.rounded-full'));
    const connectedBadge = badges.find(b => b.textContent?.includes('Connected'));
    const disconnectedBadge = badges.find(b => b.textContent?.includes('Disconnected'));

    return {
      cardTitleColor: cardTitle ? getComputedStyle(cardTitle).color : 'N/A',
      hubCardBg: hubCard ? getComputedStyle(hubCard).backgroundColor : 'N/A',
      integrationTitleColor: integrationTitle ? getComputedStyle(integrationTitle).color : 'N/A',
      integrationDescColor: integrationDesc ? getComputedStyle(integrationDesc).color : 'N/A',
      manageLinkColor: manageLink ? getComputedStyle(manageLink).color : 'N/A',
      statusBtnColor: statusBtn ? getComputedStyle(statusBtn).color : 'N/A',
      connectedBadgeBg: connectedBadge ? getComputedStyle(connectedBadge).backgroundColor : 'N/A',
      connectedBadgeColor: connectedBadge ? getComputedStyle(connectedBadge).color : 'N/A',
      disconnectedBadgeBg: disconnectedBadge ? getComputedStyle(disconnectedBadge).backgroundColor : 'N/A',
      disconnectedBadgeColor: disconnectedBadge ? getComputedStyle(disconnectedBadge).color : 'N/A',
    };
  });

  colorEntries.push({
    view: '/settings/integrations',
    theme: 'Light',
    element: 'Hub Overview Title',
    backgroundColor: hubLightMetrics.hubCardBg,
    textColor: hubLightMetrics.cardTitleColor,
  });
  colorEntries.push({
    view: '/settings/integrations',
    theme: 'Light',
    element: 'Integration Card Title',
    backgroundColor: hubLightMetrics.hubCardBg,
    textColor: hubLightMetrics.integrationTitleColor,
  });
  colorEntries.push({
    view: '/settings/integrations',
    theme: 'Light',
    element: 'Integration Card Description',
    backgroundColor: 'transparent',
    textColor: hubLightMetrics.integrationDescColor,
  });
  colorEntries.push({
    view: '/settings/integrations',
    theme: 'Light',
    element: 'Status Badge (Connected)',
    backgroundColor: hubLightMetrics.connectedBadgeBg,
    textColor: hubLightMetrics.connectedBadgeColor,
  });
  colorEntries.push({
    view: '/settings/integrations',
    theme: 'Light',
    element: 'Status Badge (Disconnected)',
    backgroundColor: hubLightMetrics.disconnectedBadgeBg,
    textColor: hubLightMetrics.disconnectedBadgeColor,
  });
  colorEntries.push({
    view: '/settings/integrations',
    theme: 'Light',
    element: 'Manage Settings Link',
    backgroundColor: 'transparent',
    textColor: hubLightMetrics.manageLinkColor,
  });

  // 1.2 Hub - Dark
  await setTheme('dark');
  const hubDarkPath = path.join(ARTIFACT_DIR, 'settings_integrations_hub_dark.png');
  await page.screenshot({ path: hubDarkPath, fullPage: true });
  console.log(`[E2E] Captured: ${hubDarkPath}`);

  const hubDarkMetrics = await page.evaluate(() => {
    const cardTitle = document.querySelector('h1');
    const hubCard = document.querySelector('.bg-card');
    const integrationTitle = document.querySelector('h3');
    const integrationDesc = document.querySelector('h3 + p');
    const manageLink = Array.from(document.querySelectorAll('a')).find(a => a.textContent?.includes('Manage Settings'));
    const badges = Array.from(document.querySelectorAll('span.rounded-full'));
    const connectedBadge = badges.find(b => b.textContent?.includes('Connected'));
    const disconnectedBadge = badges.find(b => b.textContent?.includes('Disconnected'));

    return {
      cardTitleColor: cardTitle ? getComputedStyle(cardTitle).color : 'N/A',
      hubCardBg: hubCard ? getComputedStyle(hubCard).backgroundColor : 'N/A',
      integrationTitleColor: integrationTitle ? getComputedStyle(integrationTitle).color : 'N/A',
      integrationDescColor: integrationDesc ? getComputedStyle(integrationDesc).color : 'N/A',
      manageLinkColor: manageLink ? getComputedStyle(manageLink).color : 'N/A',
      connectedBadgeBg: connectedBadge ? getComputedStyle(connectedBadge).backgroundColor : 'N/A',
      connectedBadgeColor: connectedBadge ? getComputedStyle(connectedBadge).color : 'N/A',
      disconnectedBadgeBg: disconnectedBadge ? getComputedStyle(disconnectedBadge).backgroundColor : 'N/A',
      disconnectedBadgeColor: disconnectedBadge ? getComputedStyle(disconnectedBadge).color : 'N/A',
    };
  });

  colorEntries.push({
    view: '/settings/integrations',
    theme: 'Dark',
    element: 'Hub Overview Title',
    backgroundColor: hubDarkMetrics.hubCardBg,
    textColor: hubDarkMetrics.cardTitleColor,
  });
  colorEntries.push({
    view: '/settings/integrations',
    theme: 'Dark',
    element: 'Integration Card Title',
    backgroundColor: hubDarkMetrics.hubCardBg,
    textColor: hubDarkMetrics.integrationTitleColor,
  });
  colorEntries.push({
    view: '/settings/integrations',
    theme: 'Dark',
    element: 'Integration Card Description',
    backgroundColor: 'transparent',
    textColor: hubDarkMetrics.integrationDescColor,
  });
  colorEntries.push({
    view: '/settings/integrations',
    theme: 'Dark',
    element: 'Status Badge (Connected)',
    backgroundColor: hubDarkMetrics.connectedBadgeBg,
    textColor: hubDarkMetrics.connectedBadgeColor,
  });
  colorEntries.push({
    view: '/settings/integrations',
    theme: 'Dark',
    element: 'Status Badge (Disconnected)',
    backgroundColor: hubDarkMetrics.disconnectedBadgeBg,
    textColor: hubDarkMetrics.disconnectedBadgeColor,
  });

  // 1.3 Open ConnectionStatusModal in Dark Mode
  console.log('[E2E] Triggering ConnectionStatusModal on Hub...');
  const statusTrigger = await page.$('button:has-text("Connection Status")');
  if (statusTrigger) {
    await statusTrigger.click();
    await page.waitForSelector('text=Integration Status', { timeout: 5000 });
    const modalDarkPath = path.join(ARTIFACT_DIR, 'settings_integrations_connection_modal_dark.png');
    await page.screenshot({ path: modalDarkPath });
    console.log(`[E2E] Captured: ${modalDarkPath}`);

    const modalMetrics = await page.evaluate(() => {
      const overlay = document.querySelector('div[class*="fixed inset-0"]');
      const modalBox = document.querySelector('div.relative.w-full.max-w-lg');
      const webhookInput = modalBox ? modalBox.querySelector('input') : null;
      const copyBtn = modalBox ? Array.from(modalBox.querySelectorAll('button')).find(b => b.textContent?.includes('Copy')) : null;
      const doneBtn = modalBox ? Array.from(modalBox.querySelectorAll('button')).find(b => b.textContent?.includes('Done')) : null;

      return {
        overlayBg: overlay ? getComputedStyle(overlay).backgroundColor : 'N/A',
        modalBoxBg: modalBox ? getComputedStyle(modalBox).backgroundColor : 'N/A',
        webhookInputBg: webhookInput ? getComputedStyle(webhookInput).backgroundColor : 'N/A',
        webhookInputColor: webhookInput ? getComputedStyle(webhookInput).color : 'N/A',
        copyBtnBg: copyBtn ? getComputedStyle(copyBtn).backgroundColor : 'N/A',
        copyBtnColor: copyBtn ? getComputedStyle(copyBtn).color : 'N/A',
        doneBtnBg: doneBtn ? getComputedStyle(doneBtn).backgroundColor : 'N/A',
        doneBtnColor: doneBtn ? getComputedStyle(doneBtn).color : 'N/A',
      };
    });

    colorEntries.push({
      view: 'ConnectionStatusModal',
      theme: 'Dark',
      element: 'Modal Overlay',
      backgroundColor: modalMetrics.overlayBg,
      textColor: 'N/A',
    });
    colorEntries.push({
      view: 'ConnectionStatusModal',
      theme: 'Dark',
      element: 'Modal Card Container',
      backgroundColor: modalMetrics.modalBoxBg,
      textColor: 'N/A',
    });
    colorEntries.push({
      view: 'ConnectionStatusModal',
      theme: 'Dark',
      element: 'Modal Webhook Input',
      backgroundColor: modalMetrics.webhookInputBg,
      textColor: modalMetrics.webhookInputColor,
    });
    colorEntries.push({
      view: 'ConnectionStatusModal',
      theme: 'Dark',
      element: 'Modal Copy Button',
      backgroundColor: modalMetrics.copyBtnBg,
      textColor: modalMetrics.copyBtnColor,
    });
    colorEntries.push({
      view: 'ConnectionStatusModal',
      theme: 'Dark',
      element: 'Modal Done Button',
      backgroundColor: modalMetrics.doneBtnBg,
      textColor: modalMetrics.doneBtnColor,
    });

    console.log(`[E2E] Modal Overlay Background: ${modalMetrics.overlayBg}`);
    console.log(`[E2E] Modal Webhook Input Background: ${modalMetrics.webhookInputBg}`);

    // Close modal
    const closeBtn = await page.$('button:has-text("Done")');
    if (closeBtn) await closeBtn.click();
    await page.waitForTimeout(300);
  }

  // ══════════════════════════════════════════════════════════════
  // VIEW 2: /settings/integrations/email (Connected State)
  // ══════════════════════════════════════════════════════════════
  console.log('\n--- VERIFYING /settings/integrations/email ---');
  await page.goto('http://localhost:3000/settings/integrations/email');
  await page.waitForSelector('text=Email Channel & Inbound Parse Integration', { timeout: 10000 });

  // 2.1 Email - Light
  await setTheme('light');
  const emailLightPath = path.join(ARTIFACT_DIR, 'settings_integrations_email_light.png');
  await page.screenshot({ path: emailLightPath, fullPage: true });
  console.log(`[E2E] Captured: ${emailLightPath}`);

  const emailLightMetrics = await page.evaluate(() => {
    const cardTitle = document.querySelector('h1');
    const badge = document.querySelector('span.rounded-full');
    const inputName = document.querySelector('input[name="channel_name"]');
    const inputSender = document.querySelector('input[name="external_account_id"]');
    const inputKey = document.querySelector('input[name="sendgrid_api_key"]');
    const readonlyInputs = Array.from(document.querySelectorAll('input[readonly]'));
    const saveBtn = document.querySelector('button[type="submit"]');
    const testBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Send Test Signal'));
    const disconnectBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Disconnect'));

    return {
      cardTitleColor: cardTitle ? getComputedStyle(cardTitle).color : 'N/A',
      badgeBg: badge ? getComputedStyle(badge).backgroundColor : 'N/A',
      badgeColor: badge ? getComputedStyle(badge).color : 'N/A',
      inputNameBg: inputName ? getComputedStyle(inputName).backgroundColor : 'N/A',
      inputNameColor: inputName ? getComputedStyle(inputName).color : 'N/A',
      inputSenderBg: inputSender ? getComputedStyle(inputSender).backgroundColor : 'N/A',
      inputKeyBg: inputKey ? getComputedStyle(inputKey).backgroundColor : 'N/A',
      webhookUrlBg: readonlyInputs[0] ? getComputedStyle(readonlyInputs[0]).backgroundColor : 'N/A',
      saveBtnBg: saveBtn ? getComputedStyle(saveBtn).backgroundColor : 'N/A',
      saveBtnColor: saveBtn ? getComputedStyle(saveBtn).color : 'N/A',
      testBtnBg: testBtn ? getComputedStyle(testBtn).backgroundColor : 'N/A',
      testBtnColor: testBtn ? getComputedStyle(testBtn).color : 'N/A',
      disconnectBg: disconnectBtn ? getComputedStyle(disconnectBtn).backgroundColor : 'N/A',
      disconnectColor: disconnectBtn ? getComputedStyle(disconnectBtn).color : 'N/A',
    };
  });

  colorEntries.push({
    view: '/settings/integrations/email',
    theme: 'Light',
    element: 'Header Title',
    backgroundColor: 'transparent',
    textColor: emailLightMetrics.cardTitleColor,
  });
  colorEntries.push({
    view: '/settings/integrations/email',
    theme: 'Light',
    element: 'Status Badge (Connected)',
    backgroundColor: emailLightMetrics.badgeBg,
    textColor: emailLightMetrics.badgeColor,
  });
  colorEntries.push({
    view: '/settings/integrations/email',
    theme: 'Light',
    element: 'Form Input (Channel Name)',
    backgroundColor: emailLightMetrics.inputNameBg,
    textColor: emailLightMetrics.inputNameColor,
  });
  colorEntries.push({
    view: '/settings/integrations/email',
    theme: 'Light',
    element: 'Webhook Endpoint Input',
    backgroundColor: emailLightMetrics.webhookUrlBg,
    textColor: 'N/A',
  });
  colorEntries.push({
    view: '/settings/integrations/email',
    theme: 'Light',
    element: 'Save Action Button',
    backgroundColor: emailLightMetrics.saveBtnBg,
    textColor: emailLightMetrics.saveBtnColor,
  });
  colorEntries.push({
    view: '/settings/integrations/email',
    theme: 'Light',
    element: 'Test Signal Button',
    backgroundColor: emailLightMetrics.testBtnBg,
    textColor: emailLightMetrics.testBtnColor,
  });
  colorEntries.push({
    view: '/settings/integrations/email',
    theme: 'Light',
    element: 'Disconnect Button',
    backgroundColor: emailLightMetrics.disconnectBg,
    textColor: emailLightMetrics.disconnectColor,
  });

  // 2.2 Email - Dark
  await setTheme('dark');
  const emailDarkPath = path.join(ARTIFACT_DIR, 'settings_integrations_email_dark.png');
  await page.screenshot({ path: emailDarkPath, fullPage: true });
  console.log(`[E2E] Captured: ${emailDarkPath}`);

  const emailDarkMetrics = await page.evaluate(() => {
    const cardTitle = document.querySelector('h1');
    const badge = document.querySelector('span.rounded-full');
    const inputName = document.querySelector('input[name="channel_name"]');
    const inputSender = document.querySelector('input[name="external_account_id"]');
    const inputKey = document.querySelector('input[name="sendgrid_api_key"]');
    const readonlyInputs = Array.from(document.querySelectorAll('input[readonly]'));
    const saveBtn = document.querySelector('button[type="submit"]');
    const testBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Send Test Signal'));
    const disconnectBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Disconnect'));

    return {
      cardTitleColor: cardTitle ? getComputedStyle(cardTitle).color : 'N/A',
      badgeBg: badge ? getComputedStyle(badge).backgroundColor : 'N/A',
      badgeColor: badge ? getComputedStyle(badge).color : 'N/A',
      inputNameBg: inputName ? getComputedStyle(inputName).backgroundColor : 'N/A',
      inputNameColor: inputName ? getComputedStyle(inputName).color : 'N/A',
      inputSenderBg: inputSender ? getComputedStyle(inputSender).backgroundColor : 'N/A',
      inputKeyBg: inputKey ? getComputedStyle(inputKey).backgroundColor : 'N/A',
      webhookUrlBg: readonlyInputs[0] ? getComputedStyle(readonlyInputs[0]).backgroundColor : 'N/A',
      saveBtnBg: saveBtn ? getComputedStyle(saveBtn).backgroundColor : 'N/A',
      saveBtnColor: saveBtn ? getComputedStyle(saveBtn).color : 'N/A',
      testBtnBg: testBtn ? getComputedStyle(testBtn).backgroundColor : 'N/A',
      testBtnColor: testBtn ? getComputedStyle(testBtn).color : 'N/A',
      disconnectBg: disconnectBtn ? getComputedStyle(disconnectBtn).backgroundColor : 'N/A',
      disconnectColor: disconnectBtn ? getComputedStyle(disconnectBtn).color : 'N/A',
    };
  });

  colorEntries.push({
    view: '/settings/integrations/email',
    theme: 'Dark',
    element: 'Header Title',
    backgroundColor: 'transparent',
    textColor: emailDarkMetrics.cardTitleColor,
  });
  colorEntries.push({
    view: '/settings/integrations/email',
    theme: 'Dark',
    element: 'Status Badge (Connected)',
    backgroundColor: emailDarkMetrics.badgeBg,
    textColor: emailDarkMetrics.badgeColor,
  });
  colorEntries.push({
    view: '/settings/integrations/email',
    theme: 'Dark',
    element: 'Form Input (Channel Name)',
    backgroundColor: emailDarkMetrics.inputNameBg,
    textColor: emailDarkMetrics.inputNameColor,
  });
  colorEntries.push({
    view: '/settings/integrations/email',
    theme: 'Dark',
    element: 'Webhook Endpoint Input',
    backgroundColor: emailDarkMetrics.webhookUrlBg,
    textColor: 'N/A',
  });
  colorEntries.push({
    view: '/settings/integrations/email',
    theme: 'Dark',
    element: 'Save Action Button',
    backgroundColor: emailDarkMetrics.saveBtnBg,
    textColor: emailDarkMetrics.saveBtnColor,
  });
  colorEntries.push({
    view: '/settings/integrations/email',
    theme: 'Dark',
    element: 'Test Signal Button',
    backgroundColor: emailDarkMetrics.testBtnBg,
    textColor: emailDarkMetrics.testBtnColor,
  });
  colorEntries.push({
    view: '/settings/integrations/email',
    theme: 'Dark',
    element: 'Disconnect Button',
    backgroundColor: emailDarkMetrics.disconnectBg,
    textColor: emailDarkMetrics.disconnectColor,
  });

  console.log(`[E2E] Email Dark Mode Input Background: ${emailDarkMetrics.inputNameBg}`);
  if (emailDarkMetrics.inputNameBg === 'rgb(255, 255, 255)') {
    throw new Error('CRITICAL FAILURE: Email input background is white in dark mode!');
  }

  // ══════════════════════════════════════════════════════════════
  // VIEW 3: /settings/integrations/upwork (Not Connected State)
  // ══════════════════════════════════════════════════════════════
  console.log('\n--- VERIFYING /settings/integrations/upwork ---');
  await page.goto('http://localhost:3000/settings/integrations/upwork');
  await page.waitForSelector('text=Upwork Direct Contracts Integration', { timeout: 10000 });

  // 3.1 Upwork - Light
  await setTheme('light');
  const upworkLightPath = path.join(ARTIFACT_DIR, 'settings_integrations_upwork_light.png');
  await page.screenshot({ path: upworkLightPath, fullPage: true });
  console.log(`[E2E] Captured: ${upworkLightPath}`);

  const upworkLightMetrics = await page.evaluate(() => {
    const cardTitle = document.querySelector('h1');
    const badge = document.querySelector('span.rounded-full');
    const inputName = document.querySelector('input[name="channel_name"]');
    const inputAccount = document.querySelector('input[name="external_account_id"]');
    const inputKey = document.querySelector('input[name="api_key"]');
    const webhookInput = document.querySelector('input[readonly]');
    const saveBtn = document.querySelector('button[type="submit"]');

    return {
      cardTitleColor: cardTitle ? getComputedStyle(cardTitle).color : 'N/A',
      badgeBg: badge ? getComputedStyle(badge).backgroundColor : 'N/A',
      badgeColor: badge ? getComputedStyle(badge).color : 'N/A',
      inputNameBg: inputName ? getComputedStyle(inputName).backgroundColor : 'N/A',
      inputNameColor: inputName ? getComputedStyle(inputName).color : 'N/A',
      inputAccountBg: inputAccount ? getComputedStyle(inputAccount).backgroundColor : 'N/A',
      inputKeyBg: inputKey ? getComputedStyle(inputKey).backgroundColor : 'N/A',
      webhookInputBg: webhookInput ? getComputedStyle(webhookInput).backgroundColor : 'N/A',
      saveBtnBg: saveBtn ? getComputedStyle(saveBtn).backgroundColor : 'N/A',
      saveBtnColor: saveBtn ? getComputedStyle(saveBtn).color : 'N/A',
    };
  });

  colorEntries.push({
    view: '/settings/integrations/upwork',
    theme: 'Light',
    element: 'Header Title',
    backgroundColor: 'transparent',
    textColor: upworkLightMetrics.cardTitleColor,
  });
  colorEntries.push({
    view: '/settings/integrations/upwork',
    theme: 'Light',
    element: 'Status Badge (Not Connected)',
    backgroundColor: upworkLightMetrics.badgeBg,
    textColor: upworkLightMetrics.badgeColor,
  });
  colorEntries.push({
    view: '/settings/integrations/upwork',
    theme: 'Light',
    element: 'Form Input (Contract ID)',
    backgroundColor: upworkLightMetrics.inputAccountBg,
    textColor: 'N/A',
  });
  colorEntries.push({
    view: '/settings/integrations/upwork',
    theme: 'Light',
    element: 'API Key Input (Optional)',
    backgroundColor: upworkLightMetrics.inputKeyBg,
    textColor: 'N/A',
  });
  colorEntries.push({
    view: '/settings/integrations/upwork',
    theme: 'Light',
    element: 'Webhook Endpoint Input',
    backgroundColor: upworkLightMetrics.webhookInputBg,
    textColor: 'N/A',
  });
  colorEntries.push({
    view: '/settings/integrations/upwork',
    theme: 'Light',
    element: 'Save Action Button',
    backgroundColor: upworkLightMetrics.saveBtnBg,
    textColor: upworkLightMetrics.saveBtnColor,
  });

  // 3.2 Upwork - Dark
  await setTheme('dark');
  const upworkDarkPath = path.join(ARTIFACT_DIR, 'settings_integrations_upwork_dark.png');
  await page.screenshot({ path: upworkDarkPath, fullPage: true });
  console.log(`[E2E] Captured: ${upworkDarkPath}`);

  const upworkDarkMetrics = await page.evaluate(() => {
    const cardTitle = document.querySelector('h1');
    const badge = document.querySelector('span.rounded-full');
    const inputName = document.querySelector('input[name="channel_name"]');
    const inputAccount = document.querySelector('input[name="external_account_id"]');
    const inputKey = document.querySelector('input[name="api_key"]');
    const webhookInput = document.querySelector('input[readonly]');
    const saveBtn = document.querySelector('button[type="submit"]');

    return {
      cardTitleColor: cardTitle ? getComputedStyle(cardTitle).color : 'N/A',
      badgeBg: badge ? getComputedStyle(badge).backgroundColor : 'N/A',
      badgeColor: badge ? getComputedStyle(badge).color : 'N/A',
      inputNameBg: inputName ? getComputedStyle(inputName).backgroundColor : 'N/A',
      inputNameColor: inputName ? getComputedStyle(inputName).color : 'N/A',
      inputAccountBg: inputAccount ? getComputedStyle(inputAccount).backgroundColor : 'N/A',
      inputKeyBg: inputKey ? getComputedStyle(inputKey).backgroundColor : 'N/A',
      webhookInputBg: webhookInput ? getComputedStyle(webhookInput).backgroundColor : 'N/A',
      saveBtnBg: saveBtn ? getComputedStyle(saveBtn).backgroundColor : 'N/A',
      saveBtnColor: saveBtn ? getComputedStyle(saveBtn).color : 'N/A',
    };
  });

  colorEntries.push({
    view: '/settings/integrations/upwork',
    theme: 'Dark',
    element: 'Header Title',
    backgroundColor: 'transparent',
    textColor: upworkDarkMetrics.cardTitleColor,
  });
  colorEntries.push({
    view: '/settings/integrations/upwork',
    theme: 'Dark',
    element: 'Status Badge (Not Connected)',
    backgroundColor: upworkDarkMetrics.badgeBg,
    textColor: upworkDarkMetrics.badgeColor,
  });
  colorEntries.push({
    view: '/settings/integrations/upwork',
    theme: 'Dark',
    element: 'Form Input (Contract ID)',
    backgroundColor: upworkDarkMetrics.inputAccountBg,
    textColor: 'N/A',
  });
  colorEntries.push({
    view: '/settings/integrations/upwork',
    theme: 'Dark',
    element: 'API Key Input (Optional)',
    backgroundColor: upworkDarkMetrics.inputKeyBg,
    textColor: 'N/A',
  });
  colorEntries.push({
    view: '/settings/integrations/upwork',
    theme: 'Dark',
    element: 'Webhook Endpoint Input',
    backgroundColor: upworkDarkMetrics.webhookInputBg,
    textColor: 'N/A',
  });
  colorEntries.push({
    view: '/settings/integrations/upwork',
    theme: 'Dark',
    element: 'Save Action Button',
    backgroundColor: upworkDarkMetrics.saveBtnBg,
    textColor: upworkDarkMetrics.saveBtnColor,
  });

  console.log(`[E2E] Upwork Dark Mode Input Background: ${upworkDarkMetrics.inputNameBg}`);
  if (upworkDarkMetrics.inputNameBg === 'rgb(255, 255, 255)') {
    throw new Error('CRITICAL FAILURE: Upwork input background is white in dark mode!');
  }

  // ══════════════════════════════════════════════════════════════
  // VIEW 4: Multi-Route Navigation & Theme Persistence
  // /settings/integrations → /settings/integrations/email → /settings/integrations/upwork → /dashboard
  // ══════════════════════════════════════════════════════════════
  console.log('\n--- VERIFYING Multi-Route Theme Persistence ---');

  // Test Dark Route Chain
  await setTheme('dark');
  console.log('[E2E] Starting multi-route hop in DARK mode...');
  await page.goto('http://localhost:3000/settings/integrations');
  const hubThemeDark = await getTheme();
  if (hubThemeDark !== 'dark') throw new Error('Theme did not persist at /settings/integrations');

  await page.goto('http://localhost:3000/settings/integrations/email');
  const emailThemeDark = await getTheme();
  if (emailThemeDark !== 'dark') throw new Error('Theme did not persist at /settings/integrations/email');

  await page.goto('http://localhost:3000/settings/integrations/upwork');
  const upworkThemeDark = await getTheme();
  if (upworkThemeDark !== 'dark') throw new Error('Theme did not persist at /settings/integrations/upwork');

  await page.goto('http://localhost:3000/dashboard');
  const dashThemeDark = await getTheme();
  if (dashThemeDark !== 'dark') throw new Error('Theme did not persist at /dashboard');

  const multiRouteDarkPath = path.join(ARTIFACT_DIR, 'multi_route_integrations_8c2_dark.png');
  await page.screenshot({ path: multiRouteDarkPath });
  console.log(`[E2E] Captured: ${multiRouteDarkPath}`);

  // Test Light Route Chain
  await setTheme('light');
  console.log('[E2E] Starting multi-route hop in LIGHT mode...');
  await page.goto('http://localhost:3000/settings/integrations');
  const hubThemeLight = await getTheme();
  if (hubThemeLight !== 'light') throw new Error('Theme did not persist at /settings/integrations');

  await page.goto('http://localhost:3000/settings/integrations/email');
  const emailThemeLight = await getTheme();
  if (emailThemeLight !== 'light') throw new Error('Theme did not persist at /settings/integrations/email');

  await page.goto('http://localhost:3000/settings/integrations/upwork');
  const upworkThemeLight = await getTheme();
  if (upworkThemeLight !== 'light') throw new Error('Theme did not persist at /settings/integrations/upwork');

  await page.goto('http://localhost:3000/dashboard');
  const dashThemeLight = await getTheme();
  if (dashThemeLight !== 'light') throw new Error('Theme did not persist at /dashboard');

  const multiRouteLightPath = path.join(ARTIFACT_DIR, 'multi_route_integrations_8c2_light.png');
  await page.screenshot({ path: multiRouteLightPath });
  console.log(`[E2E] Captured: ${multiRouteLightPath}`);

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
  console.log('\n=== SUB-BATCH 8C2 BROWSER VERIFICATION COMPLETE: ALL CHECKS PASSED ===');
}

verifySettingsIntegrations8C2().catch((err) => {
  console.error('E2E Verification Failed:', err);
  process.exit(1);
});
