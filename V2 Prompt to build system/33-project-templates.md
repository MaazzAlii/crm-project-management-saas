# TASK 33 — Project Templates

## Objective
Allow saving a project's task structure as a reusable template.

## Why This Task Exists
Innoventix's recurring project types (UGC/Voice Agents/Automation) and other agencies' equivalents benefit directly.

## Dependencies
- TASK 31

## Current State
No template concept exists.

## Files To Inspect
- app/(dashboard)/projects/new/page.tsx

## Files To Create
- supabase/migrations/0012_project_templates.sql
- app/(dashboard)/settings/templates/page.tsx

## Files To Modify
- app/(dashboard)/projects/new/page.tsx

## Implementation Instructions
- project_templates and project_template_tasks tables, org-scoped.
- Save-as-template action; template picker on new-project form.

## UI Requirements
- Template management page; picker on new-project form.

## Backend Requirements
- Server actions for template CRUD and templated creation.

## Database Requirements
- project_templates, project_template_tasks tables.

## API Requirements
- N/A

## Security Requirements
- Template CRUD respects org RLS.

## Testing Requirements
- Test saving and applying a template.

## Acceptance Criteria
- [ ] Templates create/edit/apply correctly, pre-populating tasks with correct due-date offsets.

## Git Commit
Recommended commit:

`feat(projects): add reusable project templates`

## Verification
- Create a project from a template and confirm all default tasks appear correctly.

## Next Task
`TASK 34`
