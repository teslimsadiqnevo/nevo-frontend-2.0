"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api/client";
import { lessonsApi, type LessonModule } from "@/lib/api/lessons";
import { getToken } from "@/lib/auth/session";
import { lessonFromContent } from "@/lib/lessons/fromContent";
import { getMockAdaptation, getMockLesson } from "@/lib/mocks";
import type { AdaptationPlan, Lesson } from "@/lib/types";
import { useHasSession } from "./useHasSession";
import { useStudentDashboard } from "./useStudentDashboard";

/**
 * The lesson a student is about to play, live-first.
 *
 * Until now this route resolved MOCK IDS ONLY - a two-entry registry - and
 * called `notFound()` on everything else. That single line is what forced
 * Home to ship its live cards unlinked and left the Lessons tab on fixtures:
 * there was nowhere for a real lesson id to go. So the read comes first here
 * and the mocks become the fallback, not the source.
 *
 * The two authored mock lessons stay reachable by id, because they are the
 * only lessons that exercise the full multi-modal player (visual, audio,
 * interactive, the calculation solver) and the designed walkthrough runs on
 * them. A signed-out visitor gets them directly.
 *
 * `missing` and `failed` are kept apart deliberately. A 404 means the lesson
 * is not there and the child should be told so; anything else means we could
 * not reach it, which is a retry. Rendering one as the other tells a child
 * their lesson was deleted when the network merely blinked.
 *
 * `empty` is its own answer: the lesson exists but carries no segments -
 * still parsing, or a parse that failed. There is nothing to play, and an
 * empty spine is not the way to say that.
 */

/** One lesson's resolved answer, stamped with the id it belongs to. */
interface Resolution {
  id: string | null;
  lesson?: Lesson;
  missing?: boolean;
  failed?: boolean;
  empty?: boolean;
}

export interface StudentLessonState {
  lesson: Lesson | null;
  /** The lesson came from the backend, so its id is real and writable. */
  live: boolean;
  /** The adaptation overlay. Mock-only: no student-facing plan endpoint exists. */
  plan: AdaptationPlan | null;
  loading: boolean;
  /** No such lesson. */
  missing: boolean;
  /** It exists as far as we know, but we could not load it. */
  failed: boolean;
  /** It loaded, and there is nothing in it to play. */
  empty: boolean;
  /**
   * The segment to open on, from the student's own saved progress. Null when
   * there is none, or when the lesson is a mock (whose ids nothing records).
   */
  resumeAt: number | null;
  /** ISO timestamp of their last activity on this lesson, when we know it. */
  lastWorkedAt: string | null;
}

export function useStudentLesson(lessonId: string): StudentLessonState {
  const signedIn = useHasSession();
  const mock = getMockLesson(lessonId);
  // Where they got to last time. Home already promises "About halfway in" off
  // this same row, so the player has to honour it - a Continue button that
  // restarts from the beginning is worse than no Continue button.
  const { data: dashboard } = useStudentDashboard();

  // One piece of state, STAMPED WITH THE ID IT DESCRIBES. Resetting four
  // separate flags at the top of the effect would clear them a render late -
  // long enough to show the previous lesson's error under this lesson's
  // title - and is a setState-in-effect besides. Stamping means a stale
  // answer is simply not this lesson's answer, with no reset at all.
  const [resolved, setResolved] = useState<Resolution>({ id: null });
  const state: Resolution = resolved.id === lessonId ? resolved : { id: null };
  const live = state.lesson ?? null;
  const missing = state.missing ?? false;
  const failed = state.failed ?? false;
  const empty = state.empty ?? false;

  useEffect(() => {
    // Signed out there is no token to read with, and the mock is the whole
    // designed experience anyway.
    if (!getToken()) return;
    let cancelled = false;

    // Modules are best-effort and come from a different endpoint. A lesson
    // plays perfectly well ungrouped, so its failure must not fail the page -
    // which means resolving it to [] rather than letting it reject the pair.
    const detail = lessonsApi.detail(lessonId);
    const modules = lessonsApi
      .modules(lessonId)
      .catch((): LessonModule[] => []);

    void Promise.all([detail, modules])
      .then(([res, mods]) => {
        if (cancelled) return;
        const built = lessonFromContent(res, mods);
        setResolved(
          built
            ? { id: lessonId, lesson: built }
            : { id: lessonId, empty: true },
        );
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        // A 404 on a lesson we also hold a mock for is not "missing" - the
        // mock answers it. Only a live-only id can genuinely be absent.
        if (err instanceof ApiError && err.status === 404) {
          if (!getMockLesson(lessonId)) setResolved({ id: lessonId, missing: true });
        } else {
          setResolved({ id: lessonId, failed: true });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [lessonId]);

  const lesson = live ?? mock;

  // `segmentPosition` is the 0-based index we wrote ourselves, so it round
  // trips - but it is clamped anyway, because a position past the end would
  // open an empty spine, and a lesson re-parsed with fewer segments is exactly
  // how that happens.
  // Newest row for this lesson, whatever its status - recency is about when
  // they last touched it, which a completed row answers just as well.
  const saved = dashboard?.recentProgress
    .filter((r) => r.lessonId === lessonId)
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))[0];
  // `exited` resumes too. The status records HOW a child left, not whether
  // they are done, and #217 already made Home show exited lessons on Pick
  // Back Up - so leaving this on `in_progress` alone produced a card reading
  // "About halfway in" that then opened the lesson at segment one. The same
  // half-fix twice: the display was corrected and the resume was not.
  const resumable = saved?.status === "in_progress" || saved?.status === "exited";
  const resumeAt =
    live && saved && resumable
      ? Math.max(0, Math.min(saved.segmentPosition, live.segments.length - 1))
      : null;

  return {
    lesson,
    live: Boolean(live),
    resumeAt,
    lastWorkedAt: saved?.updatedAt ?? null,
    // The adaptation plan has no student-facing endpoint; a live lesson plays
    // unadapted rather than borrowing another lesson's plan.
    plan: live ? null : getMockAdaptation(lessonId),
    loading: signedIn && !lesson && !missing && !failed && !empty,
    // A mock covers the id, so nothing is missing even if the live read 404'd.
    missing: missing && !mock,
    failed: failed && !mock,
    empty: empty && !mock,
  };
}
