# 33 - Pipeline header totals and column stats

Add real stats to the page header:

- Total open pipeline value
- Weighted forecast (sum of value times probability for open deals)
- Deals count
- Average deal size
- Win rate for the last 90 days (won / (won + lost))

Column headers show count and total value. Hovering shows weighted value.

All numbers come from one aggregated query endpoint: GET /api/pipelines/[pipelineId]/stats. Respect filters. Cache for 30 seconds on the server. Do not compute totals in the browser from partial data.
