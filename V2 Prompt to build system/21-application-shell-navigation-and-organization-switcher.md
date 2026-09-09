# TASK 21 — Application Shell, Navigation & Organization Switcher

## Objective
Build the persistent org-level app shell (sidebar/topbar) and org switcher, distinct from the Super Admin shell.

## Why This Task Exists
Every org-facing screen from here lives inside this shell.

## Dependencies
- TASK 11
- TASK 13

## Current State
Only bare auth/onboarding pages exist.

## Files To Inspect
- app/(auth)/login/page.tsx

## Files To Create
- app/(dashboard)/layout.tsx
- components/shell/Sidebar.tsx
- components/shell/Topbar.tsx
- components/shell/OrgSwitcher.tsx

## Files To Modify


## Implementation Instructions
- Sidebar sections: Dashboard, Clients (CRM), Projects, Tasks, Inbox, Team, Analytics, Settings.
- Topbar with org switcher, user menu, notification bell (stub, wired TASK 53).
- Persist active organization in a cookie; mobile collapses to hamburger/drawer nav.

## UI Requirements
- Responsive shell with active-route highlighting.
- Loading skeleton while session resolves.

## Backend Requirements
- Server-side org-context resolution reused from TASK 11.

## Database Requirements
- N/A

## API Requirements
- N/A

## Security Requirements
- Switching orgs fully re-scopes all subsequent queries — no stale org_id client-side.

## Testing Requirements
- Test navigation and org-switch data re-scoping.

## Acceptance Criteria
- [ ] Shell renders consistently; org switch correctly changes visible data everywhere.

## Git Commit
Recommended commit:

`feat(ui): build application shell, navigation, and organization switcher`

## Verification
- Switch organizations and confirm the dashboard reloads with the new org's data.

## Next Task
`TASK 22`
