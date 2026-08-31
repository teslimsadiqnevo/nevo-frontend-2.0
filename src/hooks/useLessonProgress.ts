"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  LESSON_STATUS,
  lessonsApi,
  type LessonStatus,
} from "@/lib/api/lessons";
import { getToken } from "@/lib/auth/session";

/**
 * Writes down where a child has got to in a lesson.
 *
 * Nothing did this before. The player tracked position in React state, wrote
 * the assessment answers to sessionStorage, and on completion called
 * `router.push(HOME_HREF)` - that was the entire completion handler. Both
 * endpoints have been deployed the whole time and neither was called, so
 * closing the tab returned a lesson to unstarted and nothing a child did ever
 * accumulated.
 *
 * `POST /session` opens the session and `PUT /progress` requires its id, so
 * the session is opened first and every report waits on it. Reports that
 * arrive before it lands are held (one deep - only the latest position
 * matters) and flushed when it does, rather than dropped.
 *
 * ORDERING. Positions can complete out of order on a slow connection, and a
 * stale one landing last would move a child backwards. Each write carries a
 * sequence number and a response is only honoured if it is still the newest.
 *
 * FAILURE. Segment writes are best-effort and silent: interrupting a child
 * mid-lesson over a position that the next advance will re-send is the wrong
 * trade. The COMPLETION write is not - that is the one that decides whether
 * the lesson counts - so `completionFailed` is surfaced and the completion
 * screen says so, the way the daily warm-up already does.
 */

export interface LessonProgressState {
  /** Report a position. Safe to call before the session exists. */
  report: (
    status: LessonStatus,
    position: { segment?: number; module?: number },
  ) => void;
  /** The completion write did not reach Nevo. */
  completionFailed: boolean;
  /** True once a completion write has landed. */
  completionSaved: boolean;
  /**
   * The session id the backend issued. Signals need the SAME id - the ingest
   * contract wants a UUID and `PUT /progress` wants this one, which is the
   * backend saying progress and signals are one session, not two.
   */
  sessionId: string | null;
}

const IDLE: LessonProgressState = {
  report: () => {},
  completionFailed: false,
  completionSaved: false,
  sessionId: null,
};

export function useLessonProgress(
  lessonId: string,
  /**
   * False for the two authored mock lessons: their ids are not real, so a
   * write would 404 and a failure banner would be our own fault, not the
   * network's.
   */
  enabled: boolean,
): LessonProgressState {
  const sessionId = useRef<string | null>(null);
  // Mirrored into state as well: the ref keeps the writes synchronous, and
  // signals need a re-render to learn the id exists.
  const [issued, setIssued] = useState<string | null>(null);
  const pending = useRef<{
    status: LessonStatus;
    segment?: number;
    module?: number;
  } | null>(null);
  const seq = useRef(0);
  const landed = useRef(0);
  const [completionFailed, setCompletionFailed] = useState(false);
  const [completionSaved, setCompletionSaved] = useState(false);

  const write = useCallback(
    (
      status: LessonStatus,
      position: { segment?: number; module?: number },
    ) => {
      const id = sessionId.current;
      if (!id) return;
      const ticket = ++seq.current;
      const completing = status === LESSON_STATUS.COMPLETED;

      void lessonsApi
        .saveProgress(lessonId, {
          sessionId: id,
          status,
          ...(position.segment !== undefined
            ? { segmentPosition: position.segment }
            : {}),
          ...(position.module !== undefined
            ? { modulePosition: position.module }
            : {}),
        })
        .then(() => {
          // A stale response must not overwrite a newer position.
          if (ticket < landed.current) return;
          landed.current = ticket;
          if (completing) {
            setCompletionSaved(true);
            setCompletionFailed(false);
          }
        })
        .catch(() => {
          // Only completion is worth telling a child about - see the docblock.
          if (completing) setCompletionFailed(true);
        });
    },
    [lessonId],
  );

  useEffect(() => {
    if (!enabled || !getToken()) return;
    let cancelled = false;

    void lessonsApi
      .startSession(lessonId)
      .then((res) => {
        if (cancelled) return;
        sessionId.current = res.sessionId;
        setIssued(res.sessionId);
        // Anything reported while the session was opening.
        const held = pending.current;
        pending.current = null;
        if (held) write(held.status, held);
      })
      .catch(() => {
        // No session means no progress endpoint to call. A lesson still plays
        // perfectly well; it just will not be recorded, and the completion
        // screen is where that gets said.
        if (!cancelled) setCompletionFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [lessonId, enabled, write]);

  const report = useCallback<LessonProgressState["report"]>(
    (status, position) => {
      if (!enabled || !getToken()) return;
      if (!sessionId.current) {
        // Hold the latest only - an older position is never worth sending.
        pending.current = { status, ...position };
        return;
      }
      write(status, position);
    },
    [enabled, write],
  );

  if (!enabled) return IDLE;
  return { report, completionFailed, completionSaved, sessionId: issued };
}
