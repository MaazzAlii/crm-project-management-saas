# 20 - Board data loading

Connect the page to real data.

- The server component loads the board using the repository and service layer from prompts 06 and 07 (not by calling its own API route from the server).
- Pass the data to a client component `PipelineBoardClient` that holds the state.
- Use the URL search params for filters so the state survives refresh and can be shared (for example `?owner=...&label=...&q=...`).
- Show a loading skeleton for the board while the server work finishes (use the Next.js loading file for the route).
- Handle errors with an error boundary that shows a retry button.

After this step, the board shows real pipeline data for the logged-in user's organization, and the counts and totals match the database.
