# Innoventix Platform v2 — Multi-Tenant CRM, Project Management & AI SaaS

Production-ready multi-tenant SaaS platform combining **CRM, Project Management, a Unified Multi-Channel Communication Hub, and AI-Assisted Workflows**, fully self-hosted on a Contabo VPS with a dedicated Super Admin Platform Tier.

---

## Technical Stack & Architecture

- **Frontend Application**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Database & Authentication**: Self-Hosted Supabase Stack (PostgreSQL 15, GoTrue Auth, PostgREST, Realtime, Storage) via Docker Compose
- **Automation & Triggers**: n8n Automation Engine co-located on Contabo VPS
- **Reverse Proxy & SSL**: Nginx with Let's Encrypt automated TLS certificates
- **Platform Management**: Dedicated Super Admin platform layer (`super_admins` table) isolated from tenant roles
- **AI Engine**: Provider-agnostic AI integration layer for reply suggestions, lead scoring, task extraction, and report narratives

---

## Quick Start (Local Development)

```bash
# 1. Clone repository
git clone https://github.com/MaazzAlii/crm-project-management-saas.git
cd crm-project-management-saas

# 2. Copy environment variable template
cp .env.local.example .env.local

# 3. Launch local Supabase Docker stack
docker compose -f docker-compose.local.yml up -d

# 4. Install dependencies & start dev server
npm install
npm run dev
```

Visit `http://localhost:3000` to view the application shell.

---

## Infrastructure & Deployment

See documentation guides:
- [Server Hardening & Setup](file:///c:/Users/maaza/OneDrive/Desktop/100%20days%20of%20code%20praactice/INNOVENTIX%20HUB/crm-project-management-saas/documentation/infra/server-setup.md)
- [Self-Hosted Supabase Stack](file:///c:/Users/maaza/OneDrive/Desktop/100%20days%20of%20code%20praactice/INNOVENTIX%20HUB/crm-project-management-saas/documentation/infra/self-hosted-supabase.md)
- [DNS & Let's Encrypt SSL](file:///c:/Users/maaza/OneDrive/Desktop/100%20days%20of%20code%20praactice/INNOVENTIX%20HUB/crm-project-management-saas/documentation/infra/dns-ssl.md)
- [Backup & Disaster Recovery](file:///c:/Users/maaza/OneDrive/Desktop/100%20days%20of%20code%20praactice/INNOVENTIX%20HUB/crm-project-management-saas/documentation/infra/backup-restore.md)
- [Local Development Setup](file:///c:/Users/maaza/OneDrive/Desktop/100%20days%20of%20code%20praactice/INNOVENTIX%20HUB/crm-project-management-saas/documentation/infra/local-dev-setup.md)
- [Architecture Blueprint](file:///c:/Users/maaza/OneDrive/Desktop/100%20days%20of%20code%20praactice/INNOVENTIX%20HUB/crm-project-management-saas/documentation/architecture.md)
