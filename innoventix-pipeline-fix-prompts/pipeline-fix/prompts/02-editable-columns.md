# 02: Editable columns (rename, add, delete)

Columns (stages) must be editable like Trello lists. Prompt 23 of the original pack asked for this, and it is missing.

Build:
1. Click a column title to rename it inline. Enter or blur saves. Escape cancels. Empty names are rejected with a message. Maximum 50 characters.
2. "+ Add another list" at the end of the board. Enter creates the stage at the end.
3. Column menu (the chevron) with: Rename, Delete list.
4. Delete list: if the column has deals, show a dialog to choose a destination column. The deals move there. Deleting is refused for the last remaining column, and for the Won or Lost columns while they are marked as special (handled in prompt 03).

Rules:
- Use the existing stage endpoints: PATCH and DELETE under `/api/pipelines/[id]/stages/[stageId]`, and POST for create. Do not add new endpoints unless the existing ones are missing a capability.
- Admins and owners only. Members see the controls disabled.
- Optimistic update with rollback and a toast on error.

Test: rename persists after reload; add a column and it persists after reload; delete a column with deals and the deals appear in the destination column.
