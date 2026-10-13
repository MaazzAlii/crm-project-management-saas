# Design System

**Version:** 1.0  
**Last Updated:** 2026-10-13  
**Status:** Living Documentation

---

## 1. Executive Summary

Innoventix uses a dual-engine design token system combining **CSS custom properties** on `:root` and `.dark` with **Tailwind CSS semantic utilities**. 

### Core Principles
1. **Zero Hardcoded Values**: Colors, radii, spacing, elevations, and shadows must resolve through tokens.
2. **First-Class Multi-Theme Support**: Every interface element is built, inspected, and verified in both **Light** and **Dark** modes.
3. **Legibility First**: Glass materials are reserved for chrome (navigation, overlays, dropdowns). Data surfaces (tables, kanban cards, forms) remain 98–100% opaque.
4. **Apple HIG Precision**: Human Interface Guidelines inspired hierarchy: refined typography, fluid borders, subtle inner specular highlights, and natural micro-motion.

---

## 2. Design Tokens

### 2.1 Colors & Surfaces

| Token | Light Mode (`:root`) | Dark Mode (`.dark`) | Purpose |
| :--- | :--- | :--- | :--- |
| `--bg-base` | `#f8fafc` (slate-50) | `#020617` (slate-950) | Default canvas / body background |
| `--bg-elevated` | `#ffffff` (white) | `#0b1120` (slate-900) | Secondary elevated layer |
| `--bg-sunken` | `#f1f5f9` (slate-100) | `#01040f` (deepest base) | Recessed search inputs, wells |
| `--bg-overlay` | `rgba(15, 23, 42, 0.4)` | `rgba(2, 6, 23, 0.8)` | Modal / sheet backdrop |
| `--surface-1` | `#ffffff` (white) | `#0f172a` (slate-900) | Standard cards, list items, tables |
| `--surface-2` | `#f8fafc` (slate-50) | `#1e293b` (slate-800) | Nested cards, secondary panels |
| `--surface-3` | `#f1f5f9` (slate-100) | `#334155` (slate-700) | Highlighted items, hover backgrounds |
| `--surface-glass` | `rgba(255, 255, 255, 0.75)`| `rgba(15, 23, 42, 0.75)` | Chrome surfaces (nav, topbar) |
| `--text-primary` | `#0f172a` (slate-900) | `#f8fafc` (slate-50) | Primary headings & high-emphasis text |
| `--text-secondary`| `#475569` (slate-600) | `#94a3b8` (slate-400) | Body copy, secondary metadata |
| `--text-tertiary` | `#64748b` (slate-500) | `#64748b` (slate-500) | Captions, timestamps, disabled labels |
| `--text-muted` | `#94a3b8` (slate-400) | `#475569` (slate-600) | Placeholder text, subtle hints |
| `--text-inverse` | `#ffffff` | `#020617` | Text on inverted solid accents |
| `--border-subtle` | `rgba(226, 232, 240, 0.8)`| `rgba(30, 41, 59, 0.7)` | Subtle card dividers |
| `--border-default`| `#cbd5e1` (slate-300) | `#334155` (slate-700) | Default borders on inputs & cards |
| `--border-strong` | `#94a3b8` (slate-400) | `#475569` (slate-600) | Active / hovered borders |
| `--border-glass` | `rgba(255, 255, 255, 0.2)`| `rgba(255, 255, 255, 0.08)`| Specular rim highlight on glass |

### 2.1.1 Semantic Text Tokens (Innoventix Color Protocol)

| Token | Light Mode (`:root`) | Dark Mode (`.dark`) | Purpose |
| :--- | :--- | :--- | :--- |
| `--foreground` | `222.2 84% 4.9%` (slate-900) | `210 40% 98%` (slate-50) | Primary body & heading text (`text-foreground`) |
| `--muted-foreground` | `215.4 16.3% 46.9%` (slate-500) | `215 20.2% 65.1%` (slate-400) | Secondary text, captions, labels (`text-muted-foreground`) |
| `--subtle-foreground` | `215 20.2% 65.1%` (slate-400) | `215.4 16.3% 46.9%` (slate-500) | Tertiary text, timestamps, helper text (`text-subtle-foreground`) |
| `--primary` | `238.7 83.5% 58.6%` (indigo-600) | `234.5 89.5% 73.9%` (indigo-400) | Brand accent text & links (`text-primary`) |
| `--primary-foreground` | `0 0% 100%` (white) | `0 0% 100%` (white) | Text on primary backgrounds (`text-primary-foreground`) |
| `--destructive` | `0 72.2% 50.6%` (red-600) | `0 90.6% 70.8%` (red-400) | Error text (`text-destructive`) |
| `--card-foreground` | `222.2 84% 4.9%` (slate-900) | `210 40% 98%` (slate-50) | Text on card surfaces (`text-card-foreground`) |
| `--popover-foreground` | `222.2 84% 4.9%` (slate-900) | `210 40% 98%` (slate-50) | Text on popovers/tooltips (`text-popover-foreground`) |
| `--placeholder` | `215 20.2% 65.1%` (slate-400) | `215.4 16.3% 46.9%` (slate-500) | Input placeholder text (`placeholder:text-placeholder`) |
| `--disabled` | `214.3 31.8% 91.4%` (slate-300) | `215 27.9% 16.9%` (slate-700) | Disabled control text (`text-disabled`) |
| `--brand-gradient-from` | `239 84% 67%` (indigo-500) | `239 84% 77%` (indigo-400) | Theme-aware gradient start |
| `--brand-gradient-to` | `217 91% 60%` (blue-500) | `217 91% 70%` (blue-400) | Theme-aware gradient end |

### 2.2 Brand & Semantic Accents

| Token | Light Mode | Dark Mode | Semantic Meaning |
| :--- | :--- | :--- | :--- |
| `--accent` | `#0284c7` (sky-600) | `#38bdf8` (sky-400) | Primary action & active brand state |
| `--accent-hover` | `#0369a1` (sky-700) | `#0ea5e9` (sky-500) | Interactive hover state |
| `--accent-muted` | `rgba(2, 132, 199, 0.1)` | `rgba(56, 189, 248, 0.15)` | Selected tab / pill background |
| `--accent-fg` | `#ffffff` | `#020617` | Text over accent background |
| `--success` | `#059669` (emerald-600) | `#34d399` (emerald-400) | Won deal, verified status, connected |
| `--success-bg` | `rgba(5, 150, 105, 0.1)` | `rgba(52, 211, 153, 0.15)` | Success badges, callouts |
| `--warning` | `#d97706` (amber-600) | `#fbbf24` (amber-400) | Pending state, warning alert |
| `--warning-bg` | `rgba(217, 119, 6, 0.1)` | `rgba(251, 191, 36, 0.15)` | Warning badges, callouts |
| `--danger` | `#e11d48` (rose-600) | `#fb7185` (rose-400) | Destructive action, error, lost deal |
| `--danger-bg` | `rgba(225, 29, 72, 0.1)` | `rgba(251, 113, 133, 0.15)` | Error alerts, danger badges |

### 2.3 Typography Scale

- **Font Family Sans**: `var(--font-geist-sans), system-ui, -apple-system, BlinkMacSystemFont, sans-serif` (`GeistSans`)
- **Font Family Mono**: `var(--font-geist-mono), ui-monospace, monospace` (`GeistMono`)
- **Typography Primitive**: `<Text variant="h1" | "h2" | "h3" | "h4" | "body" | "body-lg" | "caption" | "label" | "code">` in `components/ui/text.tsx`

| Scale Token | Font Size | Line Height | Letter Spacing | Common Use |
| :--- | :--- | :--- | :--- | :--- |
| `--text-xs` | `12px` (0.75rem) | `16px` (1.33) | `+0.01em` | Badges, timestamps, small tags |
| `--text-sm` | `13px` (0.8125rem) | `18px` (1.38) | `0` | Table cells, secondary body copy |
| `--text-base` | `14px` (0.875rem) | `22px` (1.5) | `-0.01em` | Standard app paragraphs, forms |
| `--text-md` | `16px` (1.0rem) | `24px` (1.5) | `-0.01em` | Marketing body copy |
| `--text-lg` | `18px` (1.125rem)| `26px` (1.44) | `-0.015em` | Card titles, modal headers |
| `--text-xl` | `20px` (1.25rem) | `28px` (1.4) | `-0.02em` | Section headers |
| `--text-2xl` | `24px` (1.5rem) | `32px` (1.33) | `-0.025em` | Page titles |
| `--text-3xl` | `30px` (1.875rem)| `38px` (1.26) | `-0.03em` | Metric values, dashboard stats |
| `--text-4xl` | `36px` (2.25rem) | `44px` (1.22) | `-0.035em` | Section hero display |
| `--text-5xl` | `48px` (3.0rem) | `56px` (1.16) | `-0.04em` | Major page hero displays |
| `--text-6xl` | `60px` (3.75rem) | `68px` (1.13) | `-0.045em` | Large display numbers |

### 2.4 Spacing Scale (4px Base)

`--space-1`: 4px | `--space-2`: 8px | `--space-3`: 12px | `--space-4`: 16px | `--space-5`: 20px | `--space-6`: 24px | `--space-8`: 32px | `--space-10`: 40px | `--space-12`: 48px | `--space-16`: 64px.

### 2.5 Radii Scale

- `--radius-sm`: `6px` (Chips, small badge elements)
- `--radius-md`: `10px` (Inputs, buttons, small dropdown menus)
- `--radius-lg`: `14px` (Cards, panels, modal dialogs)
- `--radius-xl`: `20px` (Outer containers, large surfaces)
- `--radius-full`: `9999px` (Pills, user avatars, status dots)

### 2.6 Shadows & Elevation

- `--shadow-sm`: `0 1px 2px 0 rgba(0, 0, 0, 0.05)`
- `--shadow-md`: `0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.06)`
- `--shadow-lg`: `0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.08)`
- `--shadow-xl`: `0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)`
- `--shadow-glow`: `0 0 20px -2px rgba(56, 189, 248, 0.25)`

### 2.7 Focus Rings & Accessibility

- `--focus-ring-color`: `var(--accent)`
- `--focus-ring-width`: `2px`
- `--focus-ring-offset`: `2px`

---

## 3. Related Files

- `docs/design/THEME-SYSTEM.md`
- `docs/design/SURFACE-HIERARCHY.md`
- `docs/design/MOTION-GUIDELINES.md`
- `docs/engineering/COMPONENT-LIBRARY.md`
