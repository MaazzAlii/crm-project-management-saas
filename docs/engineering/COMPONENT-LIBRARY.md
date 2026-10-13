# Component Library

**Version:** 1.0  
**Last Updated:** 2026-10-13  
**Status:** Living Documentation

---

## 1. Overview

The Innoventix Shared Component Library (`components/ui/` and `components/shared/`) standardizes atomic UI primitives and complex composite patterns across all modules.

Every component guarantees:
- Full support for both **Light Mode** and **Dark Mode** via design tokens.
- Strict WCAG 2.1 AA contrast compliance (4.5:1 body, 3:1 large).
- Keyboard accessibility with visible focus rings (`--focus-ring-color`).
- Minimum touch targets of 44 × 44px on mobile viewports.

---

## 2. UI Primitives

| Component | Variants | Sizes | Key Props / Behaviors |
| :--- | :--- | :--- | :--- |
| `Button` | `primary`, `secondary`, `ghost`, `outline`, `danger` | `sm`, `md`, `lg` | `isLoading`, `leftIcon`, `rightIcon`, full keyboard focus |
| `Input` | `default`, `filled`, `error` | `sm`, `md`, `lg` | `error`, `helperText`, `leftElement`, `rightElement`, accessible `aria-invalid` |
| `Textarea` | `default`, `error` | `sm`, `md`, `lg` | Resizable or auto-expanding, character limit indicator |
| `Select` | `default`, `error` | `sm`, `md`, `lg` | Native or custom popover select with chevron indicator |
| `Checkbox` | `default`, `accent` | `sm`, `md` | Indeterminate state support, accessible label binding |
| `Badge` / `Chip` | `default`, `success`, `warning`, `danger`, `accent` | `xs`, `sm` | Status indicator, dot indicator, optional remove trigger |
| `Avatar` | `circle`, `rounded` | `xs`, `sm`, `md`, `lg` | Image with fallback initials generator |
| `Skeleton` | `text`, `circular`, `rectangular` | Fluid | Shimmer animation respecting `prefers-reduced-motion` |

---

## 3. Composite Components

| Component | Elevation | Material | Behaviors |
| :--- | :--- | :--- | :--- |
| `Card` | Level 1 | Opaque / Solid | `CardHeader`, `CardContent`, `CardFooter`, subtle hover border |
| `Modal` / `Dialog` | Level 3 | Prominent Glass | Focus trap, escape key dismissal, accessible `role="dialog"` |
| `DropdownMenu` | Level 2 | Subtle Glass | Origin-aware spring reveal, arrow key navigation |
| `Table` | Level 1 | Opaque / Solid | Zebra striping, pinned columns, sortable headers, responsive wrapper |
| `Tabs` | Level 1 | Subtle Glass pill | Segmented control with smooth active slider indicator |
| `EmptyState` | Level 1 | Solid Well | Icon container, headline, description, call-to-action button |
| `PasswordStrengthMeter` | Inline | Animated segments | 5-tier strength score, inline requirement checklist |

---

## 4. Implementation Rules

1. **No Ad-Hoc Styling**: Components must not import hardcoded Tailwind slate colors or custom raw hex codes. All styling references CSS Custom Properties.
2. **Compound Component Pattern**: Complex composites expose structured sub-components (`<Modal.Header>`, `<Modal.Body>`, `<Modal.Footer>`) to keep call sites expressive and readable.
3. **Preserve Native Props**: Input and Button components forward `ref` and inherit full native HTML attributes (`HTMLButtonElement`, `HTMLInputElement`).

---

## 5. Related Files

- `docs/design/DESIGN-SYSTEM.md`
- `docs/design/THEME-SYSTEM.md`
- `docs/design/SURFACE-HIERARCHY.md`
- `docs/engineering/CODING-STANDARDS.md`
