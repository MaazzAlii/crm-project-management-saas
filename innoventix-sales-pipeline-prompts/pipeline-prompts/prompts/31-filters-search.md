# 31 - Search, filters, and saved views

Add filters to the header.

- Search: matches title, client name, and description. Debounced 300ms. Stored in the URL.
- Filters (as a popover): owner (multi-select), label (multi-select), value range (min and max), expected close date (before or after), status (open, won, lost, archived), and a toggle "Hide won and lost".
- Active filters appear as removable chips under the header.
- "Clear all" resets everything.
- Filters are applied on the server through the board endpoint (prompt 13), so counts and totals stay correct.
- Filtered-out columns still show, with a note "0 matches".

Also add a "My deals" quick toggle (owner = current user).
