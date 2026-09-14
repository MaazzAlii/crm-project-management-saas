const { chromium } = require('playwright');
const path = require('path');

async function capture() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  await context.addCookies([
    {
      name: 'dev_super_admin',
      value: 'true',
      domain: 'localhost',
      path: '/',
    },
  ]);

  const page = await context.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });

  const artifactDir = 'C:\\Users\\maaza\\.gemini\\antigravity-ide\\brain\\befa10f8-c27e-499d-b703-3998d8a6c960';

  console.log('Navigating to Super Admin Dashboard...');
  await page.goto('http://localhost:3000/super-admin/dashboard', { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(artifactDir, 'super_admin_dashboard.png'), fullPage: true });
  console.log('Saved super_admin_dashboard.png');

  console.log('Navigating to Super Admin Organizations...');
  await page.goto('http://localhost:3000/super-admin/organizations', { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(artifactDir, 'super_admin_organizations.png'), fullPage: true });
  console.log('Saved super_admin_organizations.png');

  console.log('Navigating to Super Admin Org Detail...');
  await page.goto('http://localhost:3000/super-admin/organizations/00000000-0000-0000-0000-000000000001', { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(artifactDir, 'super_admin_org_detail.png'), fullPage: true });
  console.log('Saved super_admin_org_detail.png');

  await browser.close();
  console.log('Capture complete!');
}

capture().catch(err => {
  console.error('Error during capture:', err);
  process.exit(1);
});
