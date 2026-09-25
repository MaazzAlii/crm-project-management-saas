# AGENTS.md — Instructions for AI Coding Agents

Guidelines and execution protocols for AI coding agents (Antigravity, Cursor, Claude Code, Codex, Copilot).

---

## 🎯 Primary Project Objective: Supabase → PostgreSQL Migration

This repository (`crm-project-management-saas`) is undergoing a complete architectural refactor:
1. **Goal**: Remove Supabase dependency entirely; migrate to self-hosted PostgreSQL (Docker / Contabo VPS) with custom JWT-based authentication.
2. **Guidance Roadmap**: The complete 60-file roadmap is documented under `migration-postgres-60-files/migration-postgres/`.
3. **Execution Tracking**: Every execution step, reason, and validation status MUST be logged in `MIGRATION_EXECUTION_LOG.md` and `.agent-state.md`.

---

## 📜 Agent Operating Rules

### 1. Atomic Commits & Immediate Push
- **Every change must be committed individually** with clear, descriptive commit messages adhering to Conventional Commits (e.g. `feat(...)`, `refactor(...)`, `fix(...)`, `docs(...)`).
- Immediately push every commit to `origin main`.

### 2. Mandatory Work & State Logging
- Before and after every major step or phase, update `MIGRATION_EXECUTION_LOG.md` with:
  - **Timestamp**
  - **Phase / Task ID**
  - **Action Performed**
  - **Why it was performed (Rationale)**
  - **Files modified / created**
  - **Verification / Test Result**

### 3. Architecture & Security Standards
- Multi-tenancy must be strictly enforced at the application layer on every query/mutation (`organization_id`).
- All secret keys and database URLs must be kept in `.env.local` / environment variables — never committed.
- Auth must utilize secure HTTP-only cookies and bcrypt password hashing.

---

## 🚀 Quick Verification Commands

```bash
npm run lint
npm run build
npm test
```
