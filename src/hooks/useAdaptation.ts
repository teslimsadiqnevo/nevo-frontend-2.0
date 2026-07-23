"use client";

import { useEffect, useState } from "react";
import { intelligenceApi, ApiError } from "@/lib/api";
import type { AdaptationPlan } from "@/lib/types";

/**
 * Lesson adaptation (FE Architecture §4). On lesson load, fetches the adapted
 * segment structure (modality, density, scaffolding) for the student so the
 * unified player can render it. Mid-lesson proactive adjustments arrive via
 * signals and are applied with Design System adaptation timing.
 */
export function useAdaptation(
  studentId: string | undefined,
  lessonId: string | undefined,
) {
  const [plan, setPlan] = useState<AdaptationPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!studentId || !lessonId) return;
    let active = true;
    // Placeholder fetch-on-mount. TODO: migrate to the real data layer
    // (React Query / SWR / Suspense); the synchronous setState below is an
    // isolated, deliberate exception until then.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    intelligenceApi
      .getAdaptation(studentId, lessonId)
      .then((res) => {
        if (active) {
          // TODO(api): validate the shape once the backend contract is ratified;
          // the client cast holds until then.
          setPlan(res as AdaptationPlan);
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
  }, [studentId, lessonId]);

  return { plan, loading, error };
}
