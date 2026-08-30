"use client";

import { useEffect, useState } from "react";
import { getToken } from "@/lib/auth/session";
import { useHasSession } from "./useHasSession";

/**
 * One live read, shared by every screen that falls back to fixtures.
 *
 * This exists because four hooks each grew the same bug. They raced the
 * request against a six-second cap and took whichever finished first - so a
 * response arriving at seven seconds was DISCARDED, and the screen stayed on
 * sample data until the teacher reloaded, even though their real data had
 * come back. The live backend answers an unauthenticated 401 in anything from
 * 1.0s to 5.6s, and a Render cold start is far slower, so that cap was below
 * its ordinary latency, not a guard against the exceptional.
 *
 * The rule now: a response always wins, however late. The timer only decides
 * what a screen shows WHILE waiting - `slow` lets it say the server is taking
 * a moment - and `failed` means the request genuinely failed, which is the
 * only thing that should ever put fixtures on screen.
 */

/** Long enough that a normal load never trips it. */
const SLOW_AFTER_MS = 4000;

export interface LiveQuery<T> {
  data: T | null;
  /** The request failed. The only honest reason to show fixtures. */
  failed: boolean;
  /** Still waiting, and long enough that the screen should say so. */
  slow: boolean;
  /** Signed in, nothing yet, no failure - a skeleton belongs here. */
  loading: boolean;
}

/**
 * `run` must be stable (wrap it in `useCallback`), and its dependencies
 * belong in `deps` - the effect re-runs when they change.
 */
export function useLiveQuery<T>(
  run: () => Promise<T>,
  deps: React.DependencyList,
): LiveQuery<T> {
  const [data, setData] = useState<T | null>(null);
  const [failed, setFailed] = useState(false);
  const [slow, setSlow] = useState(false);
  const signedIn = useHasSession();

  useEffect(() => {
    if (!getToken()) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      if (!cancelled) setSlow(true);
    }, SLOW_AFTER_MS);

    void run()
      .then((res) => {
        if (cancelled) return;
        setData(res);
        setFailed(false);
        setSlow(false);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      })
      .finally(() => clearTimeout(timer));

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, failed, slow, loading: signedIn && data === null && !failed };
}
