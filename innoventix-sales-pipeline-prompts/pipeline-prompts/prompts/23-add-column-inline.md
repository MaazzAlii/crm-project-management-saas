# 23 - Add, rename, recolor, and delete columns (stages)

Add the column-level actions.

1. "+ Add another list" button at the end of the columns opens an inline input for the stage name. Enter saves (calls POST stage route), Escape cancels.
2. Click a column title to rename it inline. Enter or blur saves. Empty names are rejected.
3. The column "..." menu contains:
   - Rename
   - Change color (a small palette of 10 colors)
   - Set WIP limit (number input, empty means no limit)
   - Mark as Won stage / Mark as Lost stage (only one of each is allowed per pipeline; confirm when changing)
   - Move list left / Move list right
   - Archive all cards in this list (sets status archived for open cards, asks to confirm)
   - Delete list (requires choosing a destination list for its cards, with a confirmation dialog)

All changes update optimistically and roll back on error. Admin and owner only; members see the menu items disabled with a tooltip.
