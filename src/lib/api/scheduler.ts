import { api } from "./client";

/**
 * Spaced-review scheduling (`/api/scheduler/*`, Bearer).
 *
 * The scheduler owns WHEN a concept should be seen again. Until now the whole
 * group was unread by this frontend: the review-session route existed and could
 * render a lesson as a review variant, but nothing ever told a child a concept
 * was ready.
 *
 * WHAT THIS CANNOT DO, and why the surface is informational rather than a
 * session: `due-reviews` returns concept IDs, and a concept
 * (`GET /api/concepts/{id}`) is only `{ id, name, subject }`. Nothing links a
 * concept to a lesson in either direction - `ConceptProgressResponse` carries no
 * lesson, `LessonProgressItemResponse` carries no concepts - and no question
 * bank is keyed to a concept. So a due concept can be NAMED but not opened, and
 * guessing a lesson from the shared subject would be inventing the link.
 *
 * `POST /api/scheduler/record-review` is the write side and is deliberately not
 * wired: it needs `recallSuccessful`, and with no question to ask there is
 * nothing to report. It lands when the question-to-concept link does.
 */

export interface ConceptSchedule {
  studentId: string;
  conceptId: string;
  /**
   * Spacing-engine parameters. Typed because the contract sends them, and
   * NEVER rendered - a number against a child's recall is the same
   * diagnostic-shaped measurement the Zero-Tag ruling bars elsewhere.
   */
  stability: number;
  difficulty: number;
  retrievability: number;
  lastReview: string;
  reviewCount: number;
  nextReviewDue: string;
}

export const schedulerApi = {
  /** Concepts the scheduler judges ready for another look. */
  dueReviews: (studentId: string) =>
    api.get<ConceptSchedule[]>(`/api/scheduler/due-reviews/${studentId}`),
};
