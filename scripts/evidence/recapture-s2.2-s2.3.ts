import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import { query, queryOne } from '@/lib/db';
import { generateToken, hashToken } from '@/lib/security/invite-token';

async function main() {
  const s22Dir = path.join(process.cwd(), 'assets', 'screenshots', 'S2.2-Invite-Expiry-Message');
  const s23Dir = path.join(process.cwd(), 'assets', 'screenshots', 'S2.3-Resend-Invalidates-Old-Link');

  const owner = await queryOne<{ id: string; org_id: string }>(
    `SELECT u.id, om.organization_id as org_id
     FROM users u 
     JOIN organization_members om ON om.user_id = u.id 
     WHERE om.role = 'owner' 
     LIMIT 1`
  );
  if (!owner) throw new Error('No owner found in database');

  // S2.2 expired token
  const expiredRawToken = generateToken();
  const expiredTokenHash = hashToken(expiredRawToken);
  const testEmailS22 = `expired_test_${Date.now()}@example.com`;

  const expiredInsert = await query(
    `INSERT INTO invitations (
      organization_id, email, role, token_hash, status, expires_at, invited_by, created_at, updated_at
    ) VALUES (
      $1, $2, 'member', $3, 'pending', NOW() - INTERVAL '2 hours', $4, NOW() - INTERVAL '8 days', NOW()
    ) RETURNING id`,
    [owner.org_id, testEmailS22, expiredTokenHash, owner.id]
  );
  const expiredId = expiredInsert.rows[0].id;

  // S2.3 invalid old token
  const invalidOldRawToken = generateToken();

  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({
      viewport: { width: 1280, height: 800 },
    });

    // --- S2.2 EXPIRED ---
    console.log('[S2.2] Navigating to expired token...');
    await page.goto(`http://localhost:3000/invite/${expiredRawToken}`, { waitUntil: 'networkidle' });
    await page.locator('text=This Invitation Has Expired').waitFor({ state: 'visible', timeout: 5000 });

    // 1. Light mode
    const lightBtn = page.locator('button[aria-label="Light theme"]');
    await lightBtn.click();
    await page.waitForTimeout(300);
    const isDark1 = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    console.log(`[S2.2 Light] classList contains dark? ${isDark1}`);
    if (isDark1) throw new Error('Expected light mode not to contain dark');
    const s22LightPath = path.join(s22Dir, '01-expired-light.png');
    await page.screenshot({ path: s22LightPath, fullPage: false });
    console.log(`[S2.2 Light] Captured: ${s22LightPath}`);

    // 2. Dark mode via ThemeToggle
    const darkBtn = page.locator('button[aria-label="Dark theme"]');
    await darkBtn.click();
    await page.waitForTimeout(300);
    const isDark2 = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    console.log(`[S2.2 Dark] classList contains dark? ${isDark2}`);
    if (!isDark2) throw new Error('Expected dark mode to contain dark');
    const s22DarkPath = path.join(s22Dir, '01-expired-dark.png');
    await page.screenshot({ path: s22DarkPath, fullPage: false });
    console.log(`[S2.2 Dark] Captured: ${s22DarkPath}`);

    // --- S2.3 INVALID TOKEN ---
    console.log('[S2.3] Navigating to invalid token...');
    await page.goto(`http://localhost:3000/invite/${invalidOldRawToken}`, { waitUntil: 'networkidle' });
    await page.locator('text=Invitation Unavailable').waitFor({ state: 'visible', timeout: 5000 });

    // 1. Light mode
    const lightBtn2 = page.locator('button[aria-label="Light theme"]');
    await lightBtn2.click();
    await page.waitForTimeout(300);
    const isDark3 = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    console.log(`[S2.3 Light] classList contains dark? ${isDark3}`);
    if (isDark3) throw new Error('Expected light mode not to contain dark');
    const s23LightPath = path.join(s23Dir, '01-invalid-token-light.png');
    await page.screenshot({ path: s23LightPath, fullPage: false });
    console.log(`[S2.3 Light] Captured: ${s23LightPath}`);

    // 2. Dark mode via ThemeToggle
    const darkBtn2 = page.locator('button[aria-label="Dark theme"]');
    await darkBtn2.click();
    await page.waitForTimeout(300);
    const isDark4 = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    console.log(`[S2.3 Dark] classList contains dark? ${isDark4}`);
    if (!isDark4) throw new Error('Expected dark mode to contain dark');
    const s23DarkPath = path.join(s23Dir, '01-invalid-token-dark.png');
    await page.screenshot({ path: s23DarkPath, fullPage: false });
    console.log(`[S2.3 Dark] Captured: ${s23DarkPath}`);
  } finally {
    await browser.close();
    await query('DELETE FROM invitations WHERE id = $1', [expiredId]);
    console.log('Cleaned up test invite row.');
  }
}

main().catch((err) => {
  console.error('Capture failed:', err);
  process.exit(1);
});
