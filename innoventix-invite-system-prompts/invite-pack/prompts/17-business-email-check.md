# 17: Business email check

Create lib/validation/business-email.ts:
- A list of common personal email domains (gmail.com, yahoo.com, outlook.com, hotmail.com, icloud.com, proton.me, aol.com, and similar). Keep the list in one file so it can be edited.
- classifyEmail(email) returns { domain, isPersonal, isBusinessCandidate }.

This check does not block anyone. It is used to:
- show a notice when an owner invites a personal address to a Pro workspace ("This address uses a personal email provider. It will work.")
- decide which verification badge to show.

Tests cover known personal domains, a company domain, and subdomains.
