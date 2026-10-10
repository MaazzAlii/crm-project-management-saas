# 18 - Trello-style card component (visual only)

Create `components/pipeline/DealCard.tsx`. This is the card as it looks, with no drag logic yet.

The card shows, from top to bottom:
- Label chips in a row (colored pills, max 4, then "+2")
- Title (two lines max, then ellipsis)
- A small line with the client name in muted text
- A bottom row: value (formatted with the currency), expected close date (red if overdue, amber if within 7 days), owner avatar (initials fallback), checklist progress (for example "2/5" with a small check icon), comment count icon, description icon if a description exists
- Probability as a thin progress bar at the bottom edge, colored by stage color

Style:
- Card background slightly lighter than the column, 8px radius, subtle border and shadow, padding 12px.
- Hover: slight lift and border highlight.
- Use Tailwind tokens already in the app. Do not add a new UI library.

Create a Storybook-free preview: a temporary `/pipeline/dev` page with 10 sample cards in mixed states. Remove the dev page before final commit, or keep it behind `NODE_ENV !== 'production'`.
