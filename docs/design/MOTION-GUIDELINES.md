# Motion Guidelines

**Version:** 1.0  
**Last Updated:** 2026-10-13  
**Status:** Living Documentation

---

## 1. Principles

1. **Purposeful & Informative**: Motion communicates spatial hierarchy, state transitions, and user causality. We never add animation purely for decorative ornament.
2. **Snappy & High Performance**: Transitions feel instantaneous. We avoid sluggish delays that slow down power users performing CRM and pipeline operations.
3. **Hardware Accelerated Only**: Never animate properties that trigger browser layout recalculations (`width`, `height`, `top`, `left`, `margin`, `padding`). Animate exclusively `transform`, `opacity`, and `filter`.

---

## 2. Timing & Easing Scale

### 2.1 Durations
- **Fast (`--duration-fast`: 150ms)**: Micro-interactions, button hover states, focus indicators, tag selections, checkbox toggles.
- **Base (`--duration-base`: 220ms)**: Context dropdowns, tooltips, tab panel switches, popovers.
- **Slow (`--duration-slow`: 320ms)**: Modal entrances, slide-over detail panels, full page transitions, kanban card position settlements.

### 2.2 Easings
- **Standard (`--ease-standard`)**: `cubic-bezier(0.4, 0, 0.2, 1)` — Default smooth motion for neutral transitions.
- **Emphasis / Entrance (`--ease-emphasis`)**: `cubic-bezier(0.22, 1, 0.36, 1)` — Apple-style spring-like deceleration curve for elements entering the screen.
- **Exit (`--ease-exit`)**: `cubic-bezier(0.4, 0, 1, 1)` — Accelerated exit curve for elements dismissing or closing.

---

## 3. Mandatory Accessibility & Reduced Motion

Every animated CSS rule must strictly honor user preferences:
```css
@media (prefers-reduced-motion: reduce) {
  *, ::before, ::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```
When reduced motion is active, modal and dropdown reveals collapse to instant opacity switches without translation or scale transforms.

---

## 4. Related Files

- `docs/design/DESIGN-SYSTEM.md`
- `docs/design/SURFACE-HIERARCHY.md`
