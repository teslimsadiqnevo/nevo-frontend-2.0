/**
 * Design System v2 — token barrel.
 *
 * The TypeScript tokens here are the source of truth for values consumed in JS
 * (charts, inline styles, animation configs). Their Tailwind counterparts live
 * in `src/app/globals.css` under `@theme` and must be kept in sync.
 */
export { colors, type ColorToken } from "./colors";
export { typography, fontFamily, fontSize, fontWeight } from "./typography";
export { spacing, type SpacingToken } from "./spacing";
export { elevation, type ElevationLevel } from "./elevation";
export { motion, duration, easing } from "./motion";
