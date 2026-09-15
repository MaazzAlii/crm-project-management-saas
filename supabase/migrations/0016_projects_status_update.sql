-- Migration 0016: Expand Projects status and add indexes for fast filtering

-- Drop existing status check constraint if present and update to accept all project statuses
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_status_check;

ALTER TABLE public.projects ADD CONSTRAINT projects_status_check 
CHECK (status IN (
    'planning', 'Planning', 
    'active', 'Active', 'in_progress', 
    'in_review', 'In Review', 'review', 
    'completed', 'Completed', 'delivered', 'invoiced', 'paid', 
    'on_hold', 'On Hold', 
    'archived', 'Archived', 
    'brief_received'
));

-- Index for searching assigned_to and deadline
CREATE INDEX IF NOT EXISTS idx_projects_assigned_to ON public.projects(assigned_to);
CREATE INDEX IF NOT EXISTS idx_projects_deadline ON public.projects(deadline);
