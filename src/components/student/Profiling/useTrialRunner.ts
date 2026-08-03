"use client";

import { useEffect, useRef, useState } from "react";
import type { BaselineCapture } from "@/lib/profiling/capture";

/** The frames' commit beat: a tapped control presses violet, then the next trial. */
const PICK_BEAT_MS = 440;
/** Every module ends on the shared "That's it. Saved." settle. */
const SETTLE_MS = 1700;

/**
 * Shared trial engine for Modules 2-4: a fixed list of trials across one or two
 * activities, tap-to-answer with a brief pressed beat, no feedback of any kind,
 * a settle at the end. Each pick is captured with its response time
 * (`performance.now()` from trial presentation to tap).
 */
export function useTrialRunner({
  module,
  counts,
  capture,
  onComplete,
}: {
  /** Capture tag, e.g. "pattern_flanker". */
  module: string;
  /** Ordered activities and their trial counts, e.g. [["pattern", 3], ["flanker", 3]]. */
  counts: [string, number][];
  capture?: BaselineCapture;
  onComplete: () => void;
}) {
  const [actIdx, setActIdx] = useState(0);
  const [trial, setTrial] = useState(0);
  const [picked, setPicked] = useState(-1);
  const [settling, setSettling] = useState(false);

  const shownAt = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);
  useEffect(() => {
    const t = timers.current;
    return () => t.forEach(clearTimeout);
  }, []);

  const act = counts[Math.min(actIdx, counts.length - 1)][0];

  // Stamp presentation time whenever the visible trial changes.
  useEffect(() => {
    shownAt.current = performance.now();
    capture?.record("trial_shown", { module, act, trial });
  }, [module, act, trial, capture]);

  const pick = (choice: number, detail?: Record<string, unknown>) => {
    if (settling || picked !== -1) return;
    const rtMs = Math.round(performance.now() - shownAt.current);
    capture?.record("trial_pick", { module, act, trial, choice, rtMs, ...detail });
    setPicked(choice);
    timers.current.push(
      setTimeout(() => {
        let a = actIdx;
        let t = trial + 1;
        if (t >= counts[a][1]) {
          a += 1;
          t = 0;
        }
        if (a >= counts.length) {
          setSettling(true);
          capture?.record("module_end", { module });
          void capture?.persist();
          timers.current.push(setTimeout(() => onCompleteRef.current(), SETTLE_MS));
          return;
        }
        setActIdx(a);
        setTrial(t);
        setPicked(-1);
      }, PICK_BEAT_MS),
    );
  };

  return { act, trial, picked, settling, pick };
}
