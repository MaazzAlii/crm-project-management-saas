-- TASK 23 Migration 12: Add Logo URL and Timezone to Organizations

ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS timezone VARCHAR(100) DEFAULT 'UTC';
