/**
 * =============================================================================
 * Innoventix Platform — Print Latest Pending Invitation Script
 * =============================================================================
 * 
 * Usage:
 *   npx tsx scripts/print-latest-invite.ts <email>
 * 
 * Inspects local database for the newest pending invitation for the given email.
 * Note: Never commits real emails.
 * =============================================================================
 */

import { query } from '../lib/db';
import { getEmailConfig } from '../lib/email/config';

async function main() {
  const targetEmail = process.argv[2];

  if (!targetEmail || !targetEmail.trim()) {
    console.log('\n❌ Usage: npx tsx scripts/print-latest-invite.ts <email>');
    console.log('Example: npx tsx scripts/print-latest-invite.ts test.user@example.com\n');
    process.exit(1);
  }

  const normalized = targetEmail.trim().toLowerCase();
  console.log(`\n🔍 Looking up latest pending invite for: ${normalized}...`);

  try {
    const res = await query<any>(
      `SELECT 
         i.id,
         i.organization_id,
         i.email,
         i.role,
         i.status,
         i.token_hash,
         i.expires_at,
         i.created_at,
         o.name AS organization_name,
         o.slug AS organization_slug
       FROM invitations i
       LEFT JOIN organizations o ON o.id = i.organization_id
       WHERE LOWER(i.email) = $1 AND i.status = 'pending'
       ORDER BY i.created_at DESC
       LIMIT 1`,
      [normalized]
    );

    if (res.rows.length === 0) {
      console.log(`\n⚠️  No pending invitations found for email "${normalized}".`);
      process.exit(0);
    }

    const invite = res.rows[0];
    const config = getEmailConfig();
    const appUrl = config.appPublicUrl;

    console.log('\n=================== LATEST PENDING INVITATION ===================');
    console.log(`ID:              ${invite.id}`);
    console.log(`Organization:    ${invite.organization_name || 'N/A'} (${invite.organization_id})`);
    console.log(`Invitee Email:   ${invite.email}`);
    console.log(`Role:            ${invite.role}`);
    console.log(`Status:          ${invite.status}`);
    console.log(`Created At:      ${new Date(invite.created_at).toISOString()}`);
    console.log(`Expires At:      ${new Date(invite.expires_at).toISOString()}`);
    console.log(`Token Hash:      ${invite.token_hash.substring(0, 16)}... (SHA-256 hashed)`);
    console.log('-----------------------------------------------------------------');
    console.log(`Accept Endpoint: ${appUrl}/invite/<token>`);
    console.log('\nℹ️  Security Notice: Raw tokens are ephemeral and never stored in');
    console.log('   the database. In development (EMAIL_PROVIDER=console), the raw');
    console.log('   redemption link is displayed in the server terminal output.\n');
  } catch (err: any) {
    console.error('\n❌ Database query failed:', err.message);
    process.exit(1);
  }
}

main().then(() => process.exit(0));
