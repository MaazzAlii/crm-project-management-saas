# 02 - Database: pipelines and stages

Add tables for sales pipelines and their stages (Trello boards and lists).

Create a migration through the existing migration system with:

**pipelines**
- id (uuid, primary key), org_id (uuid, not null, indexed), name (text, not null), description (text, nullable)
- is_default (boolean, default false), created_by (uuid), created_at, updated_at

**pipeline_stages**
- id (uuid, primary key), org_id (uuid, not null, indexed), pipeline_id (uuid, references pipelines, on delete cascade)
- name (text, not null), color (text, default '#6366f1'), position (double precision, not null)
- is_won (boolean, default false), is_lost (boolean, default false)
- wip_limit (integer, nullable), created_at, updated_at
- Constraint: a stage cannot be both won and lost.
- Index on (pipeline_id, position).

Rules:
- Make the migration idempotent (CREATE TABLE IF NOT EXISTS, safe re-runs).
- Add a unique index so only one default pipeline exists per org.

Add TypeScript types for both tables in the existing types location. Do not add UI yet.
