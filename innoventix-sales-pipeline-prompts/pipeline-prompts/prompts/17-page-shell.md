# 17 - Pipeline page shell and navigation

Create the pipeline page:
- Route: `/pipeline` (inside the existing authenticated app layout, following the pattern the other CRM pages use).
- Add a "Sales Pipeline" item to the sidebar or main navigation, using the existing nav component and icon style.
- The page is a server component that checks the session and loads the default pipeline and the list of pipelines.
- It renders a header bar with: the pipeline name (click to switch pipelines, built in prompt 36), a search box placeholder, a filter button placeholder, and a "+ New deal" button.
- Below the header is a horizontal scroll area. Leave an empty container that prompt 18 will fill.
- If the user has no pipeline, show an empty state with a "Create pipeline" button.

No drag and drop yet. Confirm it renders for an owner, an admin, a member, and a viewer.
