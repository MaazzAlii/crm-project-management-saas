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
  'app/api/auth/verify-email/confirm/route.ts': 'Public email verification confirmation: validates email verification token by hash without requiring an active session',
  'app/api/invitations/accept-info/route.ts': 'Public invite lookup: invitee checks invite metadata by token hash before authenticating or having a session',
  'app/api/invitations/decline/route.ts': 'Public invite decline: recipient declines invitation by token hash before authenticating',
  'app/api/stripe/webhook/route.ts': 'Stripe webhook: verified via stripe-signature and STRIPE_WEBHOOK_SECRET',
};

// FILE-LEVEL QUERY ALLOWLIST FOR PUBLIC AUTH & TOKEN LOOKUPS
// Global tables like 'users' MUST NOT be excluded table-wide because tenant
// pages and user endpoints could otherwise read all platform users unscoped.
// Only specific auth endpoints performing pre-session or token validation
// lookups are permitted, each with an explicit documented reason.
const AUTH_QUERY_ALLOWLIST: Record<string, { allowedTables: string[]; reason: string }> = {
  'app/api/auth/login/route.ts': {
    allowedTables: ['users', 'refresh_tokens'],
    reason: 'Public login: looks up user by email before tenant context exists (SELECT FROM users WHERE email = $1), records refresh token, and updates last_login_at',
  },
  'app/api/auth/refresh/route.ts': {
    allowedTables: ['refresh_tokens', 'users'],
    reason: 'Token refresh endpoint: validates refresh_tokens by hash before session exists, and retrieves user record to issue new access token',
  },
  'app/api/auth/session/route.ts': {
    allowedTables: ['refresh_tokens', 'users'],
    reason: 'Session validation: validates refresh token cookie and retrieves active user profile across tenant boundaries',
  },
  'app/api/auth/logout/route.ts': {
    allowedTables: ['refresh_tokens'],
    reason: 'Session logout: marks refresh token revoked by token_hash',
  },
  'app/api/auth/verify-magic-link/route.ts': {
    allowedTables: ['refresh_tokens', 'magic_link_tokens'],
    reason: 'Magic link verification: verifies one-time magic link token and records refresh token',
  },
  'lib/db/repositories/invitation-repo.ts': {
    allowedTables: ['invitations'],
    reason: 'findByTokenHash: unscoped read allowed because invitee accepts or inspects invitation token before joining or having an organization session',
  },
  'app/api/stripe/checkout/route.ts': {
    allowedTables: ['organizations'],
    reason: 'Stripe checkout: verifies organization record by authenticated session auth.orgId',
  },
  'app/api/stripe/webhook/route.ts': {
    allowedTables: ['stripe_processed_events', 'organizations', 'organization_plans'],
    reason: 'Stripe webhook processor: idempotency checks and organization subscription plan status updates',
  },
};

const apiFiles = walk('app/api', (f) => f.endsWith('route.ts'));
const actionFiles = walk('app', (f) => f.endsWith('.ts') && (f.endsWith('actions.ts') || f.includes(`${path.sep}actions${path.sep}`)));
const pageFiles = walk('app', (f) => f.endsWith('page.tsx'));
const inviteServiceFiles = [
  'lib/db/repositories/invitation-repo.ts',
  'lib/services/invitation-service.ts',
];
const allFiles = Array.from(new Set(apiFiles.concat(actionFiles).concat(pageFiles).concat(inviteServiceFiles)));

console.log(`Scanning ${allFiles.length} files\n`);

let totalDevFallbacks = 0;
let totalOpenIssues = 0;

// Token log check across all app/ and lib/ files (Prompt 55)
const appAndLibFiles = walk('app', (f) => /\.(ts|tsx)$/.test(f))
  .concat(walk('lib', (f) => /\.(ts|tsx)$/.test(f)));

let rawTokenLogViolations = 0;
for (const f of appAndLibFiles) {
  // lib/security/invite-token.ts is the sanitizer definition itself
  if (f.endsWith('lib/security/invite-token.ts')) continue;
  const c = fs.readFileSync(f, 'utf8');
  // Match console.* logging a raw token variable without redaction
  const logMatches = c.match(/console\.(log|info|warn|error|debug)\([^)]*\b(token|rawToken|inviteToken)\b[^)]*\)/gi);
  if (logMatches) {
    const dangerousLogs = logMatches.filter((m) => !/redactTokens|tokenHash|token_hash/i.test(m));
    if (dangerousLogs.length > 0) {
      console.log(`[RAW_TOKEN_LOG] ${f}\n    Found potential raw token log: ${dangerousLogs.join('; ')}`);
      rawTokenLogViolations += dangerousLogs.length;
    }
  }
}

if (rawTokenLogViolations === 0) {
  console.log('✓ Token log scan passed: zero raw token console logs detected across app/ and lib/\n');
} else {
  console.error(`✗ Token log scan failed: ${rawTokenLogViolations} raw token logs detected\n`);
  totalOpenIssues += rawTokenLogViolations;
}

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

  // 4. Session / Auth check (for API routes only)
  // Known auth mechanisms: session, getCurrentSessionContext, requireSession, getAuthFromRequest, getPipelineSession, withRole, requireSuperAdmin
  const hasSessionCheck = /session|getCurrentSessionContext|requireSession|getAuthFromRequest|getPipelineSession|withRole|requireSuperAdmin/i.test(c);
  if (!hasSessionCheck && f.startsWith('app/api')) {
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

    // Check for health check or schema check (SELECT 1)
    if (/SELECT\s+1\b/i.test(sql)) return false;

    // File-level allowlist: check if this file is explicitly allowed to query specific auth/token tables unscoped
    const allowedEntry = AUTH_QUERY_ALLOWLIST[f];
    if (allowedEntry) {
      const touchesAllowedOnly = allowedEntry.allowedTables.some((table) => {
        const fromMatch = new RegExp(`FROM\\s+(?:public\\.)?${table}\\b`, 'i').test(sql);
        const updateMatch = new RegExp(`UPDATE\\s+(?:public\\.)?${table}\\b`, 'i').test(sql);
        const insertMatch = new RegExp(`INSERT\\s+INTO\\s+(?:public\\.)?${table}\\b`, 'i').test(sql);
        return fromMatch || updateMatch || insertMatch;
      });
      if (touchesAllowedOnly) return false;
    }

    return true;
  });

  if (unscoped.length > 0) {
    flags.push(`UNSCOPED_SQL x${unscoped.length}`);
  }

  // 7. Unscoped user operations check (app/api/users/route.ts, app/api/users/[id]/route.ts)
  // Flags user endpoints that list or retrieve user data without an organization boundary
  const isUnscopedUserRoute = f === 'app/api/users/route.ts' || f === 'app/api/users/[id]/route.ts';
  const hasOrgScoping = /(organization_id|org_id|auth\.orgId|session\.organization\.id)/i.test(c);
  if (isUnscopedUserRoute && !hasOrgScoping) {
    flags.push('UNSCOPED_USERS');
  }

  if (flags.length > 0) {
    totalOpenIssues++;
    console.log(`${f}\n    ${flags.join(' | ')}`);
  }
}

console.log(`\nScan Complete: ${totalOpenIssues} files flagged. Total DEV_FALLBACK instances: ${totalDevFallbacks}`);
