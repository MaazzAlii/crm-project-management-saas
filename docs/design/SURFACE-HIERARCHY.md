# Surface Hierarchy

**Version:** 1.0  
**Last Updated:** 2026-10-13  
**Status:** Living Documentation

---

## 1. Elevation & Material Scale

In a data-dense CRM and project management platform, visual layering must enhance focus rather than impede readability. We establish a strict 5-level surface architecture:

| Level | Name | Material | Opacity | Blur | Used For |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **0** | **Base Canvas** | Solid | 100% | None | Page background, root layout canvas |
| **1** | **Elevated** | Solid / Near-opaque | 98–100% | None | Tables, kanban columns, deal cards, task rows, form inputs, metric cards |
| **2** | **Floating** | Subtle Glass | 80–85% | 12–16px | Context menus, dropdown menus, popovers, tooltips |
| **3** | **Overlay** | Prominent Glass | 65–75% | 24–40px | Modals, slide-over sheets, detail drawers, dialog backdrops |
| **4** | **Chrome** | Glass Chrome | 70–80% | 20–24px | Fixed Sidebar, sticky Topbar, floating action bars |

---

## 2. Non-Negotiable Surface Rules

1. **Glass is Chrome, Not Data**:
   - Complex data entities (clients table, deal cards, financial summaries, timeline gantt bars) **must never use transparent or blurred glass backgrounds**. Transparency behind dense text destroys legibility and causes cognitive fatigue.
   - All Level 1 surfaces use solid `--surface-1` or `--surface-2` tokens.
2. **Backdrop-Filter Budget**:
   - Limit active `backdrop-filter` surfaces to a maximum of **5–7 simultaneous instances** per viewport to guarantee 60fps performance on mobile and mid-range devices.
3. **Specular Rim Lighting**:
   - Glass surfaces must feature a subtle, directional inner border highlight (`--border-glass`: 1px solid with top highlight) to simulate physical Apple-style liquid glass.
4. **Legibility Over Contrast Threshold**:
   - Any text rendered across an elevation boundary must maintain a minimum 4.5:1 WCAG AA contrast ratio against the composite rendered background.

---

## 3. Related Files

- `docs/design/DESIGN-SYSTEM.md`
- `docs/design/THEME-SYSTEM.md`
- `docs/design/MOTION-GUIDELINES.md`
