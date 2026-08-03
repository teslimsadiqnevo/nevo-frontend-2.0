/**
 * Age-band resolution for the Baseline Cognitive Profiling module (SCRUM-104).
 * Four tiers drive content, grid sizes and tap-target sizes; the component
 * shells are shared. Band comes from the student's year/date of birth -
 * TODO(api): resolve from the roster profile once the contract lands.
 */

export const AGE_BANDS = {
  /** Primary 1-3. */
  P13: "p13",
  /** Primary 4-6 (primary band in the frames). */
  P46: "p46",
  /** Junior secondary. */
  JSS: "jss",
  /** Senior secondary. */
  SS: "ss",
} as const;

export type AgeBand = (typeof AGE_BANDS)[keyof typeof AGE_BANDS];

/** Resolve a band from the mock roster's "Year N" / "JSS N" / "SS N" subtitle. */
export function bandForYearLabel(label: string): AgeBand {
  const jss = /jss/i.test(label);
  const ss = /\bss\b/i.test(label) && !jss;
  if (jss) return AGE_BANDS.JSS;
  if (ss) return AGE_BANDS.SS;
  const year = Number(/\d+/.exec(label)?.[0] ?? 4);
  return year <= 3 ? AGE_BANDS.P13 : AGE_BANDS.P46;
}

/** Module 1 (Spatial Grid Span) shape per band. */
export interface GridSpanConfig {
  /** Grid is n x n. */
  n: number;
  /** Adaptive span start / ceiling (shared across bands; capped by grid). */
  spanStart: number;
  spanMax: number;
  /** SS runs the dual task: a true/false check between watch and recall. */
  dual: boolean;
  /** First-round instruction (later rounds use the short forms). */
  instruction: string;
}

export function gridSpanConfig(band: AgeBand): GridSpanConfig {
  switch (band) {
    case AGE_BANDS.P13:
      return { n: 3, spanStart: 3, spanMax: 5, dual: false, instruction: "Watch the tiles light up, then tap them backwards" };
    case AGE_BANDS.JSS:
      return { n: 5, spanStart: 3, spanMax: 6, dual: false, instruction: "Memorize the sequence, then tap them in reverse" };
    case AGE_BANDS.SS:
      return { n: 5, spanStart: 3, spanMax: 6, dual: true, instruction: "Watch the sequence and answer each check, then tap in reverse" };
    default:
      return { n: 4, spanStart: 3, spanMax: 6, dual: false, instruction: "Watch the pattern, then tap the tiles in reverse order" };
  }
}

/** The six baseline dimensions (also the daily warm-up rotation). */
export const BASELINE_DIMENSIONS = [
  "wmc",
  "ps",
  "reading",
  "ans",
  "attention",
  "domain",
] as const;

export type BaselineDimension = (typeof BASELINE_DIMENSIONS)[number];
