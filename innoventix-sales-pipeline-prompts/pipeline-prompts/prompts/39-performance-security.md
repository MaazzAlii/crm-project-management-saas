# 39 - Performance and security hardening

Performance:
- Add database indexes for every filter used by the board (check with EXPLAIN ANALYZE on a dataset of 10,000 deals).
- Confirm the board query runs in a fixed number of queries regardless of deal count (no N+1).
- Paginate each column to 100 cards with "load more" (from prompt 07).
- If a column has more than 200 cards in the DOM, use list virtualization.
- Images and avatars are lazy loaded.

Security:
- Re-check every new route for org scoping and role checks.
- Validate all query parameters with a schema. Limit string lengths. Reject unknown fields.
- Rate limit the move, create, and comment endpoints (use the existing rate limit helper if there is one, or add a simple in-memory limiter behind an interface).
- Escape all user content. Confirm there is no dangerouslySetInnerHTML for user input.
- Confirm no secrets or test credentials were added to any file. Run a search for common secret patterns before the final commit.

Report the before and after timings for the board load.
