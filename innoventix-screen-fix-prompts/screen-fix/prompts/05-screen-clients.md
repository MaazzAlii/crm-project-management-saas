# 05: Clients

Screen: /clients (Clients Directory, Cards and Table views). Checklist: checklists/05-clients.md

Fix:
1. "New Client" creates a client in the current organization. Required fields are validated on the server.
2. Client card status badges come from real data. "Connected" appears only when a channel is actually linked. Remove any hardcoded "Connected" badge. A client with no channel shows "Not connected".
3. Platform field (for example WhatsApp) is stored with the client and shown from data.
4. "Showing 1 of 1 clients" count and filters (status, platform, communication mode, country, tag) work against the database.
5. Delete client: confirm dialog, then removes the client. Related projects are not silently deleted; block delete if projects exist, or ask what to do. State the rule you implemented.
6. The empty card area with a blinking cursor on the "rahmat" card is a stray input or placeholder. Remove it, or make it a real field, and say which.
7. Manage Tags creates and assigns tags within the organization.

Test (Playwright): create client, appears once; status is "Not connected" with no channel; filter by platform; delete; second org cannot see it.

Verify: npm run build, npm test, npm run test:e2e -- clients. Report counts. Do not push.
