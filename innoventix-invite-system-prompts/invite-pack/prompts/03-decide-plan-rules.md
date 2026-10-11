# 03: Write the plan rules in one config file

Create config/plans.ts (or the existing plan config if one exists; reuse it).

Define three plans with these fields: id, name, priceMonthlyUsd, maxMembers (seats including the owner), maxPendingInvites, canUseAllFeatures (always true), and a list of features shown in the upgrade UI.

Starting values (I will confirm them):
- free: name "Free", price 0, maxMembers 3, maxPendingInvites 2
- pro: name "Pro", price 35, maxMembers 15, maxPendingInvites 20
- enterprise: name "Enterprise", price null (contact sales), maxMembers 500, maxPendingInvites 500

Rules written in the file as comments:
- Free users get the full platform. Only team size and pending invites are limited.
- Limits are enforced on the server only.
- Changing a number here changes the limit everywhere.

Add a unit test that checks the three plans have increasing maxMembers. Do not connect to Stripe yet.
