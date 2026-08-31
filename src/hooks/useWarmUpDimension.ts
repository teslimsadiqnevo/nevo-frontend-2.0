"use client";

import { useEffect, useState } from "react";
import { baselineApi } from "@/lib/api";
import { getSession, getToken } from "@/lib/auth/session";
import {
  BASELINE_DIMENSIONS,
  type BaselineDimension,
} from "@/lib/profiling/bands";

/**
 * Which dimension today's warm-up should recalibrate.
 *
 * `GET /api/baseline/recalibrate-prompt/{student_id}` knows what the engine
 * actually wants next; the day-of-week rotation only approximates it. The
 * rotation stays as the fallback - signed out, no session, a failed call, or
 * a dimension we do not recognise - because a warm-up that runs the wrong
 * task is far better than one that cannot start.
 */
export function useWarmUpDimension(
  fallback: BaselineDimension,
): BaselineDimension {
  const [dimension, setDimension] = useState<BaselineDimension>(fallback);

  useEffect(() => {
    const session = getSession();
    if (!getToken() || !session) return;
    let cancelled = false;
    void baselineApi
      .recalibratePrompt(session.userId)
      .then((res) => {
        if (cancelled) return;
        const known = (BASELINE_DIMENSIONS as readonly string[]).includes(
          res.dimension,
        );
        // An unrecognised dimension drives no task we have, so it stays on
        // the rotation rather than blanking the activity.
        if (known) setDimension(res.dimension as BaselineDimension);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return dimension;
}
