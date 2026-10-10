# Coolify Environment Variable Reference

This document provides a comprehensive audit of all environment variables used by the Innoventix SaaS application, categorized for deployment on Coolify (Docker VPS / Self-Hosted).

---

## 📋 Comprehensive Variable Audit

| Variable Name | Read By (Files) | Category | Required / Optional | Default Value | Fallback Behavior if Missing |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `DATABASE_URL` | `lib/db/index.ts` | Database | **Required** in Prod | *(none)* | Attempts connection using host/port/user params; fails if unconfigured |
| `POSTGRES_URL` | `lib/db/index.ts` | Database | Optional | *(none)* | Falls back to `DATABASE_URL` or discrete DB params |
| `DB_HOST` | `lib/db/index.ts` | Database | Optional | `localhost` | Used if `DATABASE_URL` is not provided |
| `DB_PORT` | `lib/db/index.ts` | Database | Optional | `54322` | Used if `DATABASE_URL` is not provided |
| `DB_NAME` | `lib/db/index.ts` | Database | Optional | `innoventix` | Used if `DATABASE_URL` is not provided |
| `DB_USER` | `lib/db/index.ts` | Database | Optional | `postgres` | Used if `DATABASE_URL` is not provided |
| `DB_PASSWORD` | `lib/db/index.ts` | Database | Optional / Discrete | *(none)* | Throws authentication error if connecting via discrete credentials |
| `DB_POOL_MIN` | `lib/db/index.ts` | Database Tuning | Optional | `2` | Defaults to 2 connections |
| `DB_POOL_MAX` | `lib/db/index.ts` | Database Tuning | Optional | `10` | Defaults to 10 max pool connections |
| `JWT_SECRET` | `lib/auth/jwt.ts`, `lib/auth/edge-jwt.ts` | Authentication | **Required** in Prod | *(none in prod)* | Throws 500 error in production |
| `REFRESH_TOKEN_SECRET` / `REFRESH_SECRET` | `lib/auth/jwt.ts`, `lib/auth/edge-jwt.ts` | Authentication | **Required** in Prod | *(none in prod)* | Throws 500 error in production |
| `JWT_EXPIRES_IN` | `lib/auth/jwt.ts` | Authentication | Optional | `3600` (1h) | Access token duration |
| `REFRESH_TOKEN_EXPIRES_IN` | `lib/auth/jwt.ts` | Authentication | Optional | `604800` (7d) | Refresh token session duration |
| `COOKIE_NAME` | `middleware.ts`, `lib/auth/session.ts` | Session | Optional | `innoventix_session` | Default session cookie name |
| `COOKIE_DOMAIN` | `lib/auth/session.ts` | Session | Optional | `undefined` | Domain scope for cookies |
| `COOKIE_SECURE` | `lib/auth/session.ts` | Session | Optional | `true` (prod) | Whether cookie requires HTTPS (`Secure`) |
| `ENCRYPTION_SECRET` / `NEXTAUTH_SECRET` | `lib/security/encrypt.ts` | Security | **Required** in Prod | *(none in prod)* | Throws error in production when encrypting integration tokens |
| `NEXT_PUBLIC_APP_URL` | `lib/auth/session.ts`, `app/actions/stripe.ts`, Webhooks | App URL | **Required** in Prod | `http://localhost:3000` | Redirects / callbacks default to localhost |
| `ADMIN_EMAIL` / `BOOTSTRAP_ADMIN_EMAIL` | `lib/db/auto-migrate.ts` | Admin Provisioning | Optional | `admin@innoventix.io` | Seeded admin email if auto-bootstrap is enabled |
| `ADMIN_PASSWORD` / `BOOTSTRAP_ADMIN_PASSWORD` | `lib/db/auto-migrate.ts` | Admin Provisioning | Optional | *(none)* | Skips admin bootstrapping if omitted |
| `ADMIN_NAME` | `lib/db/auto-migrate.ts` | Admin Provisioning | Optional | `Platform Administrator` | Display name for bootstrap admin |
| `CRON_SECRET` | `app/api/automation/cron/*` | Background Tasks | Optional / Recommended | *(none)* | Protects automated cron trigger endpoints |
| `EMAIL_FROM` | `lib/services/email-service.ts` | Email | Optional | `notifications@innoventix.io` | Outgoing email sender header |
| `STRIPE_SECRET_KEY` | `lib/stripe/client.ts` | Billing | Optional | *(none)* | Stripe billing disabled if missing |
| `STRIPE_WEBHOOK_SECRET` | `app/api/stripe/webhook/route.ts` | Billing | Optional | *(none)* | Stripe webhook signature verification skipped if missing |
| `OPENAI_API_KEY` | `lib/ai/providers/openai.ts` | AI Integration | Optional | *(none)* | OpenAI features gracefully disabled if missing |
| `GEMINI_API_KEY` | `lib/ai/providers/gemini.ts` | AI Integration | Optional | *(none)* | Gemini features gracefully disabled if missing |
| `SLACK_BOT_TOKEN` | `lib/notifications/slack-reporter.ts` | Integrations | Optional | *(none)* | Slack posting disabled |
| `SLACK_SIGNING_SECRET` | `app/api/webhooks/slack/route.ts` | Integrations | Optional | *(none)* | Slack webhook verification disabled |
| `DISCORD_BOT_TOKEN` | `app/(dashboard)/inbox/actions.ts` | Integrations | Optional | *(none)* | Discord messaging disabled |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` | `app/api/webhooks/whatsapp/route.ts` | Integrations | Optional | *(none)* | WhatsApp messaging disabled |
| `N8N_WEBHOOK_URL` / `N8N_WEBHOOK_SECRET` | `lib/automation/emitter.ts` | Automation | Optional | *(none)* | n8n event emission skipped |

---

## 🚀 Coolify Configuration Matrix

### 1. Required, Set in Coolify Application Settings
These variables must be explicitly defined in Coolify for the production web container:
- `NEXT_PUBLIC_APP_URL` (e.g. `https://www.project-manager.calara.agency`)
- `PORT` (default `3000`)
- `NODE_ENV=production`

### 2. Required, Generated Per Environment (Secrets)
Generate strong 32+ byte random hex strings for each environment:
- `DATABASE_URL` (e.g. `postgresql://postgres:<GENERATED_DB_PASSWORD>@postgres:5432/innoventix`)
- `JWT_SECRET` (generate via `openssl rand -hex 32`)
- `REFRESH_TOKEN_SECRET` (generate via `openssl rand -hex 32`)
- `ENCRYPTION_SECRET` (generate via `openssl rand -hex 32`)

### 3. Optional Services (Set when enabling third-party integrations)
- `CRON_SECRET`
- `EMAIL_FROM`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `OPENAI_API_KEY`
- `GEMINI_API_KEY`
- `SLACK_BOT_TOKEN`
- `SLACK_SIGNING_SECRET`
- `DISCORD_BOT_TOKEN`
- `DISCORD_PUBLIC_KEY`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `WHATSAPP_VERIFY_TOKEN`
- `UPWORK_WEBHOOK_SECRET`
- `N8N_WEBHOOK_URL`
- `N8N_WEBHOOK_SECRET`

### 4. Do NOT Set in Production (Script / Dev-Only)
The following variables are strictly for local testing or CI scripts and should **never** be injected into Coolify production containers:
- `ALLOW_DEV_AUTH_BYPASS` (Must remain false/unset in production)
- `DEV_SUPER_ADMIN` (Must remain false/unset in production)
- `TEST_BASE_URL` (Local Playwright script test URL)
- `TEST_USER_EMAIL` (Local script test user)
- `TEST_USER_PASSWORD` (Local script test password)
- `LIVE_DOMAIN_URL` (Screenshot verification script target)
- `NEXT_PUBLIC_SUPABASE_URL` (Legacy test script artifact)
- `SUPABASE_SERVICE_ROLE_KEY` (Legacy test script artifact)
