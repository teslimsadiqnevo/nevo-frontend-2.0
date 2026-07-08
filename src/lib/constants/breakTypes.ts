/**
 * Break type definitions (Frontend Architecture Sections 1 & 5).
 *
 * Break decisions are confirmed server-side (the backend has the full signal
 * picture); the `useBreakMonitor` hook renders the matching break component at
 * Design System Level 3 elevation with a calm 500–600ms entry.
 */
export const BREAK_TYPES = {
  /** Brief pause. */
  MICRO: "micro",
  /** Movement / stretching prompt. */
  MOVEMENT: "movement",
  /** Consolidation of what was just learned. */
  CONSOLIDATION: "consolidation",
  /** Full break. */
  FULL: "full",
} as const;

export type BreakType = (typeof BREAK_TYPES)[keyof typeof BREAK_TYPES];

/** Client-side elapsed-time threshold that primes the break UI (Section 5). */
export const BREAK_TIME_THRESHOLD_MS = 20 * 60 * 1_000; // 20 minutes
