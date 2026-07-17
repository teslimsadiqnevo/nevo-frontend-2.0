import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge class names with Tailwind-aware conflict resolution (shadcn). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Wall-clock read for event-time measurements (signal timing). Wrapped so it is
 * only ever called from event handlers/effects — never during render — which
 * also keeps React's purity lint satisfied.
 */
export const now = () => Date.now();

export { sanitizeForDisplay, containsClinicalTerm } from "./zeroTag";
export { formatProfile } from "./formatProfile";
export { formatTimeEstimate } from "./formatTime";
