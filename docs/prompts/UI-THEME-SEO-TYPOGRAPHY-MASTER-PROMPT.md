`# MASTER PROMPT — UI Theme Toggle, SEO Hierarchy & Typography System`

**`**Document:**`** `docs/prompts/UI-THEME-SEO-TYPOGRAPHY-MASTER-PROMPT.md`  
**`**Version:**`** `1.0`  
**`**Purpose:**`** `Implement (1) universal dark/light mode toggle, (2) SEO`  
`heading hierarchy + metadata across all routes, (3) refined typography`  
`system using Geist Sans + Geist Mono.`  
**`**Compatible with:**`** `Antigravity, Cursor, Claude Code, Codex, DeepSeek`

`---`

`## 0. ROLE & PRECONDITIONS`

`You are the senior frontend engineer and design systems engineer for`  
`this project.`

`BEFORE STARTING, you MUST read in this order:`  
`1. docs/prompts/UNIVERSAL-UI-AND-ENGINEERING-PROTOCOL.md`  
`2. docs/prompts/PROJECT-CONTEXT.md`  
`3. docs/design/DESIGN-SYSTEM.md`  
`4. docs/design/THEME-SYSTEM.md`  
`5. docs/design/SURFACE-HIERARCHY.md`  
`6. docs/engineering/CODING-STANDARDS.md`  
`7. docs/engineering/COMPONENT-LIBRARY.md`  
`8. .agent-state.md`

`Do NOT start coding until all are read.`

`---`

`## 1. SCOPE — THREE PARTS, THREE BATCHES`

`| Batch | Theme | Items |`  
`|-------|-------|-------|`  
`| **Batch UI-1** | Theme Toggle + Typography | Dark/light toggle in all layouts, Geist font integration, type scale tokens |`  
`| **Batch UI-2** | SEO on Public Pages | Landing, pricing, auth pages — semantic HTML, H1/H2/H3, metadata, JSON-LD |`  
`| **Batch UI-3** | SEO on App Pages | Dashboard, clients, projects, etc. — semantic headings, per-route metadata, accessibility |`

`Work them in order. Do NOT batch them into one session.`

`---`

`## 2. BATCH UI-1 — THEME TOGGLE + TYPOGRAPHY`

`### 2.1 — Theme Toggle Implementation`

**`**Objective:**`** `A visible, accessible toggle in every layout (public + app + client portal + super admin), with localStorage persistence and zero flash on load.`

**`**Files to Inspect:**`**  
`- docs/design/THEME-SYSTEM.md`  
`- app/layout.tsx (root)`  
`- app/(dashboard)/layout.tsx`  
`- app/(auth)/layout.tsx (if exists)`  
`- app/(client-portal)/layout.tsx`  
`- app/super-admin/layout.tsx`  
`- components/shell/Topbar.tsx`  
`- Any existing ThemeProvider or theme hooks`

**`**Implementation Steps:**`**  
``1. Verify `docs/design/THEME-SYSTEM.md` matches the actual token names in `app/globals.css`. If drift, update the CSS first, then the doc.``  
``2. Create or verify `components/providers/theme-provider.tsx`:``  
   ``- Reads `localStorage.getItem('theme')` → falls back to `prefers-color-scheme` → defaults to `light`.``  
   ``- Applies `.dark` or `[data-theme="dark"]` class to `<html>`.``  
   ``- Exposes `useTheme()` returning `{ theme, setTheme, toggle }`.``  
``3. Add inline anti-flash script to `app/layout.tsx` `<head>`:``  
   ```` ```html ````  
   `<script dangerouslySetInnerHTML={{`  
     `` __html: `(function(){try{var t=localStorage.getItem('theme');var d=window.matchMedia('(prefers-color-scheme: dark)').matches;if(t==='dark'||(!t&&d)){document.documentElement.classList.add('dark')}}catch(e){}})()` ``

   `}} />`

4. Create `components/ui/theme-toggle.tsx`:  
   * Three-state control: Light / Dark / System (or two-state toggle Light/Dark — your choice; document it).  
   * Uses `lucide-react` icons: `Sun`, `Moon`, `Monitor`.  
   * ARIA: `role="switch"`, `aria-checked`, `aria-label="Toggle theme"`.  
   * Keyboard: Enter/Space activates.  
   * Styled per `docs/design/DESIGN-SYSTEM.md` tokens.  
5. Place `<ThemeToggle />` in:  
   * `components/shell/Topbar.tsx` (dashboard, right side, next to notification bell).  
   * Landing page nav (`app/page.tsx`) — top right, next to "Sign In".  
   * Auth pages (`app/(auth)/login/page.tsx`, `signup/page.tsx`, `reset-password`, `change-password`).  
   * Client portal (`app/(client-portal)/layout.tsx`).  
   * Super admin (`components/super-admin/super-admin-nav.tsx`).  
6. Verify: no flash on reload in both themes, toggle works in every layout, state persists across navigation.

Acceptance Criteria:

* □ Toggle visible in topbar of every layout.  
* □ Toggling instantly updates every visible surface.  
* □ Reload preserves choice (no flash).  
* □ System preference respected when no explicit choice.  
* □ Keyboard accessible, ARIA correct.  
* □ Both themes pass WCAG AA contrast.  
* □ Screenshot verification: landing, dashboard, login in both themes.

---

### **2.2 — Typography System (Geist Sans \+ Geist Mono)**

Objective: Replace generic system fonts with Geist, define a full type scale, apply consistently across all screens.

Files to Inspect:

* app/layout.tsx  
* app/globals.css  
* tailwind.config.ts  
* docs/design/DESIGN-SYSTEM.md (Typography section)  
* package.json

Implementation Steps:

1. Install fonts:  
2. `bash`  
3. `npm install geist`  
4. In `app/layout.tsx`, integrate via `next/font`:  
5. `ts`

`import { GeistSans } from 'geist/font/sans'`  
`import { GeistMono } from 'geist/font/mono'`

6. *``// Apply to <html className={`${GeistSans.variable} ${GeistMono.variable}`}>``*  
7. In `tailwind.config.ts`, extend fontFamily:  
8. `ts`

`fontFamily: {`  
  `sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],`  
  `mono: ['var(--font-geist-mono)', 'ui-monospace', 'monospace'],`

9. `}`  
10. In `app/globals.css` and `docs/design/DESIGN-SYSTEM.md`, define type scale tokens:  
11. `text`

`--text-xs:   0.75rem;  /* 12px */`  
`--text-sm:   0.8125rem; /* 13px */`  
`--text-base: 0.875rem; /* 14px — app default */`  
`--text-md:   1rem;     /* 16px — marketing default */`  
`--text-lg:   1.125rem;`  
`--text-xl:   1.25rem;`  
`--text-2xl:  1.5rem;`  
`--text-3xl:  1.875rem;`  
`--text-4xl:  2.25rem;`  
`--text-5xl:  3rem;`

12. `--text-6xl:  3.75rem;`  
13. Define weights: 400, 500, 600, 700\. No 300 or 800\.  
14. Define line-heights: tight (1.2), snug (1.35), normal (1.5), relaxed (1.65).  
15. Define letter-spacing: tight (-0.02em) for display, normal (0) for body, wide (0.05em) for uppercase labels.  
16. Create a `<Text>` primitive in `components/ui/text.tsx`:  
17. `tsx`  
18. `<Text variant="h1" | "h2" | "h3" | "body" | "caption" | "label">`  
    * Maps variant → semantic tag \+ class.  
    * Never allow raw font sizes outside tokens.  
19. Replace ad-hoc text classes across:  
    * Landing page  
    * Dashboard  
    * All auth pages  
    * Tables and cards  
    * Modals  
20. Update `docs/design/DESIGN-SYSTEM.md` Typography section with the final scale.

Acceptance Criteria:

* □ Geist Sans and Geist Mono loaded via `next/font` (no FOUT).  
* □ Tailwind `font-sans` resolves to Geist.  
* □ All headings/body use the `<Text>` primitive or Tailwind tokens.  
* □ Zero hardcoded `text-[13px]` or `font-['Arial']` anywhere.  
* □ Visual verification: landing, dashboard, login, table with numeric data.  
* □ DESIGN-SYSTEM.md updated.

---

## **3\. BATCH UI-2 — SEO ON PUBLIC PAGES**

### **3.1 — Landing Page (`app/page.tsx`)**

Objective: Full SEO-optimized landing page with proper heading hierarchy, structured data, and meta.

Implementation Steps:

1. Metadata in `app/page.tsx`:  
2. `ts`

`export const metadata: Metadata = {`  
  `title: 'Innoventix — CRM & Project Management SaaS for Agencies',`  
  `description: 'Unify your sales pipeline, projects, and client communication in one workspace. Built for modern agencies. Start a 14-day free trial.',`  
  `keywords: ['CRM', 'project management', 'agency software', 'sales pipeline', 'client portal'],`  
  `openGraph: {`  
    `title: 'Innoventix — CRM & Project Management SaaS',`  
    `description: '...',`  
    `images: ['/og-landing.png'],`  
    `type: 'website',`  
  `},`  
  `twitter: {`  
    `card: 'summary_large_image',`  
    `title: '...',`  
    `description: '...',`  
    `images: ['/og-landing.png'],`  
  `},`  
  `alternates: { canonical: 'https://project-manager.calara.agency/' },`

3. `}`  
4. Heading hierarchy:  
   * One `<h1>`: hero title. Contains primary keyword.  
   * Each feature section: `<h2>` for section title.  
   * Each card within a section: `<h3>`.  
   * No skipped levels (H1 → H2 → H3, never H1 → H3).  
5. Semantic HTML:  
   * `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<aside>`, `<footer>`.  
   * Not `<div>` everywhere.  
6. JSON-LD structured data in `<script type="application/ld+json">`:  
   * `Organization` (name, url, logo, contact).  
   * `Product` or `SoftwareApplication` (name, description, offers).  
   * `FAQPage` if you have an FAQ section.  
7. Image alt text: descriptive, keyword-relevant, never "image1.png".  
8. Internal links: nav links anchor to sections with descriptive text.  
9. Sitemap: `app/sitemap.ts` generating a dynamic sitemap with public routes only.  
10. robots.txt: verify `app/robots.ts` or `public/robots.txt` — allow public, disallow `/api/`, `/dashboard`, `/settings`, `/super-admin`, `/client/`.

Acceptance Criteria:

* □ One H1, proper H2/H3 nesting.  
* □ All metadata present.  
* □ OG image renders correctly when shared to Twitter/LinkedIn.  
* □ JSON-LD validators pass (Rich Results Test).  
* □ Sitemap reachable at `/sitemap.xml`.  
* □ robots.txt correctly disallows private routes.  
* □ Lighthouse SEO score ≥ 95 on landing page.

---

### **3.2 — Pricing, Auth, and Other Public Pages**

Objective: Same treatment for `/pricing` (if exists), `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/client/login`.

Implementation Steps:

1. Each public route gets its own `export const metadata`.  
2. Each page has exactly one `<h1>` — usually the page title.  
3. Auth pages:  
   * H1: "Sign in to your workspace" (not a `<div>`).  
   * H2 for any sub-sections (none on simple forms).  
4. Add `alternates.canonical` to prevent duplicate content.  
5. Add `robots: { index: false }` to auth pages — you don't want `/login` indexed.

Acceptance Criteria:

* □ Every public route has metadata.  
* □ Auth pages have `noindex`.  
* □ Landing/pricing/marketing pages have canonical URLs.

---

## **4\. BATCH UI-3 — SEO ON APP PAGES**

### **4.1 — Dashboard and App Routes**

Objective: Semantic headings and per-route metadata across the authenticated app.

Implementation Steps:

1. Per-route metadata: Create `metadata` or `generateMetadata` in each:  
   * `app/(dashboard)/dashboard/page.tsx`  
   * `app/(dashboard)/clients/page.tsx`  
   * `app/(dashboard)/clients/[id]/page.tsx`  
   * `app/(dashboard)/projects/page.tsx`  
   * `app/(dashboard)/projects/[id]/page.tsx`  
   * `app/(dashboard)/leads/page.tsx`  
   * `app/(dashboard)/tasks/page.tsx`  
   * `app/(dashboard)/inbox/page.tsx`  
   * `app/(dashboard)/settings/*/page.tsx`  
   * `app/super-admin/**/page.tsx`  
2. Format: `"Page Name — Innoventix"` (title), descriptive (description).  
3. `robots: { index: false }` on ALL authenticated pages — they must never be indexed.  
4. Heading hierarchy:  
   * Page title \= `<h1>` (there is usually one per page).  
   * Section titles within \= `<h2>`.  
   * Card titles \= `<h3>`.  
   * Currently many pages use `<div>` for what should be headings — fix these.  
5. Accessibility heading check: every page has exactly one H1.  
6. Dynamic routes: `generateMetadata` fetches the entity and returns:  
   * Clients: `"${client.name} — Innoventix"`  
   * Projects: `"${project.title} — Innoventix"`

Acceptance Criteria:

* □ Every app route has metadata.  
* □ Every app route is `noindex`.  
* □ Every page has exactly one `<h1>`.  
* □ No heading levels skipped.  
* □ Accessibility audit passes (axe DevTools 0 critical issues).

---

## **5\. STRICT RULES**

* Do not break existing functionality.  
* Do not hardcode colors — use tokens.  
* Do not use more than 2 fonts (Geist Sans \+ Geist Mono).  
* Do not add SEO to authenticated pages for indexing — only for metadata/accessibility.  
* Every change updates the corresponding MD file in the same commit.  
* Every commit follows Conventional Commits.  
* Do NOT push without written approval.

---

## **6\. STANDARD REPORT FORMAT**

At the end of each batch:

`text`

`SESSION SUMMARY`

`TASK: UI Theme + SEO + Typography — Batch [UI-1 | UI-2 | UI-3]`  
`STATUS: complete | partial | blocked`

`FILES CHANGED: ...`  
`FILES CREATED: ...`  
`MD FILES UPDATED: ...`  
`TESTS ADDED: ...`

`TEST RESULTS:`  
`- Type-check: ...`  
`- Lint: ...`  
`- Build: ...`  
`- Lighthouse (if run): ...`

`BROWSER VERIFICATION:`  
`- Landing — light — pass/fail`  
`- Landing — dark — pass/fail`  
`- Dashboard — light — pass/fail`  
`- Dashboard — dark — pass/fail`  
`- Login — light — pass/fail`  
`- Login — dark — pass/fail`  
`- Theme persists across navigation — pass/fail`  
`- No flash on reload — pass/fail`  
`- SEO heading hierarchy (H1/H2/H3) — pass/fail`  
`- Metadata present per route — pass/fail`

`NOT VERIFIED: ...`

`BLOCKERS: ...`

`NEXT BATCH: ...`

---

## **7\. EXECUTION ORDER (FOR THE USER)**

1. Save this file to `docs/prompts/UI-THEME-SEO-TYPOGRAPHY-MASTER-PROMPT.md`.  
2. Commit it: `docs(ui): add UI theme SEO typography master prompt`.  
3. Run Batch UI-1 first.  
4. Verify in browser — landing, dashboard, login in both themes.  
5. Then Batch UI-2.  
6. Then Batch UI-3.  
7. Only after all three, move back to Batch B of Auth Hardening.

`text`

`---`

`## 4. How to Run This`

`Send this prompt to Antigravity:`

Read docs/prompts/UNIVERSAL-UI-AND-ENGINEERING-PROTOCOL.md  
Read docs/prompts/PROJECT-CONTEXT.md  
Read docs/design/DESIGN-SYSTEM.md  
Read docs/design/THEME-SYSTEM.md  
Read docs/design/SURFACE-HIERARCHY.md  
Read docs/prompts/UI-THEME-SEO-TYPOGRAPHY-MASTER-PROMPT.md

Then execute Batch UI-1 only (Theme Toggle \+ Typography).

Rules:

1. Work item 2.1 (Theme Toggle) first, then 2.2 (Typography).  
2. Inspect first, plan second, implement third, verify fourth.  
3. Commit each file individually with conventional commit messages.  
4. Update the relevant MD file in the same commit as the code change.  
5. Update MIGRATION\_EXECUTION\_LOG.md and .agent-state.md at the end.  
6. Run npm run type-check, npm run lint, npm test, npm run build.  
7. Do NOT push. Wait for my review.  
8. Produce the standard report format.

Begin with 2.1 (Theme Toggle). Report back when both 2.1 and 2.2 are complete.

`text`

`---`

`## 5. Recommendation on Sequencing`

`You have two parallel tracks now:`

`| Track | Current State | Next |`  
`|---|---|---|`  
`| **Auth Hardening (Batch B)** | Item 5 complete, Item 6 + Item 3 pending | Continue after UI work OR before |`  
`| **UI Theme + SEO + Typography** | Not started | Start with Batch UI-1 |`

`**My recommendation:**`   
`1. **First**, push the 16 local commits from Auth Batch B Item 5 (you already verified 489 tests pass, build clean).`  
`2. **Then**, run Batch UI-1 (theme toggle + typography) — this is a quick, visible win that unblocks all future UI work.`  
`3. **Then**, come back to Auth Batch B Item 6 + Item 3.`  
`4. **Then**, Batch UI-2 + UI-3 (SEO).`

`This gives you: theme toggle on the live site in ~1 hour, which solves the exact problem in your screenshot.`

`---`

`## 6. Push Reminder for Batch B Item 5`

`You have **16 local commits** from Batch B Item 5 that are unpushed. Before starting any new batch:`

```` ```bash ````  
`git push origin main && git push deploy main`  
`git ls-remote origin main  # verify`

`git ls-remote deploy main  # verify`

Then run the 6-point production sanity check (login, reload `/login` x10, forgot password, reset with invalid token, invite with temp password, Coolify logs).

If all clean, start Batch UI-1 with the prompt above.  
