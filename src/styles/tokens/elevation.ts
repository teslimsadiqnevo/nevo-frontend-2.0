/**
 * Design System v2 §8 — Elevation & Depth (Level 0–3).
 *
 * Values match the concrete Component Library design (no white, no gradients —
 * elevation is the only thing separating surface levels). Level 3 is reserved
 * for the Break Module and alerts (see UI/UX spec & FE Architecture Section 5).
 *
 * Mirrored into Tailwind as `--shadow-elevation-*` in globals.css, giving
 * `shadow-elevation-1`, `shadow-elevation-2`, `shadow-elevation-3`.
 */
export const elevation = {
  /** Level 0 — backgrounds, flush. */
  0: "none",
  /** Level 1 — cards, inputs, buttons at rest. */
  1: "0 2px 8px rgba(0, 0, 0, 0.06)",
  /** Level 2 — floating elements, modals, sheets, primary cards. */
  2: "0 4px 16px rgba(0, 0, 0, 0.10)",
  /** Level 3 — break module, alerts. */
  3: "0 8px 32px rgba(0, 0, 0, 0.16)",
} as const;

export type ElevationLevel = keyof typeof elevation;
