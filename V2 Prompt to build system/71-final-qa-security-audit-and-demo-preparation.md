# TASK 71 — Final QA, Security Audit & Demo Preparation

## Objective
Perform the final full-platform audit and prepare the live demo walkthrough from the original assignment, updated for the full expanded platform.

## Why This Task Exists
Closing task: verifies all 70 prior tasks together and delivers the demo Ubaid — and any future external customer — will actually see.

## Dependencies
- TASK 66
- TASK 69
- TASK 70

## Current State
All individual features are built and deployed; no final cross-cutting audit performed yet.

## Files To Inspect
- Entire codebase and documentation/ directory

## Files To Create
- documentation/final-completion-report.md

## Files To Modify


## Implementation Instructions
- Run the full Final Project Audit checklist from the orchestrator template (Functionality, Code, Security, Git, Deployment, Documentation, Agent Continuity), extended to explicitly cover self-hosted infra, Super Admin isolation, and AI-feature gating.
- Prepare and rehearse the live demo: add client (manual and connected) → add project → assign tasks → move through all statuses → trigger invoice automatically → show client portal → show Slack + in-app notifications → show analytics → show a Super Admin walkthrough of organization management → show an AI reply-suggestion in the inbox.
- Write the Final Completion Report per the orchestrator's format.
- Update .agent-state.md to reflect full completion and hand back to the Finance Tracker assignment, now that it can integrate against this platform's shared self-hosted schema.

## UI Requirements
- N/A

## Backend Requirements
- N/A

## Database Requirements
- N/A

## API Requirements
- N/A

## Security Requirements
- Final security pass: no secrets committed, RLS and super-admin isolation re-confirmed, audit log functioning, self-hosted services confirmed non-public where required (Studio, raw Postgres, monitoring dashboards).

## Testing Requirements
- Run the full unit, integration, and E2E suites one final time before sign-off.

## Acceptance Criteria
- [ ] Every item in the extended Final Project Audit checklist passes.
- [ ] The full demo script runs successfully live.
- [ ] Final completion report and .agent-state.md are accurate and complete.

## Git Commit
Recommended commit:

`chore(release): final QA pass and v1.0 completion report`

## Verification
- Walk through the entire demo script live, end to end, without errors.

## Next Task
`None — build complete. Resume the Finance Tracker assignment (Phase B) next, integrating it against this platform's self-hosted schema.`
