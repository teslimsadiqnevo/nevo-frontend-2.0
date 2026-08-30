/**
 * Mock lesson registry — the stand-in for `GET /api/content/lessons/{id}`
 * (deployed and typed; the teacher side reads it, the student side does not
 * yet) and `intelligenceApi.getAdaptation`. Each lesson
 * lives in its own file; this maps
 * ids → content/plan. TODO(api): replace with the real fetches.
 */
import type { AdaptationPlan, Lesson } from "@/lib/types";
import { PHOTOSYNTHESIS, PHOTOSYNTHESIS_PLAN } from "./photosynthesis";
import { ADDING_FRACTIONS, ADDING_FRACTIONS_PLAN } from "./adding-fractions";

const LESSONS: Record<string, Lesson> = {
  [PHOTOSYNTHESIS.id]: PHOTOSYNTHESIS,
  [ADDING_FRACTIONS.id]: ADDING_FRACTIONS,
};

const PLANS: Record<string, AdaptationPlan> = {
  [PHOTOSYNTHESIS_PLAN.lessonId]: PHOTOSYNTHESIS_PLAN,
  [ADDING_FRACTIONS_PLAN.lessonId]: ADDING_FRACTIONS_PLAN,
};

/** Mock stand-in for the lesson-detail endpoint, which the student app has
 *  not been wired to yet. */
export function getMockLesson(lessonId: string): Lesson | null {
  return LESSONS[lessonId] ?? null;
}

/** Mock stand-in for `intelligenceApi.getAdaptation`. */
export function getMockAdaptation(lessonId: string): AdaptationPlan | null {
  return PLANS[lessonId] ?? null;
}

/** The default lesson to route a fresh student into (onboarding "You're In"). */
export const FIRST_LESSON_ID = PHOTOSYNTHESIS.id;
