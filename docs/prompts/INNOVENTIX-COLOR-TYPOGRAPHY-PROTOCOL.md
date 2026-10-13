0. WHY THIS FILE EXISTS
The Batch UI-1 session shipped a landing page where the hero <h1> had text-white hardcoded. In dark mode it looked fine; in light mode it was white text on a near-white background — invisible. This was only caught because a real Playwright browser session was finally run. That should never happen again.

This file is the permanent rulebook for how text colors work in Innoventix. Every session that touches UI must read this file and follow it. Any commit that violates these rules is a bug.

1. MANDATORY READING (add to session startup)
Every UI-touching session must read, in order:

docs/prompts/UNIVERSAL-MASTER-PROMPT.md

docs/prompts/INNOVENTIX-COLOR-TYPOGRAPHY-PROTOCOL.md ← this file

docs/design/DESIGN-SYSTEM.md

docs/design/THEME-SYSTEM.md

docs/design/SURFACE-HIERARCHY.md

docs/engineering/COMPONENT-LIBRARY.md

.agent-state.md

If any of these are missing or stale, stop and ask before writing code.

2. THE THREE HARD RULES
Rule 1 — Never hardcode a text color
Banned:

tsx
<h1 className="text-white">…</h1>
<p className="text-black">…</p>
<span style={{ color: '#fff' }}>…</span>
<h2 className="text-[#0f172a]">…</h2>
Allowed:

tsx
<h1 className="text-foreground">…</h1>
<p className="text-muted-foreground">…</p>
<span className="text-primary">…</span>
Every text color must resolve from a semantic token that is defined for both light and dark mode in app/globals.css. If the token you need doesn't exist, add it to globals.css first, then use it.

Rule 2 — Every text surface must be verified in BOTH themes
Before any UI batch is marked "complete," every changed surface must be visually confirmed in:

Light mode — text readable, no white-on-white, no gray-on-gray

Dark mode — text readable, no black-on-black, no low-contrast gray

System preference — respects OS setting

After 5 reloads — no flash, no theme loss

Screenshots are required evidence. "It looks fine" without a screenshot is not verification.

Rule 3 — If a color is hardcoded anywhere, it's a bug
Run this grep before every commit:

bash
grep -rn "text-white\|text-black\|text-\[#\|text-\[rgb\|color: *#\|color: *rgb" \
  app/ components/ \
  --include="*.tsx" --include="*.ts" \
  | grep -v "dark:text-white" \
  | grep -v "// eslint-disable"
Any hit is either:

(a) a legitimate exception (e.g., a colored button's white label on a known dark background) — must have an inline comment explaining why

(b) a bug — must be replaced with a semantic token

If you can't justify it in a comment, fix it.

3. THE SEMANTIC TEXT TOKEN SYSTEM
These tokens must be defined in app/globals.css under :root (light) and .dark (dark). If any are missing, add them.

3.1 — Required tokens
Token	Purpose	Light value	Dark value
--foreground	Primary body & heading text	slate-900 #0f172a	slate-50 #f8fafc
--muted-foreground	Secondary text, captions, labels	slate-500 #64748b	slate-400 #94a3b8
--subtle-foreground	Tertiary text, timestamps, helper text	slate-400 #94a3b8	slate-500 #64748b
--primary	Brand accent text & links	indigo-600 #4f46e5	indigo-400 #818cf8
--primary-foreground	Text on primary-colored backgrounds	white	white
--destructive	Error text	red-600 #dc2626	red-400 #f87171
--success	Success text	emerald-600 #059669	emerald-400 #34d399
--warning	Warning text	amber-600 #d97706	amber-400 #fbbf24
--card-foreground	Text on card surfaces	slate-900	slate-50
--popover-foreground	Text on popovers/tooltips	slate-900	slate-50
--placeholder	Input placeholder text	slate-400	slate-500
--disabled	Disabled control text	slate-300	slate-600
3.2 — Tailwind mapping
In tailwind.config.ts, every token must be exposed:

ts
colors: {
  foreground: 'hsl(var(--foreground))',
  'muted-foreground': 'hsl(var(--muted-foreground))',
  'subtle-foreground': 'hsl(var(--subtle-foreground))',
  primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
  destructive: 'hsl(var(--destructive))',
  success: 'hsl(var(--success))',
  warning: 'hsl(var(--warning))',
  'card-foreground': 'hsl(var(--card-foreground))',
  'popover-foreground': 'hsl(var(--popover-foreground))',
  placeholder: 'hsl(var(--placeholder))',
  disabled: 'hsl(var(--disabled))',
}
3.3 — Usage rules
Where	Use this token
Page title (H1)	text-foreground
Section title (H2/H3)	text-foreground
Body paragraph	text-foreground or text-muted-foreground
Caption / helper text	text-muted-foreground
Timestamp / meta	text-subtle-foreground
Link	text-primary hover:text-primary/80
Button (primary)	text-primary-foreground
Button (ghost/outline)	text-foreground
Error message	text-destructive
Success message	text-success
Warning message	text-warning
Input text	text-foreground
Input placeholder	placeholder:text-placeholder
Disabled control	text-disabled
Table header	text-muted-foreground font-medium
Table body	text-foreground
Badge (default)	text-foreground
Badge (accent)	text-primary
Never use: text-white, text-black, text-slate-500, text-gray-600, or any raw Tailwind palette color on text, unless it's inside a component where the background is fixed and known (e.g., a solid brand-colored button), and even then only with an inline comment justifying it.

4. THE GRADIENT-AND-BRAND-TEXT EXCEPTION
Innoventix uses gradient headings on the landing page (e.g., "One Unified Workspace" in indigo→blue gradient). These are allowed only when:

The gradient is defined as a token (--brand-gradient-from, --brand-gradient-to) so it can be swapped per theme.

In light mode: gradient uses dark, saturated stops (indigo-600 → blue-600).

In dark mode: gradient uses lighter, brighter stops (indigo-400 → blue-400).

The gradient text is verified for AA contrast against both bg-background (light) and bg-background (dark).

Banned: bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-blue-400 without theme-aware stops. That combination fails in light mode (light stops on white background).

Correct pattern:

tsx
<span className="bg-gradient-to-r from-[hsl(var(--brand-gradient-from))] to-[hsl(var(--brand-gradient-to))] bg-clip-text text-transparent">
  One Unified Workspace
</span>
With tokens in globals.css:

css
:root {
  --brand-gradient-from: 239 84% 67%;  /* indigo-500 light-friendly */
  --brand-gradient-to:   217 91% 60%;  /* blue-500 */
}
.dark {
  --brand-gradient-from: 239 84% 77%;  /* indigo-400 brighter */
  --brand-gradient-to:   217 91% 70%;  /* blue-400 */
}
5. PREMIUM & PROFESSIONAL COLOR PAIRINGS
"Premium" in a B2B SaaS does not mean saturated or neon. It means:

5.1 — Restraint
One accent color (indigo). Everything else is neutral.

No more than two grays in a single view (e.g., slate-500 for muted + slate-900 for primary).

No more than three total text colors on any one screen.

5.2 — Hierarchy through weight, not color
H1: text-foreground font-semibold tracking-tight

H2: text-foreground font-semibold

H3: text-foreground font-medium

Body: text-foreground font-normal

Caption: text-muted-foreground font-normal text-sm

Meta: text-subtle-foreground font-normal text-xs

Achieve hierarchy with size and weight first, color second.

5.3 — Contrast ratios (WCAG AA minimum, AAA preferred)
Pair	Minimum ratio	Target
Body text on background	4.5:1	7:1
Large heading on background	3:1	4.5:1
Muted text on background	4.5:1	4.5:1
Subtle text on background	3:1 (decorative only)	4.5:1
Link on background	4.5:1	7:1
Button label on button bg	4.5:1	7:1
Verify with the WebAIM contrast checker or axe DevTools before committing.

5.4 — Never do these
❌ Pure black (#000) on pure white (#fff) — too harsh. Use slate-900 on slate-50.

❌ Pure white on pure black — same reason. Use slate-50 on slate-950.

❌ Gray text on gray background (text-slate-500 on bg-slate-100) — fails contrast.

❌ Colored text on colored background (text-indigo-400 on bg-indigo-100) — muddies.

❌ Gradient text in light mode using light stops — invisible.

❌ Placeholder text as the only label — accessibility failure.

5.5 — The "premium" baseline
Every surface should look intentional in both themes:

Element	Light mode	Dark mode
Page background	bg-slate-50	bg-slate-950
Card surface	bg-white with border-slate-200	bg-slate-900 with border-slate-800
Primary text	text-slate-900	text-slate-50
Secondary text	text-slate-600	text-slate-400
Subtle text	text-slate-400	text-slate-500
Accent	text-indigo-600	text-indigo-400
Shadow	shadow-sm	shadow-none (borders carry weight)
These map 1:1 to the tokens in Section 3.

6. ENFORCEMENT WORKFLOW (every UI commit)
Before committing any file that touches UI:

bash
# 1. Check for hardcoded text colors
grep -rn "text-white\|text-black\|text-\[#\|text-\[rgb" app/ components/ --include="*.tsx"

# 2. Check for hardcoded inline colors
grep -rn "color: *['\"]#\|color: *['\"]rgb" app/ components/ --include="*.tsx" --include="*.ts"

# 3. Check for un-themed gradients
grep -rn "bg-clip-text text-transparent" app/ components/ --include="*.tsx"

# 4. Check for raw palette colors on text
grep -rn "className=\"[^\"]*text-slate-\|className=\"[^\"]*text-gray-\|className=\"[^\"]*text-zinc-" app/ components/ --include="*.tsx"
Any hit requires:

Either an inline // intentional: <reason> comment, or

Replacement with a semantic token

If the file passes all four greps (or every hit is justified), it can be committed.

7. THE VERIFICATION CHECKLIST (every UI batch)
Before marking a UI batch complete, run this and attach screenshots:

text
[ ] Read INNOVENTIX-COLOR-TYPOGRAPHY-PROTOCOL.md
[ ] All text uses semantic tokens (grep clean)
[ ] No `text-white` / `text-black` outside justified exceptions
[ ] No hardcoded hex/rgb text colors
[ ] Gradients use theme-aware token stops
[ ] Every changed surface screenshotted in LIGHT mode
[ ] Every changed surface screenshotted in DARK mode
[ ] Ran 5× reload in each theme — no flash
[ ] Navigated across 3+ routes in each theme — theme persists
[ ] Contrast checked with WebAIM or axe for any new color pair
[ ] Font resolves to Geist (window.getComputedStyle check)
[ ] No fallback fonts appearing (Arial/Segoe in DevTools)
[ ] DESIGN-SYSTEM.md updated if tokens changed
[ ] THEME-SYSTEM.md updated if tokens changed
If any box is unchecked, the batch is not complete. Report honestly.

8. THE REAL-BROWSER TEST SUITE
Extend scripts/test-real-browser-e2e.ts (already created) to cover:

Landing page — light + dark screenshots, hero contrast check

Login page — light + dark, form input readability

Signup page — light + dark

Reset password — light + dark, error state readable

Dashboard — light + dark, table & stat card readability

Projects / Clients — light + dark, list & detail views

Settings — light + dark, form readability

Super admin — light + dark

Client portal — light + dark

For each page, the test must assert:

document.documentElement.classList.contains('dark') matches the toggle state

Computed color on h1, h2, body is not rgb(255,255,255) in light mode

Computed color on h1, h2, body is not rgb(0,0,0) in dark mode

Font family resolves to Geist (no Arial / Segoe / Roboto)

Any failure blocks the batch.

9. THE COMMON FAILURE PATTERNS (learned the hard way)
These are the mistakes that already happened or are likely to happen. Do not repeat them.

Pattern	Why it fails	Correct approach
<h1 className="text-white">	Invisible in light mode	text-foreground
bg-clip-text text-transparent from-indigo-400	Light stops invisible on white	Theme-aware gradient tokens
style={{ color: '#333' }}	Ignores dark mode	Semantic token
text-slate-500 for muted	Too dark for light, too light for dark reuse	text-muted-foreground
Placeholder same color as value	Can't tell filled vs empty	placeholder:text-placeholder
Disabled button same color as enabled	No state feedback	text-disabled + opacity-50
Input border invisible in dark	Fails discovery	border-input token per theme
Table zebra stripes as bg-slate-50	Wrong in dark mode	bg-muted token
Chart axis labels hardcoded	Unreadable in one theme	stroke="currentColor" + text-muted-foreground
Shadow-heavy light theme copied to dark	Muddy in dark	Dark mode uses borders, not shadows
10. THE PROJECT OVERRIDES (Section 15 values for this repo)
text
[PROJECT_NAME]: Innoventix Platform
[STACK]: Next.js 15 App Router + TypeScript + Tailwind + PostgreSQL + Drizzle
[LIVE_URL]: https://project-manager.calara.agency
[PRIMARY_REMOTE]: origin (MaazzAlii/crm-project-management-saas)
[SECONDARY_REMOTE]: deploy (Urk-Khan/Project-Management-CRM)
[PACKAGE_MANAGER]: npm
[TEST_COMMAND]: npm test
[LINT_COMMAND]: npm run lint
[TYPECHECK_COMMAND]: npm run type-check
[BUILD_COMMAND]: npm run build
[EXPECTED_ROUTE_COUNT]: 140

PROJECT-SPECIFIC RULES:
- Light mode default is slate-50 background, dark mode default is slate-950.
- Brand accent is indigo. No other accent color without an ADR.
- Geist Sans is primary; Geist Mono is for IDs, currency, timestamps, and log output.
- Every surface must be verified in a real Chromium session (Playwright) before commit.
- The `text-white` class is banned outside justified exceptions with inline comments.
- Gradient headings must use `--brand-gradient-from/to` tokens defined in globals.css.
- Screenshots of every UI change in both themes are required evidence in the batch report.
11. HOW TO INSTALL THIS INSTRUCTION
Save this file as docs/prompts/INNOVENTIX-COLOR-TYPOGRAPHY-PROTOCOL.md.

Commit:

bash
git add docs/prompts/INNOVENTIX-COLOR-TYPOGRAPHY-PROTOCOL.md
git commit -m "docs(prompts): add project-specific color and typography protocol"
Update .agent-state.md to reference this file in the session startup list.

At the start of every UI session, paste this to the agent:

Read, in order:

docs/prompts/UNIVERSAL-MASTER-PROMPT.md
docs/prompts/INNOVENTIX-COLOR-TYPOGRAPHY-PROTOCOL.md
docs/design/DESIGN-SYSTEM.md
docs/design/THEME-SYSTEM.md
.agent-state.md
Then confirm you have read all five. State which section of the Color/Typography Protocol applies to this session's work. Wait for my approval before writing code.

Before every UI commit, run the greps in Section 6.

Before every UI batch report, run the checklist in Section 7 and attach screenshots.

12. THE ONE-PARAGRAPH VERSION
Every text color in Innoventix comes from a semantic token that has a defined value in both :root and .dark. text-white, text-black, hex codes, and raw Tailwind palette colors on text are banned unless justified in an inline comment. Gradient headings use theme-aware token stops. Every UI change is verified in a real Chromium browser in both themes with screenshots before commit. Hierarchy comes from size and weight, not from color. The result should look premium and intentional in both modes — never like a dark theme that was retro-fitted onto a light design.

End of Innoventix Color & Typography Protocol.