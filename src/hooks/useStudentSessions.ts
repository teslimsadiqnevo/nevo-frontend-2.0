"use client";

import { useCallback } from "react";
import {
  studentsApi,
  type StudentSessionDetail,
  type StudentSessionList,
} from "@/lib/api/students";
import { useLiveQuery } from "./useLiveQuery";

/**
 * A child's sessions, and one session in full.
 *
 * C08d has been frame-complete and mounted only for signed-out visitors since
 * it was built. The detail read landed on 15 Sep and was still unreachable,
 * because nothing gave a teacher a `sessionId` to call it with. Backend added
 * the list on 17 Sep and that is the whole of what was missing.
 *
 * TWO HOOKS, NOT ONE. The list loads with the profile; the detail loads only
 * when a teacher opens a row. Folding them together would fetch every session's
 * prose to render a list that shows none of it.
 */

export interface StudentSessions {
  sessions: StudentSessionList["sessions"];
  /** What the server says exists, which may exceed what we asked for. */
  total: number;
  loading: boolean;
  failed: boolean;
}

/** How many rows the profile asks for. The panel is opened from one of these. */
const PAGE = 8;

export function useStudentSessions(studentId: string): StudentSessions {
  const run = useCallback(
    () => studentsApi.sessions(studentId, { limit: PAGE }),
    [studentId],
  );
  const { data, failed, loading } = useLiveQuery<StudentSessionList>(run, [
    studentId,
  ]);

  return {
    sessions: data?.sessions ?? [],
    total: data?.total ?? 0,
    loading,
    failed,
  };
}

export interface StudentSessionDetailState {
  detail: StudentSessionDetail | null;
  loading: boolean;
  failed: boolean;
}

/**
 * One session. `sessionId` empty means nothing is open, and `useLiveQuery`
 * refuses to fire without a token, so a closed panel makes no request.
 */
export function useStudentSession(
  studentId: string,
  sessionId: string | null,
): StudentSessionDetailState {
  const run = useCallback(
    () => studentsApi.session(studentId, sessionId!),
    [studentId, sessionId],
  );
  const { data, failed, loading } = useLiveQuery<StudentSessionDetail>(
    // Not called until a row is opened: the hook's own guard is the token, so
    // the id being null is handled by never resolving a request for it.
    sessionId ? run : NEVER,
    [studentId, sessionId],
  );

  return {
    detail: sessionId ? data : null,
    loading: Boolean(sessionId) && loading,
    failed: Boolean(sessionId) && failed,
  };
}

/**
 * A run that never settles, for the closed-panel case. Returning a rejected
 * promise would mark the query FAILED, and a panel nobody opened has not
 * failed at anything.
 */
const NEVER = () => new Promise<StudentSessionDetail>(() => {});
