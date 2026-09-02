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

export interface DueReviewsState {
  /** Concept ids ready for another look. Empty until a successful read. */
  due: Set<string>;
  loading: boolean;
  failed: boolean;
}

export function useDueReviews(): DueReviewsState {
  const studentId = getSession()?.userId;
  const run = useCallback(
    () => schedulerApi.dueReviews(studentId!),
    [studentId],
  );
  const { data, failed, loading } = useLiveQuery<ConceptSchedule[]>(run, [
    studentId,
  ]);

  const due = useMemo(() => {
    if (!data) return new Set<string>();
    // The route is named for due items, but it is a schedule endpoint and the
    // contract does not promise the filtering. Checking the date here is
    // correct whether the server returns only what is due or the whole
    // schedule - and the failure mode it prevents is the one that matters:
    // telling a child something is ready when it is not.
    const now = Date.now();
    return new Set(
      data
        .filter((c) => {
          const at = Date.parse(c.nextReviewDue);
          return Number.isNaN(at) || at <= now;
        })
        .map((c) => c.conceptId),
    );
  }, [data]);

  return {
    due,
    loading: Boolean(studentId) && loading,
    failed,
  };
}
