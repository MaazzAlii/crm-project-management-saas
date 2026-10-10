# 34 - Forecast and reporting view

Add a second view on the same page: a "Table" and "Forecast" toggle next to the board.

- Table view: all deals in a sortable table (title, client, stage, value, probability, weighted value, owner, close date, status). Paginated, 50 per page, exports to CSV for the current filters.
- Forecast view: grouped by expected close month, showing total and weighted value per month, and a simple bar chart. Use the chart library already in the project if one exists; otherwise, a lightweight SVG bar chart.
- Lost reasons breakdown: counts per reason for the selected period.

Use the same filters as the board. CSV export is server-side and respects org scope.
