/**
 * Design System v2 — Spacing scale (xs → 3xl).
 *
 * These values are NOT mirrored as named Tailwind tokens: a `--spacing-2xl` key
 * would shadow Tailwind's size scale and silently break utilities like
 * `max-w-2xl`. Instead use Tailwind's numeric spacing, which maps 1:1:
 *   xs → 1 (4px) · sm → 2 (8px) · md → 4 (16px) · lg → 6 (24px)
 *   xl → 8 (32px) · 2xl → 12 (48px) · 3xl → 16 (64px)
 * e.g. `gap-4` for md, `p-6` for lg. This object stays the source of truth for
 * spacing consumed in JS/TS.
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
