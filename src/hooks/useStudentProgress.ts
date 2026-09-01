"use client";

import { useCallback, useMemo } from "react";
import { studentsApi, type StudentProgress } from "@/lib/api/students";
import { getSession } from "@/lib/auth/session";
import { useLiveQuery } from "./useLiveQuery";

/**
 * The student's own progress, from `GET /api/students/{id}/progress`.
 *
 * THIS ENDPOINT WAS THERE ALL ALONG. The audit recorded Progress as having no
 * backend whatsoever - "no growth summary, per-subject prose, a timeline or
 * session history, and none planned" - and on that basis the tab was gated to
 * an empty state for signed-in children. That was wrong: the route returns
 * per-subject mastery, per-concept understanding and reading scores, and a
 * lesson history with timestamps. `studentsApi.progress` was already typed and
 * already in use by the teacher console.
 *
 * WHAT IS GENUINELY ABSENT is the PROSE. "Getting faster at solving problems"
 * has no field behind it, and neither does the subject reflection on the detail
 * screen. So those stay unwritten rather than generated: a sentence we compose
 * from a number is still us making a claim about a child.
 *
 * AND NO NUMBERS REACH THE SCREEN. Screen 22 is explicit - no percentile, no
 * score, no comparison, only direction of travel - so `understanding` and
 * `masteryAverage` order and select what to show, and never appear. What a
 * child reads is which subjects they have worked in and which concepts they
 * have touched, both of which are facts rather than judgements.
 */

export interface ConceptRow {
  conceptId: string;
  name: string;
  /** 0-1. Orders the list; never rendered. */
  understanding: number;
  practiceCount: number;
}

export interface SubjectProgress {
  /** URL slug, derived - the contract has no slug of its own. */
  slug: string;
  name: string;
  concepts: ConceptRow[];
}

export interface StudentProgressState {
  subjects: SubjectProgress[];
  /** Lesson history, newest first. */
  lessons: StudentProgress["lessons"];
  loading: boolean;
  failed: boolean;
  /** Signed in and read - fixtures must not show. */
  live: boolean;
}

export function subjectSlug(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

/**
 * One read for the whole tab AND the subject screens.
 *
 * `GET .../progress/{subject}` exists and returns the same shape narrowed, but
 * the unnarrowed response already carries every concept with its own subject -
 * so the detail screen filters what it has rather than making a second call
 * for a subset of the first.
 */
export function useStudentProgress(): StudentProgressState {
  const studentId = getSession()?.userId;
  const run = useCallback(() => studentsApi.progress(studentId!), [studentId]);
  const { data, failed, loading } = useLiveQuery<StudentProgress>(run, [
    studentId,
  ]);

  const subjects = useMemo<SubjectProgress[]>(() => {
    if (!data) return [];
    // The contract carries a subject per CONCEPT, not a subject list, so the
    // grouping is ours. A concept with no subject is dropped rather than
    // collected under an invented heading.
    const bySubject = new Map<string, ConceptRow[]>();
    for (const c of data.concepts) {
      const name = c.subject?.trim();
      if (!name) continue;
      const list = bySubject.get(name) ?? [];
      list.push({
        conceptId: c.conceptId,
        name: c.name,
        understanding: c.understanding,
        practiceCount: c.practiceCount,
      });
      bySubject.set(name, list);
    }
    return [...bySubject.entries()].map(([name, concepts]) => ({
      slug: subjectSlug(name),
      name,
      // Most-practised first: what they have spent time on leads.
      concepts: concepts.sort((a, b) => b.practiceCount - a.practiceCount),
    }));
  }, [data]);

  const lessons = useMemo(
    () =>
      data
        ? [...data.lessons].sort(
            (a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt),
          )
        : [],
    [data],
  );

  return {
    subjects,
    lessons,
    loading: Boolean(studentId) && loading,
    failed,
    live: Boolean(data),
  };
}
