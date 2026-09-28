-- =============================================================================
-- Innoventix Platform v2 — User Preferences and Organization Settings
-- =============================================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;

-- Index for JSONB queries
CREATE INDEX IF NOT EXISTS idx_users_preferences ON users USING gin (preferences);
CREATE INDEX IF NOT EXISTS idx_organizations_settings ON organizations USING gin (settings);
