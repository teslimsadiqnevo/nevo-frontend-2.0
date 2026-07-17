"use client";

import { createContext, useMemo, useState, type ReactNode } from "react";
import type { AdaptationPlan } from "@/lib/types";

/**
 * Current lesson state — Student App only (FE Architecture §8). Holds the active
 * lesson, its adaptation plan (§4), and backs signal collection (§3, §5) for the
 * Lesson Player. Scoped to the lesson route, not the whole app.
 */
export interface LessonContextValue {
  lessonId: string | null;
  sessionId: string | null;
  adaptationPlan: AdaptationPlan | null;
  setLessonId: (id: string | null) => void;
}

export const LessonContext = createContext<LessonContextValue | undefined>(
  undefined,
);

export function LessonProvider({ children }: { children: ReactNode }) {
  const [lessonId, setLessonId] = useState<string | null>(null);
  const [sessionId] = useState<string | null>(null);
  const [adaptationPlan] = useState<AdaptationPlan | null>(null);
  // TODO: wire adaptation (useAdaptation) and signal collection (useSignals) for
  // the active lesson session.
  const value = useMemo<LessonContextValue>(
    () => ({ lessonId, sessionId, adaptationPlan, setLessonId }),
    [lessonId, sessionId, adaptationPlan],
  );
  return (
    <LessonContext.Provider value={value}>{children}</LessonContext.Provider>
  );
}
