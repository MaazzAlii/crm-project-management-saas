# Innoventix Team Invitations, Verification, Plans, and Stripe Test Pack

Goal: a working invite system (like Slack, Notion, or Trello), a dashboard that shows real data, free and paid plan limits, and Stripe test payments.

## How to run it
1. Paste 00-CONTEXT.md at the start of every Antigravity session.
2. Run prompts in numeric order. One prompt per session. Do not skip.
3. After each prompt, Antigravity must report: files changed, test results, and what it could not verify.
4. Do not push to any remote until phase 9 (prompts 50 to 56) passes locally.

## Phases
| Phase | Prompts | Result |
|---|---|---|
| 0 Audit and decisions | 01-04 | Known state of the code, deploy, plan rules, email provider |
| 1 Data model | 05-12 | Invitations, verification, plan limits, audit events |
| 2 Repositories and services | 13-22 | Business rules for invites, acceptance, seat limits, free tier |
| 3 API routes | 23-28 | HTTP endpoints, rate limits |
| 4 Email | 29-33 | Sending, templates, dev mode, failures |
| 5 Team and invite UI | 34-38 | Invite dialog, pending list, accept page |
| 6 Verification and plan UI | 39-41 | Email verification banner, usage card, upgrade prompts |
| 7 Dashboard | 42-44 | Real numbers, working quick actions |
| 8 Stripe test mode | 45-49 | Test checkout, webhook, billing sync |
| 9 Tests and deploy | 50-56 | End-to-end tests, cleanup, deploy, live verification |

## Rules for you
- Put Stripe and email keys only in `.env.local` (not committed) and in Coolify. Never paste them into a prompt, a commit, or a chat.
- Use Stripe test keys only (sk_test_, pk_test_) until the boss has approved the flow.
- Create two test accounts (owner and invitee) with email addresses you control.
