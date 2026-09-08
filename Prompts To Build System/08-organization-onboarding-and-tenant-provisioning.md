# TASK 08 — Organization Onboarding & Tenant Provisioning

## Objective
Build the guided flow a brand-new organization goes through the first time they sign up for the platform.

## Why This Task Exists
Since this platform is now sold to organizations beyond Innoventix, first-run onboarding must work for any generic agency, not assume Innoventix's specifics.

## Dependencies
- TASK 07

## Current State
Auth exists; no onboarding flow exists yet.

## Files To Inspect
- app/(auth)/signup/page.tsx

## Files To Create
- app/onboarding/page.tsx
- app/onboarding/steps/*.tsx
- lib/onboarding/actions.ts

## Files To Modify


## Implementation Instructions
- Step 1: organization details (name, industry/type of work e.g. UGC/Voice Agents/Automation/Combined — configurable list, not hardcoded).
- Step 2: invite team members (optional, skippable).
- Step 3: choose a subscription plan (links to Task 09/10) or start a trial.
- Step 4: land on empty-state dashboard with a 'add your first client' call to action.
- Persist onboarding_completed flag on organizations table (migration addition).

## UI Requirements
- Multi-step wizard with progress indicator.
- Skip/back navigation.
- Empty states designed intentionally, not left blank.

## Backend Requirements
- Server actions creating organization, memberships, invites, and initializing default subscription (trial) status.

## Database Requirements
- Add `onboarding_completed boolean default false` and `industry_type text` to organizations.

## API Requirements
- N/A

## Security Requirements
- Validate organization name/slug uniqueness server-side.
- Rate-limit invite sending to prevent abuse.

## Testing Requirements
- Test full onboarding as a brand-new, non-Innoventix organization to confirm no hardcoded assumptions leak in.

## Acceptance Criteria
- [ ] A completely new organization can onboard end-to-end with no Innoventix-specific text or logic appearing.
- [ ] Invites are sent and honored correctly.

## Git Commit
Recommended commit:

`feat(onboarding): add multi-step tenant onboarding flow`

## Verification
- Walk through onboarding as a fictitious second organization and confirm total isolation from the Innoventix org.

## Next Task
`TASK 09`
