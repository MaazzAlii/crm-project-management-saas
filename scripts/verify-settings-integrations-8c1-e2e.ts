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

async function verifySettingsIntegrations8C1() {
  console.log('=== STARTING SUB-BATCH 8C1 SETTINGS INTEGRATIONS E2E VERIFICATION ===');

  const ts = Date.now();
  const ownerEmail = `integrations_owner_${ts}@example.com`;
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
    name: 'Innoventix Integrations Corp ' + ts,
    slug: 'innoventix-integ-' + ts,
    ownerUserId: owner.id,
  });

  // Seed active Discord and WhatsApp channels to test Connected state
  await query(
    `INSERT INTO communication_channels (organization_id, provider, external_account_id, channel_name, status, connected_at, metadata)
     VALUES
     ($1, 'discord', '123456789012345678', '#client-announcements', 'active', NOW(), '{"bot_token": "mock_encrypted_token"}'::jsonb),
     ($1, 'whatsapp', '+15550192831', 'Global Support WhatsApp', 'active', NOW(), '{"account_sid": "mock_sid", "auth_token": "mock_token"}'::jsonb)`,
    [org.id]
  );

  console.log(`[E2E] Provisioned owner ${owner.email} with workspace ${org.slug} and channels`);

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
  // VIEW 1: /settings/integrations/slack (Not Connected State)
  // ══════════════════════════════════════════════════════════════
  console.log('\n--- VERIFYING /settings/integrations/slack ---');
  await page.goto('http://localhost:3000/settings/integrations/slack');
  await page.waitForSelector('text=Slack Workspace Integration', { timeout: 10000 });

  // 1.1 Slack - Light
  await setTheme('light');
  const slackLightPath = path.join(ARTIFACT_DIR, 'settings_integrations_slack_light.png');
  await page.screenshot({ path: slackLightPath, fullPage: true });
  console.log(`[E2E] Captured: ${slackLightPath}`);

  const slackLightMetrics = await page.evaluate(() => {
    const cardTitle = document.querySelector('h1');
    const badge = document.querySelector('span.rounded-full');
    const input = document.querySelector('input[name="channel_name"]');
    const saveBtn = document.querySelector('button[type="submit"]');
    const webhookInput = document.querySelector('input[readonly]');

    return {
      cardTitleColor: cardTitle ? getComputedStyle(cardTitle).color : 'N/A',
      badgeBg: badge ? getComputedStyle(badge).backgroundColor : 'N/A',
      badgeColor: badge ? getComputedStyle(badge).color : 'N/A',
      inputBg: input ? getComputedStyle(input).backgroundColor : 'N/A',
      inputColor: input ? getComputedStyle(input).color : 'N/A',
      saveBtnBg: saveBtn ? getComputedStyle(saveBtn).backgroundColor : 'N/A',
      saveBtnColor: saveBtn ? getComputedStyle(saveBtn).color : 'N/A',
      webhookInputBg: webhookInput ? getComputedStyle(webhookInput).backgroundColor : 'N/A',
    };
  });

  colorEntries.push({
    view: '/settings/integrations/slack',
    theme: 'Light',
    element: 'Header Title',
    backgroundColor: 'transparent',
    textColor: slackLightMetrics.cardTitleColor,
  });
  colorEntries.push({
    view: '/settings/integrations/slack',
    theme: 'Light',
    element: 'Status Badge (Not Connected)',
    backgroundColor: slackLightMetrics.badgeBg,
    textColor: slackLightMetrics.badgeColor,
  });
  colorEntries.push({
    view: '/settings/integrations/slack',
    theme: 'Light',
    element: 'Form Input (Channel Name)',
    backgroundColor: slackLightMetrics.inputBg,
    textColor: slackLightMetrics.inputColor,
  });
  colorEntries.push({
    view: '/settings/integrations/slack',
    theme: 'Light',
    element: 'Save Action Button',
    backgroundColor: slackLightMetrics.saveBtnBg,
    textColor: slackLightMetrics.saveBtnColor,
  });

  // 1.2 Slack - Dark
  await setTheme('dark');
  const slackDarkPath = path.join(ARTIFACT_DIR, 'settings_integrations_slack_dark.png');
  await page.screenshot({ path: slackDarkPath, fullPage: true });
  console.log(`[E2E] Captured: ${slackDarkPath}`);

  const slackDarkMetrics = await page.evaluate(() => {
    const cardTitle = document.querySelector('h1');
    const badge = document.querySelector('span.rounded-full');
    const input = document.querySelector('input[name="channel_name"]');
    const saveBtn = document.querySelector('button[type="submit"]');
    const webhookInput = document.querySelector('input[readonly]');

    return {
      cardTitleColor: cardTitle ? getComputedStyle(cardTitle).color : 'N/A',
      badgeBg: badge ? getComputedStyle(badge).backgroundColor : 'N/A',
      badgeColor: badge ? getComputedStyle(badge).color : 'N/A',
      inputBg: input ? getComputedStyle(input).backgroundColor : 'N/A',
      inputColor: input ? getComputedStyle(input).color : 'N/A',
      saveBtnBg: saveBtn ? getComputedStyle(saveBtn).backgroundColor : 'N/A',
      saveBtnColor: saveBtn ? getComputedStyle(saveBtn).color : 'N/A',
      webhookInputBg: webhookInput ? getComputedStyle(webhookInput).backgroundColor : 'N/A',
    };
  });

  colorEntries.push({
    view: '/settings/integrations/slack',
    theme: 'Dark',
    element: 'Header Title',
    backgroundColor: 'transparent',
    textColor: slackDarkMetrics.cardTitleColor,
  });
  colorEntries.push({
    view: '/settings/integrations/slack',
    theme: 'Dark',
    element: 'Status Badge (Not Connected)',
    backgroundColor: slackDarkMetrics.badgeBg,
    textColor: slackDarkMetrics.badgeColor,
  });
  colorEntries.push({
    view: '/settings/integrations/slack',
    theme: 'Dark',
    element: 'Form Input (Channel Name)',
    backgroundColor: slackDarkMetrics.inputBg,
    textColor: slackDarkMetrics.inputColor,
  });
  colorEntries.push({
    view: '/settings/integrations/slack',
    theme: 'Dark',
    element: 'Save Action Button',
    backgroundColor: slackDarkMetrics.saveBtnBg,
    textColor: slackDarkMetrics.saveBtnColor,
  });

  console.log(`[E2E] Slack Dark Mode Input Background: ${slackDarkMetrics.inputBg}`);
  if (slackDarkMetrics.inputBg === 'rgb(255, 255, 255)') {
    throw new Error('CRITICAL FAILURE: Slack input background is white in dark mode!');
  }

  // ══════════════════════════════════════════════════════════════
  // VIEW 2: /settings/integrations/discord (Connected State)
  // ══════════════════════════════════════════════════════════════
  console.log('\n--- VERIFYING /settings/integrations/discord ---');
  await page.goto('http://localhost:3000/settings/integrations/discord');
  await page.waitForSelector('text=Discord Community Integration', { timeout: 10000 });

  // 2.1 Discord - Light
  await setTheme('light');
  const discordLightPath = path.join(ARTIFACT_DIR, 'settings_integrations_discord_light.png');
  await page.screenshot({ path: discordLightPath, fullPage: true });
  console.log(`[E2E] Captured: ${discordLightPath}`);

  const discordLightMetrics = await page.evaluate(() => {
    const cardTitle = document.querySelector('h1');
    const badge = document.querySelector('span.rounded-full');
    const input = document.querySelector('input[name="channel_name"]');
    const testBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Send Test Signal'));

    return {
      cardTitleColor: cardTitle ? getComputedStyle(cardTitle).color : 'N/A',
      badgeBg: badge ? getComputedStyle(badge).backgroundColor : 'N/A',
      badgeColor: badge ? getComputedStyle(badge).color : 'N/A',
      inputBg: input ? getComputedStyle(input).backgroundColor : 'N/A',
      inputColor: input ? getComputedStyle(input).color : 'N/A',
      testBtnBg: testBtn ? getComputedStyle(testBtn).backgroundColor : 'N/A',
      testBtnColor: testBtn ? getComputedStyle(testBtn).color : 'N/A',
    };
  });

  colorEntries.push({
    view: '/settings/integrations/discord',
    theme: 'Light',
    element: 'Status Badge (Connected)',
    backgroundColor: discordLightMetrics.badgeBg,
    textColor: discordLightMetrics.badgeColor,
  });
  colorEntries.push({
    view: '/settings/integrations/discord',
    theme: 'Light',
    element: 'Form Input (Discord Channel ID)',
    backgroundColor: discordLightMetrics.inputBg,
    textColor: discordLightMetrics.inputColor,
  });
  colorEntries.push({
    view: '/settings/integrations/discord',
    theme: 'Light',
    element: 'Test Signal Button',
    backgroundColor: discordLightMetrics.testBtnBg,
    textColor: discordLightMetrics.testBtnColor,
  });

  // 2.2 Discord - Dark
  await setTheme('dark');
  const discordDarkPath = path.join(ARTIFACT_DIR, 'settings_integrations_discord_dark.png');
  await page.screenshot({ path: discordDarkPath, fullPage: true });
  console.log(`[E2E] Captured: ${discordDarkPath}`);

  const discordDarkMetrics = await page.evaluate(() => {
    const badge = document.querySelector('span.rounded-full');
    const input = document.querySelector('input[name="channel_name"]');
    const testBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Send Test Signal'));

    return {
      badgeBg: badge ? getComputedStyle(badge).backgroundColor : 'N/A',
      badgeColor: badge ? getComputedStyle(badge).color : 'N/A',
      inputBg: input ? getComputedStyle(input).backgroundColor : 'N/A',
      inputColor: input ? getComputedStyle(input).color : 'N/A',
      testBtnBg: testBtn ? getComputedStyle(testBtn).backgroundColor : 'N/A',
      testBtnColor: testBtn ? getComputedStyle(testBtn).color : 'N/A',
    };
  });

  colorEntries.push({
    view: '/settings/integrations/discord',
    theme: 'Dark',
    element: 'Status Badge (Connected)',
    backgroundColor: discordDarkMetrics.badgeBg,
    textColor: discordDarkMetrics.badgeColor,
  });
  colorEntries.push({
    view: '/settings/integrations/discord',
    theme: 'Dark',
    element: 'Form Input (Discord Channel ID)',
    backgroundColor: discordDarkMetrics.inputBg,
    textColor: discordDarkMetrics.inputColor,
  });
  colorEntries.push({
    view: '/settings/integrations/discord',
    theme: 'Dark',
    element: 'Test Signal Button',
    backgroundColor: discordDarkMetrics.testBtnBg,
    textColor: discordDarkMetrics.testBtnColor,
  });

  console.log(`[E2E] Discord Dark Mode Input Background: ${discordDarkMetrics.inputBg}`);
  if (discordDarkMetrics.inputBg === 'rgb(255, 255, 255)') {
    throw new Error('CRITICAL FAILURE: Discord input background is white in dark mode!');
  }

  // ══════════════════════════════════════════════════════════════
  // VIEW 3: /settings/integrations/whatsapp (Connected State)
  // ══════════════════════════════════════════════════════════════
  console.log('\n--- VERIFYING /settings/integrations/whatsapp ---');
  await page.goto('http://localhost:3000/settings/integrations/whatsapp');
  await page.waitForSelector('text=WhatsApp Business API Integration', { timeout: 10000 });

  // 3.1 WhatsApp - Light
  await setTheme('light');
  const whatsappLightPath = path.join(ARTIFACT_DIR, 'settings_integrations_whatsapp_light.png');
  await page.screenshot({ path: whatsappLightPath, fullPage: true });
  console.log(`[E2E] Captured: ${whatsappLightPath}`);

  const whatsappLightMetrics = await page.evaluate(() => {
    const input = document.querySelector('input[name="external_account_id"]');
    const testInput = document.querySelector('input[placeholder*="Test recipient"]');
    const disconnectBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Disconnect'));

    return {
      inputBg: input ? getComputedStyle(input).backgroundColor : 'N/A',
      inputColor: input ? getComputedStyle(input).color : 'N/A',
      testInputBg: testInput ? getComputedStyle(testInput).backgroundColor : 'N/A',
      disconnectBg: disconnectBtn ? getComputedStyle(disconnectBtn).backgroundColor : 'N/A',
      disconnectColor: disconnectBtn ? getComputedStyle(disconnectBtn).color : 'N/A',
    };
  });

  colorEntries.push({
    view: '/settings/integrations/whatsapp',
    theme: 'Light',
    element: 'Phone Input',
    backgroundColor: whatsappLightMetrics.inputBg,
    textColor: whatsappLightMetrics.inputColor,
  });
  colorEntries.push({
    view: '/settings/integrations/whatsapp',
    theme: 'Light',
    element: 'Disconnect Action Button',
    backgroundColor: whatsappLightMetrics.disconnectBg,
    textColor: whatsappLightMetrics.disconnectColor,
  });

  // 3.2 WhatsApp - Dark
  await setTheme('dark');
  const whatsappDarkPath = path.join(ARTIFACT_DIR, 'settings_integrations_whatsapp_dark.png');
  await page.screenshot({ path: whatsappDarkPath, fullPage: true });
  console.log(`[E2E] Captured: ${whatsappDarkPath}`);

  const whatsappDarkMetrics = await page.evaluate(() => {
    const input = document.querySelector('input[name="external_account_id"]');
    const testInput = document.querySelector('input[placeholder*="Test recipient"]');
    const disconnectBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Disconnect'));

    return {
      inputBg: input ? getComputedStyle(input).backgroundColor : 'N/A',
      inputColor: input ? getComputedStyle(input).color : 'N/A',
      testInputBg: testInput ? getComputedStyle(testInput).backgroundColor : 'N/A',
      disconnectBg: disconnectBtn ? getComputedStyle(disconnectBtn).backgroundColor : 'N/A',
      disconnectColor: disconnectBtn ? getComputedStyle(disconnectBtn).color : 'N/A',
    };
  });

  colorEntries.push({
    view: '/settings/integrations/whatsapp',
    theme: 'Dark',
    element: 'Phone Input',
    backgroundColor: whatsappDarkMetrics.inputBg,
    textColor: whatsappDarkMetrics.inputColor,
  });
  colorEntries.push({
    view: '/settings/integrations/whatsapp',
    theme: 'Dark',
    element: 'Disconnect Action Button',
    backgroundColor: whatsappDarkMetrics.disconnectBg,
    textColor: whatsappDarkMetrics.disconnectColor,
  });

  console.log(`[E2E] WhatsApp Dark Mode Input Background: ${whatsappDarkMetrics.inputBg}`);
  if (whatsappDarkMetrics.inputBg === 'rgb(255, 255, 255)') {
    throw new Error('CRITICAL FAILURE: WhatsApp input background is white in dark mode!');
  }

  // ══════════════════════════════════════════════════════════════
  // VIEW 4: Multi-Route Navigation & Theme Persistence
  // /settings/integrations/slack → /settings/integrations/discord → /settings/integrations/whatsapp → /dashboard
  // ══════════════════════════════════════════════════════════════
  console.log('\n--- VERIFYING Multi-Route Theme Persistence ---');

  // Test Dark Route Chain
  await setTheme('dark');
  console.log('[E2E] Starting multi-route hop in DARK mode...');
  await page.goto('http://localhost:3000/settings/integrations/slack');
  const slackThemeDark = await getTheme();
  if (slackThemeDark !== 'dark') throw new Error('Theme did not persist at /settings/integrations/slack');

  await page.goto('http://localhost:3000/settings/integrations/discord');
  const discordThemeDark = await getTheme();
  if (discordThemeDark !== 'dark') throw new Error('Theme did not persist at /settings/integrations/discord');

  await page.goto('http://localhost:3000/settings/integrations/whatsapp');
  const waThemeDark = await getTheme();
  if (waThemeDark !== 'dark') throw new Error('Theme did not persist at /settings/integrations/whatsapp');

  await page.goto('http://localhost:3000/dashboard');
  const dashThemeDark = await getTheme();
  if (dashThemeDark !== 'dark') throw new Error('Theme did not persist at /dashboard');

  const multiRouteDarkPath = path.join(ARTIFACT_DIR, 'multi_route_integrations_8c1_dark.png');
  await page.screenshot({ path: multiRouteDarkPath });
  console.log(`[E2E] Captured: ${multiRouteDarkPath}`);

  // Test Light Route Chain
  await setTheme('light');
  console.log('[E2E] Starting multi-route hop in LIGHT mode...');
  await page.goto('http://localhost:3000/settings/integrations/slack');
  const slackThemeLight = await getTheme();
  if (slackThemeLight !== 'light') throw new Error('Theme did not persist at /settings/integrations/slack');

  await page.goto('http://localhost:3000/settings/integrations/discord');
  const discordThemeLight = await getTheme();
  if (discordThemeLight !== 'light') throw new Error('Theme did not persist at /settings/integrations/discord');

  await page.goto('http://localhost:3000/settings/integrations/whatsapp');
  const waThemeLight = await getTheme();
  if (waThemeLight !== 'light') throw new Error('Theme did not persist at /settings/integrations/whatsapp');

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
  console.log('\n=== SUB-BATCH 8C1 BROWSER VERIFICATION COMPLETE: ALL CHECKS PASSED ===');
}

verifySettingsIntegrations8C1().catch((err) => {
  console.error('E2E Verification Failed:', err);
  process.exit(1);
});
