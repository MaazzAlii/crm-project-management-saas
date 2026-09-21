# TASK 67 — Production Environment & Secrets Deployment Checklist

## Overview
This document specifies the exact procedure for provisioning, configuring, and verifying environment variables and secrets on the **Contabo Cloud VPS** for the self-hosted **Innoventix Platform v2**.

All secrets are managed directly on the VPS filesystem with strict permissions (`chmod 600`) and are **NEVER committed to Git**.

---

## 1. Filesystem Layout on Contabo VPS

The production environment on the Contabo VPS is structured into two isolated directory trees:

```text
/opt/innoventix/
├── supabase/                     # Self-Hosted Supabase Stack (Docker Compose)
│   ├── docker-compose.supabase.yml
│   └── .env.supabase             # chmod 600 (Postgres, JWT, API Gateway keys)
│
└── app/                          # Next.js Application Stack
    ├── docker-compose.app.yml
    └── .env.production           # chmod 600 (App URLs, Stripe, AI, Encryption keys)
```

---

## 2. Secrets Generation & Cryptography Standards

Before deploying to the VPS, run the automated cryptographic generator locally or directly on the VPS:

```bash
npx tsx scripts/generate-production-secrets.ts
```

This generates:
1. **`POSTGRES_PASSWORD`**: 32-character cryptographically secure alphanumeric string.
2. **`JWT_SECRET`**: 64-character random hexadecimal string (32 bytes entropy).
3. **`ANON_KEY` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`**: HS256 JWT signed with `JWT_SECRET` for the `anon` role (10-year validity).
4. **`SERVICE_ROLE_KEY` / `SUPABASE_SERVICE_ROLE_KEY`**: HS256 JWT signed with `JWT_SECRET` for the `service_role` role (10-year validity).
5. **`ENCRYPTION_SECRET`**: 64-character random hexadecimal string (32 bytes) used by `lib/security/encrypt.ts` for AES-256-GCM encryption of integration tokens at rest.
6. **`CRON_SECRET`**: 64-character random hexadecimal string for bearer token authentication of automated cron endpoints (`/api/automation/cron/*`).
7. **`N8N_WEBHOOK_SECRET`**: 64-character random hexadecimal string for HMAC verification of n8n automation triggers.

---

## 3. Required Environment Variables Matrix

### A. Supabase Stack (`/opt/innoventix/supabase/.env.supabase`)

| Variable | Description | Source / Generation |
| :--- | :--- | :--- |
| `POSTGRES_PASSWORD` | Master password for PostgreSQL database | `generate-production-secrets.ts` |
| `JWT_SECRET` | Secret key used to sign and verify Supabase Auth JWTs | `generate-production-secrets.ts` |
| `ANON_KEY` | Public anonymous access token with RLS enforcement | `generate-production-secrets.ts` |
| `SERVICE_ROLE_KEY` | Elevated service role key (bypasses RLS) | `generate-production-secrets.ts` |
| `SITE_URL` | Canonical application URL | `https://app.innoventixhub.com` |
| `API_EXTERNAL_URL` | External URL for GoTrue authentication endpoint | `https://api.innoventixhub.com/auth/v1` |

### B. Application Container (`/opt/innoventix/app/.env.production`)

| Variable | Description | Required? | Source / Format |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | Must be strictly set to `production` | **YES** | `production` |
| `NEXT_PUBLIC_APP_URL` | Canonical app URL | **YES** | `https://app.innoventixhub.com` |
| `NEXT_PUBLIC_SUPABASE_URL` | Kong API Gateway URL | **YES** | `https://api.innoventixhub.com` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key (matches `.env.supabase`) | **YES** | `generate-production-secrets.ts` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (matches `.env.supabase`) | **YES** | `generate-production-secrets.ts` |
| `ENCRYPTION_SECRET` | 32-byte key for AES-256-GCM | **YES** | `generate-production-secrets.ts` |
| `CRON_SECRET` | Bearer auth for cron jobs | **YES** | `generate-production-secrets.ts` |
| `STRIPE_SECRET_KEY` | Stripe Live Secret Key | **YES** | Stripe Dashboard (`sk_live_...`) |
| `STRIPE_WEBHOOK_SECRET` | Stripe Live Webhook Signing Secret | **YES** | Stripe Dashboard (`whsec_...`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Live Publishable Key | **YES** | Stripe Dashboard (`pk_live_...`) |
| `AI_PROVIDER` | Active AI provider (`openai` / `gemini` / `anthropic`) | **YES** | `openai` |
| `AI_API_KEY` | Production API key for AI features | **YES** | Provider Dashboard (`sk-proj-...`) |
| `N8N_WEBHOOK_URL` | URL of n8n automation engine | **YES** | `https://maaz.n8n.calara.agency/webhook/events` |
| `N8N_WEBHOOK_SECRET` | Shared secret for n8n webhooks | **YES** | `generate-production-secrets.ts` |
| `SLACK_SIGNING_SECRET` | Slack app signing secret | Optional | Slack API Dashboard |
| `SLACK_BOT_TOKEN` | Slack bot OAuth token | Optional | Slack API Dashboard (`xoxb-...`) |
| `WHATSAPP_VERIFY_TOKEN` | Meta/Twilio webhook verify token | Optional | Custom secure token |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID | Optional | Twilio Console (`AC...`) |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token | Optional | Twilio Console |
| `SENDGRID_API_KEY` | SendGrid API Key for transactional email | Optional | SendGrid Console (`SG...`) |

---

## 4. Safe Provisioning Procedure on Contabo VPS

### Step 1: Create Secure Directories
```bash
ssh deploy@<CONTABO_VPS_IP>
sudo mkdir -p /opt/innoventix/supabase /opt/innoventix/app
sudo chown -R deploy:deploy /opt/innoventix
```

### Step 2: Provision `.env.supabase`
```bash
cat << 'EOF' > /opt/innoventix/supabase/.env.supabase
POSTGRES_PASSWORD=<GENERATED_POSTGRES_PASSWORD>
JWT_SECRET=<GENERATED_JWT_SECRET>
ANON_KEY=<GENERATED_ANON_KEY>
SERVICE_ROLE_KEY=<GENERATED_SERVICE_ROLE_KEY>
SITE_URL=https://app.innoventixhub.com
API_EXTERNAL_URL=https://api.innoventixhub.com/auth/v1
EOF

chmod 600 /opt/innoventix/supabase/.env.supabase
```

### Step 3: Provision `.env.production`
```bash
cat << 'EOF' > /opt/innoventix/app/.env.production
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://app.innoventixhub.com
NEXT_PUBLIC_SUPABASE_URL=https://api.innoventixhub.com
NEXT_PUBLIC_SUPABASE_ANON_KEY=<GENERATED_ANON_KEY>
SUPABASE_SERVICE_ROLE_KEY=<GENERATED_SERVICE_ROLE_KEY>
ENCRYPTION_SECRET=<GENERATED_ENCRYPTION_SECRET>
CRON_SECRET=<GENERATED_CRON_SECRET>
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
AI_PROVIDER=openai
AI_API_KEY=sk-proj-...
N8N_WEBHOOK_URL=https://maaz.n8n.calara.agency/webhook/events
N8N_WEBHOOK_SECRET=<GENERATED_N8N_SECRET>
EOF

chmod 600 /opt/innoventix/app/.env.production
```

---

## 5. Pre-Flight Verification Checklist

Before launching containers on the Contabo VPS, verify each condition:

- [ ] **File Permissions**:
  - `ls -l /opt/innoventix/supabase/.env.supabase` shows `-rw-------` (`600`).
  - `ls -l /opt/innoventix/app/.env.production` shows `-rw-------` (`600`).
- [ ] **No Developer Bypasses**:
  - `grep -En "ALLOW_DEV_AUTH_BYPASS|DEV_SUPER_ADMIN" /opt/innoventix/app/.env.production` returns **empty**.
- [ ] **Environment Mode**:
  - `grep "NODE_ENV=production" /opt/innoventix/app/.env.production` returns matching line.
- [ ] **Key Matching**:
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.production` matches `ANON_KEY` in `.env.supabase`.
  - `SUPABASE_SERVICE_ROLE_KEY` in `.env.production` matches `SERVICE_ROLE_KEY` in `.env.supabase`.
- [ ] **Git Cleanliness**:
  - Verify that `git status` shows zero uncommitted or tracked secret files.
  - Run `git log -p -- .env*` to verify no secret values have ever been checked into Git.
