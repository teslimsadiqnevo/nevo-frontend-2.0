/**
 * Design System v2 §8 — Elevation & Depth (Level 0–3).
 *
 * Shadows are tinted with Near Black (#2b2b2f → rgb(43,43,47)), not pure black.
 * Level 3 is reserved for the Break Module and alerts (see UI/UX spec & FE
 * Architecture Section 5).
 *
 * Mirrored into Tailwind as `--shadow-elevation-*` in globals.css, giving
 * `shadow-elevation-1`, `shadow-elevation-2`, `shadow-elevation-3`.
 */
export const elevation = {
  /** Level 0 — backgrounds, flush. */
  0: "none",
  /** Level 1 — cards, inputs. */
  1: "0px 1px 3px rgba(43, 43, 47, 0.08)",
  /** Level 2 — floating elements, modals, sheets. */
  2: "0px 4px 12px rgba(43, 43, 47, 0.12)",
  /** Level 3 — break module, alerts. */
  3: "0px 8px 24px rgba(43, 43, 47, 0.16)",
} as const;

export type ElevationLevel = keyof typeof elevation;
