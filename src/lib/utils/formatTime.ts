/**
 * Adaptive time-estimate formatting (FE Architecture §1, /lib/utils).
 *
 * Student-facing copy uses soft phrasing, e.g. "About 12 minutes" (UI/UX spec) —
 * deliberately approximate, never a precise countdown that could add pressure.
 */
export function formatTimeEstimate(minutes: number): string {
  const rounded = Math.max(1, Math.round(minutes));
  return `About ${rounded} minute${rounded === 1 ? "" : "s"}`;
}
