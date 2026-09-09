# TASK 57 — Client Portal — Invoice & Payment Status View

## Objective
Build the client-facing invoice list and payment status view.

## Why This Task Exists
Matches the original spec's requirement and the natural counterpart to the internal invoice automation.

## Dependencies
- TASK 55
- TASK 50

## Current State
No client-facing billing view exists yet.

## Files To Inspect
- ORIGINAL-ASSIGNMENT-INNOVENTIX-PM.md (invoice + payment status)

## Files To Create
- app/(client-portal)/client/invoices/page.tsx

## Files To Modify


## Implementation Instructions
- List invoices linked to the client's projects, sourced from the shared invoices table structure agreed with the Invoice Generator integration.
- Show status (sent/paid/overdue) and payment history; read-only.

## UI Requirements
- Simple list/table with status badges.

## Backend Requirements
- Read-only Server Component, RLS-scoped by client_id.

## Database Requirements
- Document the exact expected shared invoices table shape in documentation/adr/004-invoice-integration.md if not already defined.

## API Requirements
- N/A

## Security Requirements
- Read-only reduces risk; confirm RLS still restricts to the client's own invoices only.

## Testing Requirements
- Test with a client having multiple invoices in different statuses.

## Acceptance Criteria
- [ ] Client sees accurate invoice/payment status, never another client's.

## Git Commit
Recommended commit:

`feat(client-portal): build invoice and payment status view`

## Verification
- Cross-check displayed invoice statuses against the shared invoices table for accuracy.

## Next Task
`TASK 58`
