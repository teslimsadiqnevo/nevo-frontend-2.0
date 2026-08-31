import { api } from "./client";

/**
 * Baseline cognitive profiling endpoints (SCRUM-104). The client reduces raw
 * interaction streams to a feature vector before transmission; raw data never
 * leaves the device (see `lib/profiling/capture`).
 */
/**
 * Which dimension Nevo wants recalibrated next.
 *
 * Typed as a bare string on purpose: the spec declares it so, and the
 * previous `BaselineDimension` typing quietly promised the value would be one
 * of our six. Callers match it and fall back when it is not.
 */
export interface RecalibratePrompt {
  dimension: string;
}

export const baselineApi = {
  /** The dimension the engine wants recalibrated next. */
  recalibratePrompt: (studentId: string) =>
    api.get<RecalibratePrompt>(
      `/api/baseline/recalibrate-prompt/${studentId}`,
    ),

  /** Submit the reduced feature vector at the end of the profiling run. */
  submit: (sessionId: string, features: Record<string, unknown>[]) =>
    api.post("/api/baseline/submit", { sessionId, features }),
};
