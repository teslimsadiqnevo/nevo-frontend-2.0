import { api } from "./client";
import type { BaselineDimension } from "@/lib/profiling/bands";

/**
 * Baseline cognitive profiling endpoints (SCRUM-104). The client reduces raw
 * interaction streams to a feature vector before transmission; raw data never
 * leaves the device (see `lib/profiling/capture`).
 */
export const baselineApi = {
  /** Submit the reduced feature vector at the end of the profiling run. */
  submit: (sessionId: string, features: Record<string, unknown>[]) =>
    api.post("/api/baseline/submit", { sessionId, features }),

  /** Which dimension today's warm-up should recalibrate. */
  recalibratePrompt: (studentId: string) =>
    api.get<{ dimension: BaselineDimension }>(
      `/api/baseline/recalibrate-prompt/${studentId}`,
    ),
};
