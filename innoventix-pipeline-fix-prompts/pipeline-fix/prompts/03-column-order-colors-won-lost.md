# 03: Column order, colors, and won/lost flags

Build:
1. Drag a column header left or right to reorder columns. Use @dnd-kit sortable for columns. Save with `PUT /api/pipelines/[id]/stages/order`. Confirm the endpoint rejects missing, extra, or duplicate IDs.
2. Column color: a menu item "Change color" with a palette of 10 colors. Save with PATCH.
3. Mark as won / mark as lost: a menu item on one column each. Only one won and one lost column per pipeline. Setting a new one clears the old one, after a confirmation.
4. Won and lost columns render with a green or red top border, and the header total uses only open deals.

Check against the server: a reorder by a member returns 403. The stage order after reload matches what was set.

Test all four behaviors.
