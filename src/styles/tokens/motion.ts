/**
 * Design System v2 §10 — Motion Design (timing & easing).
 *
 * Action type              Duration     Easing
 * -----------------------  -----------  -----------------------
 * Micro feedback           100–150ms    ease-out
 * Content transitions      300–400ms    ease-in-out
 * Screen transitions       250–350ms    ease-in-out
 * Adaptation moments       400–500ms    ease-in-out, slower
 * Break module entry/exit  500–600ms    ease-in-out, calm
 *
 * Never gets motion: comprehension check results, looping decorative backgrounds.
 *
 * Easings are exposed to Tailwind as `--ease-*` in globals.css (e.g. `ease-calm`).
 * Durations are exposed as CSS custom properties on :root (e.g.
 * `var(--duration-adaptation)`), usable via arbitrary values like
 * `duration-[var(--duration-adaptation)]`.
 */
export const duration = {
  /** Micro feedback — taps, toggles (100–150ms). */
  micro: "125ms",
  /** Screen transitions — route/screen changes (250–350ms). */
  screen: "300ms",
  /** Content transitions — in-view content swaps (300–400ms). */
  content: "350ms",
  /** Adaptation moments — mid-lesson adaptation, slower (400–500ms). */
  adaptation: "450ms",
  /** Break module entry/exit — calm (500–600ms). */
  breakEntry: "550ms",
} as const;

export const easing = {
  /** Micro feedback. */
  out: "cubic-bezier(0, 0, 0.2, 1)",
  /** Standard content/screen transitions. */
  inOut: "cubic-bezier(0.4, 0, 0.2, 1)",
  /** Calm, gentle deceleration — break entry / adaptation. */
  calm: "cubic-bezier(0.22, 1, 0.36, 1)",
} as const;

export const motion = { duration, easing } as const;
