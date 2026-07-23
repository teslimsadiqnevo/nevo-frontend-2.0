"use client";

import { createContext, useCallback, useMemo, useState, type ReactNode } from "react";
import type { AdaptationPlan } from "@/lib/types";

/** The active lesson session, set by the player once a lesson is open. */
export interface ActiveLesson {
  lessonId: string;
  sessionId: string;
  adaptationPlan: AdaptationPlan | null;
}

/**
 * Current lesson state — Student App only (FE Architecture §8). Holds the active
 * lesson, its adaptation plan (§4), and the signal session id (§3, §5) so
 * surfaces outside the player (e.g. Ask Nevo) can see what's being learned.
 * Scoped to the lesson route, not the whole app. The Lesson Player owns the
 * signal collection itself (via `useSignals`) and publishes the session here.
 */
export interface LessonContextValue {
  lessonId: string | null;
  sessionId: string | null;
  adaptationPlan: AdaptationPlan | null;
  /** Called by the player on mount; cleared on unmount. */
  setActiveLesson: (active: ActiveLesson | null) => void;
}

export const LessonContext = createContext<LessonContextValue | undefined>(
  undefined,
);

export function LessonProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<ActiveLesson | null>(null);
  const setActiveLesson = useCallback(
    (next: ActiveLesson | null) => setActive(next),
    [],
  );
  const value = useMemo<LessonContextValue>(
    () => ({
      lessonId: active?.lessonId ?? null,
      sessionId: active?.sessionId ?? null,
      adaptationPlan: active?.adaptationPlan ?? null,
      setActiveLesson,
    }),
    [active, setActiveLesson],
  );
  return (
    <LessonContext.Provider value={value}>{children}</LessonContext.Provider>
  );
}
