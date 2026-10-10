# 04 - Database: labels, checklists, comments, activity

Add supporting tables for card details.

**pipeline_labels**: id, org_id, pipeline_id, name, color, created_at. Unique on (pipeline_id, name).

**deal_labels** (join table): deal_id, label_id, primary key on both, cascades on delete.

**deal_checklists**: id, org_id, deal_id (cascade), title, position (double precision), created_at.

**deal_checklist_items**: id, org_id, checklist_id (cascade), text, is_done (boolean, default false), position (double precision), created_at, updated_at.

**deal_comments**: id, org_id, deal_id (cascade), author_id, body (text, max 5000 characters at the database level), created_at, updated_at, deleted_at (soft delete).

**deal_activities**: id, org_id, deal_id (cascade), actor_id (nullable), type (text: created, updated, moved, won, lost, reopened, comment_added, checklist_updated, archived), data (jsonb, default '{}'), created_at. Index on (deal_id, created_at desc).

Make the migration idempotent. Add TypeScript types for each. Do not add UI.
