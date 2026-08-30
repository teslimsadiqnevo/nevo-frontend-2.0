"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api/client";
import { assignmentsApi, type Assignment } from "@/lib/api/assignments";
import { lessonsApi, type LessonDetailResponse } from "@/lib/api/lessons";
import { getToken } from "@/lib/auth/session";
import { useHasSession } from "./useHasSession";

/**
 * One lesson: its parsed segments, plus who it has been given to.
 *
 * Two calls, because the contract splits them - `GET /api/content/lessons/{id}`
 * has the content and no assignment, and `GET /api/v1/assignments` has the
 * assignments and cannot be filtered by lesson. The second is best-effort: a
 * lesson still reads perfectly well without knowing who has it, so a failed
 * assignment call leaves that section absent rather than failing the page.
 *
 * `missing` distinguishes "no such lesson" from "could not load it" - the
 * first is a 404, the second is a retry, and showing one as the other tells a
 * teacher their lesson was deleted when it was not.
 */

export interface LessonDetailState {
  lesson: LessonDetailResponse | null;
  /** Assignments for this lesson; empty when none or when the call failed. */
  assignments: Assignment[];
  loading: boolean;
  /** The lesson does not exist. */
  missing: boolean;
  /** It exists as far as we know, but we could not load it. */
  failed: boolean;
}

export function useLessonDetail(lessonId: string): LessonDetailState {
  const [lesson, setLesson] = useState<LessonDetailResponse | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [missing, setMissing] = useState(false);
  const [failed, setFailed] = useState(false);
  const signedIn = useHasSession();
  const loading = signedIn && !lesson && !missing && !failed;

  useEffect(() => {
    if (!getToken()) return;
    let cancelled = false;

    void lessonsApi
      .detail(lessonId)
      .then((res) => {
        if (!cancelled) setLesson(res);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) setMissing(true);
        else setFailed(true);
      });

    // Best-effort: the page is worth showing without it.
    void assignmentsApi
      .list()
      .then((all) => {
        if (!cancelled) {
          setAssignments(all.filter((a) => a.lesson?.id === lessonId));
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [lessonId]);

  return { lesson, assignments, loading, missing, failed };
}
