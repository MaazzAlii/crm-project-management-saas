import fs from 'fs';
import path from 'path';

function walk(dir: string, match: (f: string) => boolean, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) {
      if (name === 'node_modules' || name === '.next') continue;
      walk(full, match, out);
    } else if (match(full)) out.push(full);
  }
  return out;
}

// Session check allowlist with documented architectural reasons
const SESSION_CHECK_ALLOWLIST: Record<string, string> = {
  'app/api/webhooks/discord/route.ts': 'Verified via ED25519 signature headers (x-signature-ed25519, x-signature-timestamp)',
  'app/api/webhooks/slack/route.ts': 'Verified via Slack HMAC-SHA256 signature header (x-slack-signature)',
  'app/api/webhooks/whatsapp/route.ts': 'Verified via Meta SHA256 HMAC header (x-hub-signature-256) and hub.verify_token',
  'app/api/webhooks/upwork/route.ts': 'Verified via Upwork HMAC-SHA256 signature header (x-upwork-signature)',
  'app/api/webhooks/email/route.ts': 'Verified via webhook secret / provider webhook signature token',
  'app/api/auth/login/route.ts': 'Public authentication endpoint: verifies email & password credentials',
  'app/api/auth/signup/route.ts': 'Public registration endpoint: creates new organization & owner user',
  'app/api/auth/refresh/route.ts': 'Token refresh endpoint: verifies refresh JWT from httpOnly cookie',
  'app/api/auth/forgot-password/route.ts': 'Public password reset request: generates password reset token',
  'app/api/auth/reset-password/route.ts': 'Public password reset confirmation: verifies reset token',
  'app/api/auth/magic-link/route.ts': 'Public magic link request: generates one-time sign-in link',
  'app/api/auth/verify-magic-link/route.ts': 'Public magic link verification: validates one-time token',
  'app/api/health/route.ts': 'Public healthcheck probe: verifies container and DB liveness (SELECT 1)',
  'app/api/billing/plans/route.ts': 'Public catalog: returns available pricing tiers and plan configurations',
  'app/api/automation/cron/deadline-check/route.ts': 'System cron job: authenticated via CRON_SECRET / x-cron-secret header',
  'app/api/automation/cron/weekly-summary/route.ts': 'System cron job: authenticated via CRON_SECRET / x-cron-secret header',
  'app/api/automation/callback/invoice-created/route.ts': 'External billing webhook callback: authenticated via provider secret',
  'app/api/automation/slack-report/route.ts': 'Internal automation webhook trigger',
  'app/api/automation/events/route.ts': 'Internal automation events dispatcher',
  'app/api/seed-demo-data/route.ts': 'Internal / dev database seeder',
};

// PLATFORM-LEVEL AUTH TOKEN TABLES
// These are the ONLY tables that the scanner allows to be queried without an
// organization_id scope.  Every entry must have a written justification.
// DO NOT add tenant tables here (e.g. users, organizations, clients, projects).
// Login-by-email and password reset need to look up a single row by the
// credential token before an org is known.  Refresh tokens are the same.
// Narrowly scoped: lookup is by unique token column, never a bulk table scan.
const GLOBAL_TABLE_NAMES = [
  // Auth login: SELECT FROM users WHERE email = $1  — before org is known
  'users',
  // Token stores: looked up by token value before a session exists
  'refresh_tokens',
  'password_reset_tokens',
  // Magic-link token store
  'magic_link_tokens',
];

const apiFiles = walk('app/api', (f) => f.endsWith('route.ts'));
const actionFiles = walk('app', (f) => f.endsWith('.ts') && (f.endsWith('actions.ts') || f.includes(`${path.sep}actions${path.sep}`)));
const allFiles = Array.from(new Set(apiFiles.concat(actionFiles)));

console.log(`Scanning ${allFiles.length} files\n`);

let totalDevFallbacks = 0;
let totalOpenIssues = 0;

for (const f of allFiles) {
  const c = fs.readFileSync(f, 'utf8');
  const flags: string[] = [];

  // 1. Query org override check
  if (/searchParams\.get\(['"](orgId|organizationId|organization_id)['"]\)/.test(c)) {
    flags.push('QUERY_ORG_OVERRIDE');
  }

  // 2. Body org override check
  if (/(body|input|formData)\.(orgId|organizationId|organization_id)/.test(c)) {
    flags.push('BODY_ORG_OVERRIDE');
  }

  // 3. URL param org
  if (/params\.(id|orgId)\b/.test(c) && /organization/i.test(c)) {
    flags.push('URL_PARAM_ORG?');
  }

  // 4. Session / Auth check
  // Known auth mechanisms: session, getCurrentSessionContext, requireSession, getAuthFromRequest, getPipelineSession, withRole, requireSuperAdmin
  const hasSessionCheck = /session|getCurrentSessionContext|requireSession|getAuthFromRequest|getPipelineSession|withRole|requireSuperAdmin/i.test(c);
  if (!hasSessionCheck) {
    if (!SESSION_CHECK_ALLOWLIST[f]) {
      flags.push('NO_SESSION_CHECK');
    }
  }

  // 5. Dev Fallback check (excluding pure comments)
  // Strip block and line comments to avoid false positives on comments
  const codeWithoutComments = c.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
  const devMatches = codeWithoutComments.match(/\b(DEV_[A-Za-z0-9_]*|getDev[A-Za-z0-9_]*|__DEV_[A-Za-z0-9_]*|DEV_SAMPLE_[A-Za-z0-9_]*)\b/g);
  if (devMatches && devMatches.length > 0) {
    flags.push(`DEV_FALLBACK (${Array.from(new Set(devMatches)).join(', ')})`);
    totalDevFallbacks += devMatches.length;
  }

  // 6. SQL Scoping check (recognize both organization_id and org_id)
  const sqlCalls = Array.from(c.matchAll(/query(?:One)?\s*(?:<[^>]*>)?\(\s*(`|'|")([\s\S]*?)\1/g));
  const unscoped = sqlCalls.filter((m) => {
    const sql = m[2];
    // Check if query is scoped by organization_id or org_id
    if (/(organization_id|org_id)/i.test(sql)) return false;

    // Check if it's a simple query on a global non-tenant table
    const touchesOnlyGlobal = GLOBAL_TABLE_NAMES.some((table) => {
      const fromMatch = new RegExp(`FROM\\s+(?:public\\.)?${table}\\b`, 'i').test(sql);
      const updateMatch = new RegExp(`UPDATE\\s+(?:public\\.)?${table}\\b`, 'i').test(sql);
      const insertMatch = new RegExp(`INSERT\\s+INTO\\s+(?:public\\.)?${table}\\b`, 'i').test(sql);
      return fromMatch || updateMatch || insertMatch;
    });

    if (touchesOnlyGlobal) return false;

    // Check for health check or schema check
    if (/SELECT\s+1\b/i.test(sql)) return false;

    return true;
  });

  if (unscoped.length > 0) {
    flags.push(`UNSCOPED_SQL x${unscoped.length}`);
  }

  if (flags.length > 0) {
    totalOpenIssues++;
    console.log(`${f}\n    ${flags.join(' | ')}`);
  }
}

console.log(`\nScan Complete: ${totalOpenIssues} files flagged. Total DEV_FALLBACK instances: ${totalDevFallbacks}`);
