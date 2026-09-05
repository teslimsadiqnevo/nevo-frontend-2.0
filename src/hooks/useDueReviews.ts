"use client";

import { useCallback, useMemo } from "react";
import { schedulerApi, type ConceptSchedule } from "@/lib/api/scheduler";
import { getSession } from "@/lib/auth/session";
import { useLiveQuery } from "./useLiveQuery";

/**
 * Which of a child's concepts are ready for another look, from
 * `GET /api/scheduler/due-reviews/{student_id}`.
 *
 * The response is a spacing SCHEDULE, not a lesson plan: concept id, when it
 * was last seen, when it is next due, and the engine's own stability /
 * difficulty / retrievability. Only the identity and the due date are used
 * here. None of the numbers reach a screen, and none of them order anything a
 * child sees - the concept list keeps the order Progress already gives it, so a
 * child is never shown a ranking of their own recall.
 *
 * `loading` and `failed` are separate, and neither is inferred from an empty
 * set: "nothing is due" and "we could not ask" are different sentences, and the
 * second must never be rendered as the first.
 */

/** What one read of the schedule saw, and when it saw it. */
interface DueSnapshot {
  rows: ConceptSchedule[];
  fetchedAtMs: number;
}

export interface DueReviewsState {
  /** Concept ids ready for another look. Empty until a successful read. */
  due: Set<string>;
  /**
   * Of those, the ones with a lesson that can be opened: concept id -> lesson
   * id. A due concept with no linked lesson is absent, not broken.
   */
  playable: Map<string, string>;
  loading: boolean;
  failed: boolean;
}

export function useDueReviews(): DueReviewsState {
  const studentId = getSession()?.userId;
  /*
   * The clock is read WHEN THE RESPONSE LANDS, not during render.
   *
   * `Date.now()` in a useMemo is impure and fails `react-hooks/purity`; moving
   * it into an effect only trades that for `set-state-in-effect`. A promise
   * callback is neither - and it is also the most accurate place, because the
   * question being asked is "was this due when the server told us about it",
   * not "is it due on this particular re-render".
   */
  const run = useCallback(
    async (): Promise<DueSnapshot> => ({
      rows: await schedulerApi.dueReviews(studentId!),
      fetchedAtMs: Date.now(),
    }),
    [studentId],
  );
  const { data, failed, loading } = useLiveQuery<DueSnapshot>(run, [studentId]);

  const rows = useMemo(() => {
    if (!data) return [];
    // The route is named for due items, but it is a schedule endpoint and the
    // contract does not promise the filtering. Checking the date here is
    // correct whether the server returns only what is due or the whole
    // schedule - and the failure mode it prevents is the one that matters:
    // telling a child something is ready when it is not.
    return data.rows.filter((c) => {
      const at = Date.parse(c.nextReviewDue);
      return Number.isNaN(at) || at <= data.fetchedAtMs;
    });
  }, [data]);

  const due = useMemo(
    () => new Set(rows.map((c) => c.conceptId)),
    [rows],
  );

  /**
   * Which due concepts can actually be opened, concept id -> lesson id.
   *
   * A concept whose `lessonId` is null is due but not playable, and is absent
   * here rather than present with a broken destination - the caller can then
   * offer the review only where there is something to open.
   */
  const playable = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of rows) if (c.lessonId) map.set(c.conceptId, c.lessonId);
    return map;
  }, [rows]);

  return {
    due,
    playable,
    loading: Boolean(studentId) && loading,
    failed,
  };
}
