# TASK 13 — Organization Onboarding & Tenant Provisioning

## Objective
Build the guided first-run flow for any new organization signing up.

## Why This Task Exists
Must work for any generic agency, not assume Innoventix's specifics, since this now sells externally.

## Dependencies
- TASK 12

## Current State
Auth exists; no onboarding flow yet.

## Files To Inspect
- app/(auth)/signup/page.tsx

## Files To Create
- app/onboarding/page.tsx
- app/onboarding/steps/*.tsx

## Files To Modify


## Implementation Instructions
- Step 1: org details (name, industry_type — configurable, not hardcoded).
- Step 2: invite team (optional/skippable).
- Step 3: choose plan or start trial.
- Step 4: empty-state dashboard with 'add your first client' CTA.

## UI Requirements
- Multi-step wizard, progress indicator, skip/back nav.

## Backend Requirements
- Server actions creating org/memberships/invites/trial subscription.

## Database Requirements
- Add onboarding_completed, industry_type to organizations.

## API Requirements
- N/A

## Security Requirements
- Validate org name/slug uniqueness server-side; rate-limit invites.

## Testing Requirements
- Test onboarding as a brand-new, non-Innoventix organization.

## Acceptance Criteria
- [ ] New org can onboard end-to-end with zero Innoventix-specific assumptions leaking in.

## Git Commit
Recommended commit:

`feat(onboarding): add multi-step tenant onboarding flow`

## Verification
- Onboard a second fictitious org and confirm total isolation from Innoventix's org.

## Next Task
`TASK 14`
