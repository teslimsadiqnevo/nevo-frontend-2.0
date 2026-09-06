"use client";

import { useEffect, useState } from "react";
import { intelligenceApi, ApiError } from "@/lib/api";
import type { AdaptSegment } from "@/lib/api/intelligence";
import { toAdaptationPlan } from "@/lib/lessons/adaptation";
import type { AdaptationPlan, Lesson } from "@/lib/types";

/**
 * Lesson adaptation (FE Architecture §4). On lesson load, fetches the adapted
 * segment structure (modality, scaffolding) for the student so the unified
 * player can render it. Mid-lesson proactive adjustments arrive via signals
 * and are applied with Design System adaptation timing.
 *
 * A STUDENT MAY CALL THIS FOR THEMSELVES - checked against the deployed API,
 * which returns 200 on a student's own token. `studentId` is nullable in the
 * contract, so it is not passed: the backend takes the student from the token
 * rather than the caller asserting one.
 *
 * The response is TRANSLATED, not cast. This hook previously did
 * `setPlan(res as AdaptationPlan)`, which could not have worked - the wire is
 * snake_case (`segment_id`, `scaffolding`) and the player is camelCase
 * (`segmentId`, `scaffold`), so every lookup would have missed. Nothing
 * consumed the hook, so nothing surfaced it. See `lib/lessons/adaptation.ts`.
 */
export function useAdaptation(
  lessonId: string | undefined,
  /** The lesson's segments. Required by the contract - see `getAdaptation`. */
  segments: AdaptSegment[] | undefined,
  /** The built lesson, so a plan row can be clamped to what it can render. */
  lesson: Lesson | null,
) {
  const [plan, setPlan] = useState<AdaptationPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!lessonId || !segments?.length || !lesson) return;
    let active = true;
    // Placeholder fetch-on-mount. TODO: migrate to the real data layer
    // (React Query / SWR / Suspense); the synchronous setState below is an
    // isolated, deliberate exception until then.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    intelligenceApi
      .getAdaptation(lessonId, segments, { mode: "lesson_load" })
      .then((res) => {
        if (active) {
          setPlan(toAdaptationPlan(res, lesson));
          setError(null);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof ApiError ? err.message : "Something went wrong.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [lessonId, segments, lesson]);

  return { plan, loading, error };
}
