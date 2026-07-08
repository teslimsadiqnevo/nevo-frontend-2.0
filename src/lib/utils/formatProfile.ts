import { sanitizeForDisplay } from "./zeroTag";

/**
 * Convert learner-profile dimensions into plain, non-clinical language for
 * display (FE Architecture §1, /lib/utils). Output always passes through
 * Zero-Tag as a final safety net.
 *
 * TODO: type against the backend profile schema and map each dimension to a
 * functional-language statement (e.g. "You tend to do well with audio
 * explanations") per the Design System's functional-language rules.
 */
export interface ProfileDimension {
  key: string;
  label?: string;
}

export function formatProfile(dimension: ProfileDimension): string {
  return sanitizeForDisplay(dimension.label ?? dimension.key);
}
