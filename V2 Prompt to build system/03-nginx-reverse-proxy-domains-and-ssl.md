# TASK 03 — Nginx Reverse Proxy, Domains & SSL

## Objective
Put a single Nginx reverse proxy in front of the app, the Supabase API, and n8n, each on its own subdomain with automatic HTTPS.

## Why This Task Exists
One VPS now serves multiple services (app, Supabase API, Studio-restricted, n8n) — a proper reverse proxy with SSL is what makes this safe and production-usable.

## Dependencies
- TASK 02

## Current State
Services run on internal ports only; no public domain/HTTPS routing exists yet.

## Files To Inspect
- docker-compose.supabase.yml

## Files To Create
- nginx/conf.d/app.conf
- nginx/conf.d/api.conf
- nginx/conf.d/n8n.conf
- documentation/infra/dns-ssl.md

## Files To Modify


## Implementation Instructions
- Configure subdomains: app.yourdomain.com (Next.js), api.yourdomain.com (Supabase/PostgREST+Auth+Storage+Realtime), n8n.yourdomain.com (existing n8n, now proxied consistently).
- Issue and auto-renew SSL certificates via Let's Encrypt/Certbot for every subdomain.
- Force HTTPS redirects on all subdomains; set standard security headers (HSTS, X-Frame-Options, etc.).

## UI Requirements
- N/A

## Backend Requirements
- N/A

## Database Requirements
- N/A

## API Requirements
- N/A

## Security Requirements
- Confirm no service is reachable over plain HTTP or on its raw internal port from the public internet.

## Testing Requirements
- Test each subdomain resolves, redirects HTTP→HTTPS, and serves a valid certificate.

## Acceptance Criteria
- [ ] All subdomains reachable over valid HTTPS only.
- [ ] Certificates auto-renew without manual intervention.

## Git Commit
Recommended commit:

`feat(infra): configure Nginx reverse proxy with SSL for all subdomains`

## Verification
- Run an SSL checker against each subdomain and confirm a valid, trusted certificate.

## Next Task
`TASK 04`
