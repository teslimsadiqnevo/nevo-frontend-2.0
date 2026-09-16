"use client";

import { useCallback, useMemo } from "react";
import { assignmentsApi, type Assignment } from "@/lib/api/assignments";
import { useLiveQuery } from "./useLiveQuery";

/**
 * What this class has been given.
 *
 * Design ruled on 16 Sep that the Lessons tab ships in v1 IF the library cannot
 * be filtered by class, because otherwise a teacher has no way to answer "what
 * has this class been given", which they ask every week. It cannot:
 * `GET /api/content/lessons` takes `limit` and `scope` only, `LessonScope` is
 * `mine | school`, and `LessonSummaryResponse` carries no class. So this ships.
 *
 * `GET /api/v1/assignments?classId=` answers it from the other direction and was
 * already wrapped as `assignmentsApi.list` with zero callers.
 *
 * THE ROWS ARE PER STUDENT, NOT PER LESSON. `AssignmentResponse.studentId` is
 * required and `classId` is nullable, so a lesson set for a class of 28 comes
 * back as 28 rows. Rendering them raw would show a teacher the same lesson
 * twenty-eight times. They are grouped by lesson id here, and the count of
 * distinct students is what the tab reports.
 *
 * STATUS IS SUMMARISED, NOT AVERAGED. `AssignmentStatus` is `assigned` or
 * `cancelled` per row, and the two can be mixed within one lesson if a teacher
 * called it off for some children. A lesson counts as cancelled only when EVERY
 * row is; otherwise it is live for whoever still has it, and the count reflects
 * only those. Reporting "cancelled" for a lesson twenty-six children can still
 * open would be the console telling a teacher something untrue about work in
 * progress.
 */
export interface ClassLesson {
  lessonId: string;
  title: string;
  /** Students who still have it. Zero when every row was cancelled. */
  studentCount: number;
  /** True only when no student in this class still has it. */
  cancelled: boolean;
  /** Earliest assignment time across the surviving rows. */
  assignedAt: string;
  /**
   * When it opens, if it has not yet. Null once open, or when the rows disagree
   * - a single date for a lesson opening at different times for different
   * children would be a claim the data does not support.
   */
  opensAt: string | null;
}

export interface ClassLessons {
  lessons: ClassLesson[];
  loading: boolean;
  failed: boolean;
}

/** Group per-student rows into one entry per lesson. Exported for its test. */
export function groupByLesson(rows: Assignment[], now: number): ClassLesson[] {
  const byLesson = new Map<string, Assignment[]>();
  for (const row of rows) {
    const id = row.lesson?.id;
    if (!id) continue;
    const list = byLesson.get(id);
    if (list) list.push(row);
    else byLesson.set(id, [row]);
  }

  const out: ClassLesson[] = [];
  for (const [lessonId, all] of byLesson) {
    const living = all.filter((r) => r.status !== "cancelled");
    const counted = living.length > 0 ? living : all;
    // Distinct students: the same child can hold two assignments of one lesson.
    const students = new Set(counted.map((r) => r.studentId));

    const opens = living
      .map((r) => r.availableFrom)
      .filter((v): v is string => Boolean(v));
    const allFuture =
      living.length > 0 &&
      opens.length === living.length &&
      new Set(opens).size === 1 &&
      Date.parse(opens[0]) > now;

    out.push({
      lessonId,
      title: counted[0].lesson.title,
      studentCount: living.length > 0 ? students.size : 0,
      cancelled: living.length === 0,
      assignedAt: counted
        .map((r) => r.assignedAt)
        .sort()
        .at(0)!,
      opensAt: allFuture ? opens[0] : null,
    });
  }

  // Most recently set first: a teacher opening this tab is asking about now.
  return out.sort((a, b) => b.assignedAt.localeCompare(a.assignedAt));
}

interface Snapshot {
  rows: Assignment[];
  fetchedAtMs: number;
}

export function useClassLessons(classId: string): ClassLessons {
  /*
   * The clock is read WHEN THE RESPONSE LANDS, not during render - the same
   * shape `useDueReviews` uses, and for the same reason it documents:
   * `Date.now()` during render fails `react-hooks/purity`, and moving it into
   * an effect only trades that for `set-state-in-effect`. A promise callback is
   * neither.
   *
   * It is also the more accurate question here. "Had this lesson opened when
   * the server told us about it" is stable; "has it opened on this particular
   * re-render" would let a row silently change its mind mid-session.
   */
  const run = useCallback(
    async (): Promise<Snapshot> => ({
      rows: await assignmentsApi.list({ classId }),
      fetchedAtMs: Date.now(),
    }),
    [classId],
  );
  const { data, failed, loading } = useLiveQuery<Snapshot>(run, [classId]);

  const lessons = useMemo(
    () => (data ? groupByLesson(data.rows, data.fetchedAtMs) : []),
    [data],
  );

  return { lessons, loading, failed };
}
