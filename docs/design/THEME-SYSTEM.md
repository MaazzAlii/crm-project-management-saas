# Theme System

**Version:** 1.0  
**Last Updated:** 2026-10-13  
**Status:** Living Documentation

---

## 1. Architecture

The theme architecture guarantees zero flash of unstyled content (FOUC), instant transitions, and complete multi-theme capability across all pages and layouts.

### 1.1 Token Layer
- Default light-mode tokens are declared on the `:root` pseudo-class in `app/globals.css`.
- Dark-mode token overrides are bound to `.dark` (and `[data-theme="dark"]`).
- Optional high-contrast mode overrides are declared under `[data-theme="high-contrast"]`.

### 1.2 Anti-Flash Pre-Paint Script (SSR)
To eliminate any visual flash on page reload, an inline `<script>` is placed in `<head>` before any body content renders:
```html
<script>
  (function() {
    try {
      var saved = localStorage.getItem('theme');
      var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (saved === 'dark' || (!saved && prefersDark)) {
        document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.setAttribute('data-theme', 'light');
      }
    } catch (e) {}
  })();
</script>
```

### 1.3 State Management & Hook
- `ThemeProvider` manages active state (`'light' | 'dark' | 'system'`).
- A lightweight `useTheme()` hook exposes:
  - `theme`: current resolved theme (`'light' | 'dark'`)
  - `mode`: selected preference (`'light' | 'dark' | 'system'`)
  - `setTheme(mode)`: updates localStorage and DOM class
  - `toggle()`: flips between light and dark

---

## 2. Resolution Order

1. **Explicit User Selection**: Read from `localStorage.getItem('theme')`.
2. **System Preference**: `window.matchMedia('(prefers-color-scheme: dark)')` listener if user hasn't explicitly set a preference.
3. **Default Fallback**: Light mode (`:root`).

---

## 3. UI Controls & Topbar Toggle

- **Location**: Topbar right-hand action bar, adjacent to the Notification Center and Account Menu.
- **Affordance**: 3-state segmented control or cyclic button (`Sun` -> `Moon` -> `Monitor/Auto`).
- **Icons**: `Sun`, `Moon`, `Laptop` from `lucide-react`.
- **Keyboard Navigation**: Fully accessible with tab focus, aria-label, and keyboard space/enter triggers.

---

## 4. Email & External Surface Rules

- Transactional emails generated via `lib/email/templates.ts` use dual-theme inline styles with `@media (prefers-color-scheme: dark)` overrides to ensure crisp readability in Apple Mail, Gmail, and Outlook.

---

## 5. Related Files

- `docs/design/DESIGN-SYSTEM.md`
- `docs/design/SURFACE-HIERARCHY.md`
- `app/globals.css`
- `components/shell/Topbar.tsx`
