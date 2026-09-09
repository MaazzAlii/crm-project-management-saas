-- TASK 13 Migration 9: Add Onboarding Completion and Industry Type to Organizations

ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS industry_type VARCHAR(100) DEFAULT 'General Agency';
