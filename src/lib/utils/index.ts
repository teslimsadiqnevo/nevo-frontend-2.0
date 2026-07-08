import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge class names with Tailwind-aware conflict resolution (shadcn). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export { sanitizeForDisplay, containsClinicalTerm } from "./zeroTag";
export { formatProfile } from "./formatProfile";
export { formatTimeEstimate } from "./formatTime";
