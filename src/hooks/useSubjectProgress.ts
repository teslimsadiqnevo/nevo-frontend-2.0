"use client";

import { useCallback } from "react";
import { studentsApi } from "@/lib/api/students";
import { getSession } from "@/lib/auth/session";
import { useLiveQuery } from "./useLiveQuery";

/**
 * One subject's own reflection, from
 * `GET /api/students/{id}/progress/{subject}`.
 *
 * `useStudentProgress` reads the whole student once and lets Subject Detail
 * filter its concepts and lessons out of that. That was the right call while
 * the narrowed route only returned a subset of the same rows. It stopped being
 * enough on 3 Sep, when the backend began writing `reflection`: the
 * whole-student read carries a reflection about ALL of a child's learning, and
 * putting that under one subject's heading would present a sentence about
 * everything as a sentence about maths. Only the narrowed read carries the
 * subject-scoped one - so this hook makes that one extra call for that one
 * field, and nothing else moves.
 *
 * The result is stamped with the subject it answers for and only exposed
 * against a matching ask. Navigating between subjects remounts the page, but
 * nothing here relies on that.
 */

interface SubjectSnapshot {
  /** Null when there was nothing to ask for yet. */
  subject: string | null;
  reflection: string | null;
}

export interface SubjectProgressState {
  /** The subject's own reflection; null until read. */
  reflection: string | null;
  loading: boolean;
  failed: boolean;
}

export function useSubjectProgress(
  /** The backend's name for the subject, as carried on its concept rows. */
  subject: string | null,
): SubjectProgressState {
  const studentId = getSession()?.userId;

  const run = useCallback(async (): Promise<SubjectSnapshot> => {
    // `useLiveQuery` has no "enabled" switch, so an unknown subject resolves
    // to an empty snapshot rather than a request with nothing in the path.
    if (!subject) return { subject: null, reflection: null };
    const res = await studentsApi.subjectProgress(studentId!, subject);
    return { subject, reflection: res.reflection };
  }, [studentId, subject]);

  const { data, failed, loading } = useLiveQuery<SubjectSnapshot>(run, [
    studentId,
    subject,
  ]);

  return {
    reflection: data && data.subject === subject ? data.reflection : null,
    loading: Boolean(studentId && subject) && loading,
    failed,
  };
}
