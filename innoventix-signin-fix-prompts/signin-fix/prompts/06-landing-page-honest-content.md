# 06: Landing page must not show fake business numbers

The public page shows: "Live Organization Workspace: Innoventix Agency", "Q4 Enterprise Campaigns & Pipeline", "14 Active Client Deals", "$142,500 Pipeline Value", "+28.4% MRR Growth", "99.8% On-Time Delivery", and deal names such as "Apex Global Cloud Migration". These are not real data.

Steps:
1. Find the component that renders these values (grep for "142,500", "28.4%", "99.8%", "Apex Global").
2. Replace the live-looking panel with either (a) a clearly labelled static illustration with the text "Example workspace" and no numbers, or (b) remove the panel. Choose (a) unless I say otherwise.
3. Change "Launch Live Demo Workspace" so it does not point to a live tenant. It should go to the signup page or a clearly labelled demo page. Confirm where it currently links.
4. Check the claim "Enterprise PostgreSQL Architecture Live v2.0" and "No credit card required". Tell me whether each is true today. Remove any claim that is not true.

Test: the landing page has no dollar amounts or percentages that are not labelled as examples.
