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
}

export function useStudentLesson(lessonId: string): StudentLessonState {
  const signedIn = useHasSession();
  const mock = getMockLesson(lessonId);
  // Where they got to last time. Home already promises "About halfway in" off
  // this same row, so the player has to honour it - a Continue button that
  // restarts from the beginning is worse than no Continue button.
  const { data: dashboard } = useStudentDashboard();

  const [live, setLive] = useState<Lesson | null>(null);
  const [missing, setMissing] = useState(false);
  const [failed, setFailed] = useState(false);
  const [empty, setEmpty] = useState(false);

  useEffect(() => {
    // Signed out there is no token to read with, and the mock is the whole
    // designed experience anyway.
    if (!getToken()) return;
    let cancelled = false;

    setLive(null);
    setMissing(false);
    setFailed(false);
    setEmpty(false);

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
        if (built) setLive(built);
        else setEmpty(true);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        // A 404 on a lesson we also hold a mock for is not "missing" - the
        // mock answers it. Only a live-only id can genuinely be absent.
        if (err instanceof ApiError && err.status === 404) {
          if (!getMockLesson(lessonId)) setMissing(true);
        } else {
          setFailed(true);
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
  const saved = dashboard?.recentProgress
    .filter((r) => r.lessonId === lessonId && r.status === "in_progress")
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))[0];
  const resumeAt =
    live && saved
      ? Math.max(0, Math.min(saved.segmentPosition, live.segments.length - 1))
      : null;

  return {
    lesson,
    live: Boolean(live),
    resumeAt,
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
