# 03 - Database: deals (cards)

Add the `deals` table: the cards that move across the pipeline.

**deals**
- id (uuid, primary key), org_id (uuid, not null, indexed)
- pipeline_id (uuid, references pipelines, on delete cascade)
- stage_id (uuid, references pipeline_stages, not null)
- client_id (uuid, nullable, references the existing clients table)
- owner_id (uuid, nullable, references the existing users table)
- title (text, not null), description (text, nullable)
- value (numeric(14,2), default 0), currency (text, default 'USD')
- probability (integer, default 0, check between 0 and 100)
- position (double precision, not null)
- expected_close_date (date, nullable)
- status (text, not null, default 'open', check in 'open', 'won', 'lost', 'archived')
- lost_reason (text, nullable)
- closed_at (timestamptz, nullable)
- version (integer, not null, default 1) for optimistic concurrency
- created_by (uuid), created_at, updated_at

Indexes:
- (org_id, pipeline_id, stage_id, position)
- (org_id, owner_id)
- (org_id, expected_close_date)

Make the migration idempotent. Add the TypeScript type. Do not add UI.
