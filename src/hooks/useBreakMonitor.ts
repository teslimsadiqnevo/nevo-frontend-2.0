"use client";

import { useEffect, useRef, useState } from "react";
import { BREAK_TIME_THRESHOLD_MS, type BreakType } from "@/lib/constants";

/**
 * Client-side break monitoring (FE Architecture §5). Tracks elapsed time toward
 * the 20-minute threshold and primes the break UI. The actual break decision is
 * confirmed by the backend (which has the full signal picture); this hook watches
 * for that instruction and surfaces which break to render.
 */
export function useBreakMonitor(active: boolean) {
  const startedAt = useRef<number | null>(null);
  const [approachingThreshold, setApproachingThreshold] = useState(false);
  const [activeBreak, setActiveBreak] = useState<BreakType | null>(null);

  useEffect(() => {
    if (!active) return;
    startedAt.current = Date.now();
    const id = setInterval(() => {
      const started = startedAt.current;
      setApproachingThreshold(
        started !== null && Date.now() - started >= BREAK_TIME_THRESHOLD_MS,
      );
    }, 30_000);
    return () => clearInterval(id);
  }, [active]);

  // TODO: subscribe to backend break instructions and set `activeBreak`.
  return { approachingThreshold, activeBreak, setActiveBreak };
}
