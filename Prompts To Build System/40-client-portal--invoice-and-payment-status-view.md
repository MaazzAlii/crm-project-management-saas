# TASK 40 — Client Portal — Invoice & Payment Status View

## Objective
Build the client-facing invoice list and payment status view.

## Why This Task Exists
Matches the original spec's /client/projects/[id] invoice+payment-status requirement, and is the natural client-facing counterpart to the internal invoice automation (Task 33).

## Dependencies
- TASK 38
- TASK 33

## Current State
No client-facing billing view exists yet; internal invoice trigger exists.

## Files To Inspect
- Original assignment: Sub-task 6 (invoice + payment status)

## Files To Create
- app/(client-portal)/client/invoices/page.tsx

## Files To Modify


## Implementation Instructions
- List invoices linked to the client's projects (sourced from the shared Supabase tables used by Rehmat's Invoice Generator, per the original spec's shared-database design).
- Show status (sent/paid/overdue) and payment history.
- Note: full payment collection UI is out of scope here — Rehmat's Invoice Generator owns invoice PDF generation; this view only reads shared invoice-status data, exactly per the original integration boundary.

## UI Requirements
- Simple list/table of invoices with status badges.

## Backend Requirements
- Read-only server component, RLS-scoped by client_id.

## Database Requirements
- Depends on the shared `invoices` table structure agreed with Rehmat's system (document the exact expected shape in documentation/adr/003-invoice-integration.md if not already defined).

## API Requirements
- N/A

## Security Requirements
- Read-only — no write path here reduces risk; confirm RLS still restricts to the client's own invoices only.

## Testing Requirements
- Test with a client that has multiple invoices in different statuses.

## Acceptance Criteria
- [ ] Client can see accurate invoice/payment status without being able to view any other client's invoices.

## Git Commit
Recommended commit:

`feat(client-portal): build invoice and payment status view`

## Verification
- Cross-check displayed invoice statuses against the shared invoices table for accuracy.

## Next Task
`TASK 41`
