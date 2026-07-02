/**
 * Design System v2 — Typography tokens.
 *
 * Two families per Design System v2 §2 — and their roles NEVER swap:
 *   - Agile  → logo / brand identity ONLY (the wordmark). Not for headings.
 *   - Inter  → body, UI, all supporting text (including headings).
 *
 * The families resolve to CSS variables set up in the root layout / globals.css:
 *   --font-sans    Inter (loaded via next/font/google in src/app/layout.tsx)
 *   --font-agile   placeholder — add the Agile brand font via next/font/local
 *                  once the files are available; falls back to Inter.
 *
 * Exposed to Tailwind as `font-sans` (Inter, the default everywhere) and
 * `font-brand` (Agile, wordmark only) via @theme in globals.css.
 */
export const fontFamily = {
  /** Inter — default UI/body/heading font. */
  sans: "var(--font-sans)",
  /** Agile — logo/wordmark only (falls back to Inter until added). */
  brand: "var(--font-agile, var(--font-sans))",
} as const;

/** Type scale (rem). Adjust against Design System v2 as needed. */
export const fontSize = {
  xs: "0.75rem", // 12px
  sm: "0.875rem", // 14px
  base: "1rem", // 16px
  lg: "1.125rem", // 18px
  xl: "1.25rem", // 20px
  "2xl": "1.5rem", // 24px
  "3xl": "1.875rem", // 30px
  "4xl": "2.25rem", // 36px
} as const;

export const fontWeight = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

export const typography = { fontFamily, fontSize, fontWeight } as const;
