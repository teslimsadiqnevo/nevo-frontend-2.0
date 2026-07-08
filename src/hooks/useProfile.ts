"use client";

import { useEffect, useState } from "react";
import { intelligenceApi, ApiError } from "@/lib/api";

/**
 * Learner profile data access (FE Architecture §1). Read-only; the profile is
 * observed by the Intelligence Framework, never self-reported.
 */
export function useProfile(studentId: string | undefined) {
  const [data, setData] = useState<unknown | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!studentId) return;
    let active = true;
    // Placeholder fetch-on-mount. TODO: migrate to the real data layer
    // (React Query / SWR / Suspense); the synchronous setState below is an
    // isolated, deliberate exception until then.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    intelligenceApi
      .getProfile(studentId)
      .then((res) => {
        if (active) {
          setData(res);
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
  }, [studentId]);

  return { data, loading, error };
}
