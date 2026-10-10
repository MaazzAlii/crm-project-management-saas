# 37 - Loading, empty, error states, and responsive polish

Make every state look finished.

- Loading: skeleton columns with shimmer that match the real layout.
- Empty board: a friendly illustration area and "Add your first deal" button. Empty column: dashed placeholder (from prompt 19).
- Error: toast for action errors (with the reason), and an inline banner for load errors with retry.
- Offline: detect a failed network call and show "You appear to be offline. Changes will not be saved." Do not queue changes silently.
- Responsive: test at 1440px, 1024px, 768px, and 390px widths. The header wraps, the card detail becomes a full-screen sheet on phones, and the board scrolls horizontally with snap.
- Dark theme: every new component must look correct in the app's existing theme.

Check against the existing screenshots style so the new pages look like the rest of the app.
