/**
 * Design System v2 §3 — Color palette.
 *
 * Source of truth for Nevo brand colors. Mirrored into Tailwind as
 * `--color-nevo-*` in `src/app/globals.css` (Tailwind v4 `@theme`), which yields
 * utilities like `bg-nevo-navy`, `text-nevo-cream`, `border-nevo-violet`.
 *
 * Keep the two in sync: if you change a value here, update globals.css too.
 *
 * The palette is intentionally small (4 brand roles + cream surface tones).
 * There is no white and no gradients — elevation comes from tonal shifts within
 * the cream family. Functional colors (e.g. the "warm-tone" error / success
 * states) are NOT part of the brand palette — add them as separate semantic
 * tokens when building the States components.
 */
export const colors = {
  /** Primary / Navy — headers, primary surfaces, active states. */
  navy: "#3b3f6e",
  /** Background / Cream — default app background, calm surfaces. */
  cream: "#f7f1e6",
  /** Cream Elevated — cards and raised surfaces on cream. */
  creamElevated: "#ede8dc",
  /** Cream Sidebar — the darker cream the sidebar sits on. */
  creamSidebar: "#e8e3d7",
  /** Cream Shimmer — skeleton / loading surface. */
  creamShimmer: "#ded7c6",
  /** Accent / Soft Violet — accents, progress fills, system-triggered states. */
  violet: "#9a9ccb",
  /** Text / Near Black — primary text; also the shadow tint (see elevation). */
  nearBlack: "#2b2b2f",
} as const;

export type ColorToken = keyof typeof colors;
