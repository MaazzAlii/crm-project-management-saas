# TASK 12 — Main Dashboard Overview

## Objective
Build the landing dashboard summarizing what matters for the currently active organization.

## Why This Task Exists
This is the first thing any user sees after login — it must feel purpose-built per the original assignment's dashboard requirements, generalized for any org.

## Dependencies
- TASK 11
- TASK 04

## Current State
Shell exists; no data widgets built yet.

## Files To Inspect
- Original assignment: Sub-task 4 dashboard requirements

## Files To Create
- app/(dashboard)/dashboard/page.tsx
- components/dashboard/*.tsx

## Files To Modify


## Implementation Instructions
- Widgets: active projects count, pending tasks count, overdue projects (red alert), revenue-this-month (from paid projects), unread inbox messages count.
- Quick-add buttons: New Client, New Project.
- Recent activity feed (latest status changes across projects/tasks).

## UI Requirements
- Card-based widget grid, responsive to 1 column on mobile.
- Empty state for brand-new orgs with no clients yet (CTA to add first client).
- Loading skeletons per widget.

## Backend Requirements
- Server Components fetching aggregate counts scoped to organization_id via RLS-respecting queries.

## Database Requirements
- No new tables — reads from existing clients/projects/tasks/organization_subscriptions.

## API Requirements
- N/A

## Security Requirements
- Ensure all counts are RLS-scoped (never query with service role from a user-facing page).

## Testing Requirements
- Test dashboard for an org with data vs a brand-new empty org.

## Acceptance Criteria
- [ ] All widgets show accurate, org-scoped counts.
- [ ] Empty state renders correctly for new organizations.
- [ ] Quick-add buttons route to the correct forms.

## Git Commit
Recommended commit:

`feat(dashboard): build main overview dashboard with live widgets`

## Verification
- Compare widget counts against manual DB queries for the same org.

## Next Task
`TASK 13`
