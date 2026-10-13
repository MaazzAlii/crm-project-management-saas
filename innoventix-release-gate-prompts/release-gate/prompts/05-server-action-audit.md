# 05: Server action audit

1. Find every file that starts with 'use server' or exports functions used as server actions (grep -rln "'use server'" app lib).
2. For each exported function, record: whether it checks the session first, whether it catches errors, and whether it can throw into a Server Component render.
3. Find every place a server action is called directly from a Server Component render (not from a form or click handler). Example: fetchWeeklyReportMetricsAction called in app/(dashboard)/dashboard/page.tsx. Report each.
4. A server action called in render must not throw for an expected condition. It must return a typed result (for example { ok: false, reason }).

Report the table and the list of direct render calls.
