# TASK 11 — Application Shell, Navigation & Organization Switcher

## Objective
Build the persistent app shell (sidebar/topbar), navigation, and a proper multi-organization switcher.

## Why This Task Exists
Every screen from here forward lives inside this shell; building it once, correctly, avoids inconsistent layouts later.

## Dependencies
- TASK 06
- TASK 08

## Current State
Only bare auth pages exist; no shared dashboard layout.

## Files To Inspect
- app/(auth)/login/page.tsx
- lib/auth/session.ts

## Files To Create
- app/(dashboard)/layout.tsx
- components/shell/Sidebar.tsx
- components/shell/Topbar.tsx
- components/shell/OrgSwitcher.tsx

## Files To Modify


## Implementation Instructions
- Build responsive sidebar with sections: Dashboard, Clients (CRM), Projects, Tasks, Inbox (Communication Hub), Team, Analytics, Settings.
- Build topbar with organization switcher (for users in multiple orgs), user menu, notification bell (stub, wired in Task 36).
- Persist last-active organization in a cookie so refreshes keep context.
- Collapse sidebar into a bottom/hamburger nav on mobile.

## UI Requirements
- Sidebar with active-route highlighting.
- Org switcher dropdown with search if user belongs to many orgs.
- Mobile: hamburger + drawer nav.
- Loading skeleton for the shell while session resolves.

## Backend Requirements
- Server-side org-context resolution reused from Task 06 session helper.

## Database Requirements
- N/A

## API Requirements
- N/A

## Security Requirements
- Ensure switching organizations fully re-scopes all subsequent queries (no stale org_id in client state).

## Testing Requirements
- Test navigation across every top-level route.
- Test org switch updates all subsequently loaded data.

## Acceptance Criteria
- [ ] Shell renders consistently across all dashboard routes.
- [ ] Org switch correctly changes visible data everywhere.
- [ ] Mobile nav is usable one-handed.

## Git Commit
Recommended commit:

`feat(ui): build application shell, navigation, and organization switcher`

## Verification
- Click through every sidebar link.
- Switch organizations and confirm the dashboard reloads with the new org's data.

## Next Task
`TASK 12`
