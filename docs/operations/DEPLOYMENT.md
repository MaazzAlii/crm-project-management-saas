# Deployment & Operations

**Version:** 1.0  
**Last Updated:** 2026-10-13  
**Status:** Living Documentation

---

## 1. Environments & Endpoints

| Environment | Host Infrastructure | URL | Deployment Method |
| :--- | :--- | :--- | :--- |
| **Local Development** | Local Docker / Node 20 | `http://localhost:3000` | `npm run dev` / `docker-compose.local.yml` |
| **Staging** | Contabo VPS / Coolify | `http://mspxxqi8itcxqfdkkkqxzfr6.85.239.246.243.sslip.io` | Git push to `deploy` branch (Coolify webhook) |
| **Production** | Contabo VPS / Nginx | `https://innoventixhub.tech` | Production promotion via Coolify / Git release tag |

---

## 2. Environment Variables Specification

*Note: Production secrets must never be committed to git. Variables are defined in Coolify environment manager or `.env.local` for local execution.*

| Variable | Description | Required | Example / Format |
| :--- | :--- | :---: | :--- |
| `NODE_ENV` | Application environment state | Yes | `production` / `development` |
| `DATABASE_URL` | PostgreSQL connection string | Yes | `postgres://user:pass@host:5432/db` |
| `DB_POOL_MIN` | Minimum database connection pool size | Yes | `2` |
| `DB_POOL_MAX` | Maximum database connection pool size | Yes | `10` |
| `DB_TIMEOUT_MS` | PostgreSQL query timeout in milliseconds | Yes | `5000` |
| `JWT_SECRET` | 256-bit symmetric key for access token signing | Yes | 64-char hex string |
| `JWT_EXPIRES_IN` | Access token lifespan in seconds | Yes | `1800` (30 min) / `3600` |
| `REFRESH_TOKEN_SECRET`| Key for signing refresh tokens | Yes | 64-char hex string |
| `REFRESH_TOKEN_EXPIRES_IN` | Refresh token lifespan in seconds | Yes | `604800` (7 days) |
| `COOKIE_NAME` | Session cookie identifier | Yes | `innoventix_session` |
| `COOKIE_SECURE` | Enforce HTTPS Secure flag on cookies | Yes | `true` in production |
| `EMAIL_PROVIDER` | Outbound email provider mechanism | Yes | `smtp` |
| `SMTP_HOST` | Outbound SMTP host address | Yes | `mail.innoventixhub.tech` |
| `SMTP_PORT` | Outbound SMTP submission port | Yes | `587` |
| `SMTP_USER` | SMTP authentication username | Yes | `invites@innoventixhub.tech` |
| `SMTP_REQUIRE_TLS` | Require TLS upgrade on SMTP connection | Yes | `true` |
| `STRIPE_SECRET_KEY` | Stripe billing secret API key | Yes | `sk_live_...` or `sk_test_...` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Public key for Stripe Elements in browser | Yes | `pk_live_...` or `pk_test_...` |

---

## 3. Dual-Repository & Rollout Workflow

1. All code changes are committed and verified locally first (`npm run type-check`, `npm run lint`, `npm test`, `npm run build`).
2. Push to remote requires written approval in that session.
3. Upon approval, both repositories are pushed synchronously:
   ```bash
   git push origin main && git push deploy main
   ```
4. Coolify detects changes on `deploy` branch and triggers zero-downtime rebuild via `Dockerfile`.

---

## 4. Rollback Runbook

If a critical incident occurs post-deployment:
1. Open Coolify Dashboard -> Applications -> `innoventix-saas`.
2. Navigate to **Deployments** tab.
3. Identify the previous verified commit SHA.
4. Click **Redeploy** on the known-good commit.
5. In case of schema rollback, apply the rollback SQL migration from `supabase/migrations/` using `scripts/run-migration.ts`.

---

## 5. Related Files

- `docs/engineering/TESTING-STRATEGY.md`
- `docker-compose.prod.yml`
- `DEPLOYMENT_CHECKLIST.md`
- `MIGRATION_EXECUTION_LOG.md`
