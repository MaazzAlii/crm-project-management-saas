# Theme System

**Version:** 1.1  
**Last Updated:** 2026-10-13  
**Status:** Living Documentation

---

## 1. Architecture

The theme architecture guarantees zero flash of unstyled content (FOUC), instant transitions, and complete multi-theme capability across all pages and layouts (Marketing, Dashboard Shell, Client Portal, Auth, and Super Admin).

### 1.1 Token Layer (`app/globals.css`)
- Default light-mode tokens are declared on the `:root` pseudo-class in `app/globals.css`.
- Dark-mode token overrides are bound to `.dark` and `[data-theme="dark"]`.
- The following CSS variables are standardized across the application:
  - **Surfaces**: `--bg-base`, `--bg-elevated`, `--bg-sunken`, `--bg-overlay`, `--surface-1`, `--surface-2`, `--surface-3`, `--surface-glass`
  - **Text (Core)**: `--text-primary`, `--text-secondary`, `--text-tertiary`, `--text-muted`, `--text-inverse`
  - **Semantic Text Tokens (`INNOVENTIX-COLOR-TYPOGRAPHY-PROTOCOL.md`)**: `--foreground`, `--muted-foreground`, `--subtle-foreground`, `--primary`, `--primary-foreground`, `--destructive`, `--card-foreground`, `--popover-foreground`, `--placeholder`, `--disabled`
  - **Brand Gradients**: `--brand-gradient-from`, `--brand-gradient-to`
  - **Borders**: `--border-subtle`, `--border-default`, `--border-strong`, `--border-glass`
  - **Brand & Accents**: `--accent`, `--accent-hover`, `--accent-muted`, `--accent-fg`
  - **Status**: `--success`, `--success-bg`, `--warning`, `--warning-bg`, `--danger`, `--danger-bg`
  - **Elevation & Radius**: `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-xl`, `--shadow-glow`, `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl`, `--radius-full`
  - **Type Scale**: `--text-xs` (12px), `--text-sm` (13px), `--text-base` (14px), `--text-md` (16px), `--text-lg` (18px), `--text-xl` (20px), `--text-2xl` (24px), `--text-3xl` (30px), `--text-4xl` (36px), `--text-5xl` (48px), `--text-6xl` (60px)

### 1.2 Anti-Flash Pre-Paint Script (SSR)
To eliminate any visual flash on page reload, an inline `<script>` is placed in `<head>` before any body content renders:
```html
<script dangerouslySetInnerHTML={{
  __html: `(function(){try{var t=localStorage.getItem('theme');var d=window.matchMedia('(prefers-color-scheme: dark)').matches;if(t==='dark'||(!t&&d)){document.documentElement.classList.add('dark');document.documentElement.setAttribute('data-theme','dark')}else{document.documentElement.classList.remove('dark');document.documentElement.setAttribute('data-theme','light')}}catch(e){}})()`
}} />
```

### 1.3 State Management & Hook (`components/providers/theme-provider.tsx`)
- `ThemeProvider` manages active state (`'light' | 'dark' | 'system'`).
- A lightweight `useTheme()` hook exposes:
  - `theme`: current resolved theme (`'light' | 'dark'`)
  - `mode`: selected preference (`'light' | 'dark' | 'system'`)
  - `setTheme(mode)`: updates localStorage and DOM class/attribute
  - `toggle()`: flips between light and dark

---

## 2. Resolution Order

1. **Explicit User Selection**: Read from `localStorage.getItem('theme')` (`'light'` or `'dark'`).
2. **System Preference**: `window.matchMedia('(prefers-color-scheme: dark)')` listener if user hasn't explicitly set a preference or chose `'system'`.
3. **Default Fallback**: Light mode (`:root`).

---

## 3. UI Controls & Topbar Toggle

- **Location**: Topbar right-hand action bar, Landing nav header, Auth screen corner, Client Portal nav, Super Admin nav.
- **Affordance**: 3-state segmented control or interactive toggle (`Sun`, `Moon`, `Monitor`).
- **Icons**: `Sun`, `Moon`, `Monitor` from `lucide-react`.
- **Keyboard Navigation**: Fully accessible with tab focus, `role="switch"` or segmented buttons, `aria-label="Toggle theme"`, keyboard space/enter triggers.

---

## 4. Email & External Surface Rules

- Transactional emails generated via `lib/email/templates.ts` use dual-theme inline styles with `@media (prefers-color-scheme: dark)` overrides to ensure crisp readability in Apple Mail, Gmail, and Outlook.

---

## 5. Related Files

- `docs/design/DESIGN-SYSTEM.md`
- `docs/design/SURFACE-HIERARCHY.md`
- `app/globals.css`
- `components/providers/theme-provider.tsx`
- `components/ui/theme-toggle.tsx`
- `components/shell/Topbar.tsx`
