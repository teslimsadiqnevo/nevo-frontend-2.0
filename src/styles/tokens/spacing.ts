/**
 * Design System v2 — Spacing scale (xs → 3xl).
 *
 * Mirrored into Tailwind as `--spacing-*` in globals.css, giving named spacing
 * utilities such as `p-md`, `gap-lg`, `m-xl` alongside the default numeric scale.
 */
export const spacing = {
  xs: "0.25rem", // 4px
  sm: "0.5rem", // 8px
  md: "1rem", // 16px
  lg: "1.5rem", // 24px
  xl: "2rem", // 32px
  "2xl": "3rem", // 48px
  "3xl": "4rem", // 64px
} as const;

export type SpacingToken = keyof typeof spacing;
