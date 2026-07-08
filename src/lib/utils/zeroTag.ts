/**
 * Zero-Tag client-side enforcement (FE Architecture §6).
 *
 * A display-level safety net: even though the backend schema structurally
 * prevents diagnostic labels from being stored, the client scans profile-related
 * text before rendering and replaces any clinical terms with a neutral fallback.
 *
 * This should NEVER trigger if the backend is Zero-Tag compliant — it is
 * defense-in-depth, consistent with making clinical labeling structurally
 * impossible rather than policy-dependent.
 */

/** Maintained blocklist of clinical / diagnostic terms (FE Architecture §6). */
export const CLINICAL_TERM_BLOCKLIST = [
  "learning disability",
  "learning disabilities",
  "special needs",
  "adhd",
  "dyslexia",
  "dyspraxia",
  "autism",
  "autistic",
  "disorder",
  "deficit",
  "impairment",
] as const;

/** Neutral, non-clinical replacement. */
const DEFAULT_FALLBACK = "learning need";

// Longest-first so multi-word terms match before their substrings; word
// boundaries avoid clipping inside unrelated words.
const pattern = new RegExp(
  `\\b(${[...CLINICAL_TERM_BLOCKLIST]
    .sort((a, b) => b.length - a.length)
    .map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|")})\\b`,
  "gi",
);

/** True if the text contains any blocklisted clinical term. */
export function containsClinicalTerm(text: string): boolean {
  pattern.lastIndex = 0;
  return pattern.test(text);
}

/**
 * Scrub clinical terms from display text, replacing them with a neutral
 * fallback. Logs a warning in development when it triggers, since that signals a
 * backend Zero-Tag gap that should be fixed at the source.
 */
export function sanitizeForDisplay(
  text: string,
  fallback: string = DEFAULT_FALLBACK,
): string {
  pattern.lastIndex = 0;
  if (!pattern.test(text)) return text;
  if (process.env.NODE_ENV === "development") {
    console.warn(
      "[zeroTag] clinical term found in display text — fix the backend source:",
      text,
    );
  }
  pattern.lastIndex = 0;
  return text.replace(pattern, fallback);
}
