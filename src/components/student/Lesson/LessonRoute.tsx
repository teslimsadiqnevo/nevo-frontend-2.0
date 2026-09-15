"use client";

import { notFound, useRouter } from "next/navigation";
import { SampleRegion } from "@/components/shared/SampleRegion";
import { useHydrated } from "@/hooks/useHydrated";
import { useStudentLesson } from "@/hooks/useStudentLesson";
import { LessonLoadingSkeleton } from "./LessonLoadingSkeleton";
import { LessonMessage } from "./LessonMessage";
import { LessonPlayer } from "./LessonPlayer";

const LESSONS_HREF = "/student/lessons";

/**
 * Resolves a lesson route, live first.
 *
 * Same shape as the teacher side's `LessonRoute`, and for the same two
 * reasons. A real lesson is only ever itself, so the live read is tried before
 * the mock registry - a lesson must never be answered with a fixture that
 * happens to share its id. And nothing that reads the token may decide before
 * the client is running: `getToken()` is false on the server, so deciding
 * early made a real lesson answer HTTP 404 on any hard load.
 *
 * The copy differs, because the reader does. A child is told what happened in
 * their own language and always has a way back to their lessons - never a bare
 * error, never a technical one, and never a page that blames them.
 */
export function LessonRoute({
  lessonId,
  review = false,
}: {
  lessonId: string;
  /** Spaced-retrieval variant (37d) - the same player, different framing. */
  review?: boolean;
}) {
  const router = useRouter();
  const {
    lesson,
    live,
    plan,
    loading,
    failed,
    empty,
    resumeAt,
    lastWorkedAt,
    adaptSegments,
  } = useStudentLesson(lessonId);
  const hydrated = useHydrated();

  // The server cannot read the token, so it cannot yet know whether this
  // lesson resolves. Draw the skeleton rather than deciding wrongly.
  if (!hydrated || loading) return <LessonLoadingSkeleton />;

  if (lesson) {
    const player = (
      <LessonPlayer
        lesson={lesson}
        plan={plan}
        live={live}
        review={review}
        startAt={resumeAt ?? 0}
        lastWorkedAt={lastWorkedAt}
        adaptSegments={adaptSegments}
      />
    );
    // `live` false means this is one of the two authored lessons, which now
    // only a SIGNED-OUT visitor can reach: `useStudentLesson` no longer answers
    // a failed or 404'd read with a mock of the same id, so a signed-in child
    // gets the honest failure below instead of invented content. The mark stays
    // regardless - it is what an end-to-end run asserts the absence of.
    return live ? (
      player
    ) : (
      <SampleRegion kind="student:lesson">{player}</SampleRegion>
    );
  }

  if (failed) {
    return (
      <LessonMessage
        title="We couldn’t open this lesson"
        body="It hasn’t gone anywhere. Give it a moment and try again."
        actionLabel="Try again"
        onAction={() => window.location.reload()}
        onBack={() => router.push(LESSONS_HREF)}
      />
    );
  }

  if (empty) {
    return (
      <LessonMessage
        title="This lesson isn’t ready yet"
        body="Nevo is still getting it set up. Your teacher will know when it’s ready."
        actionLabel="Back to my lessons"
        onAction={() => router.push(LESSONS_HREF)}
      />
    );
  }

  // Nothing resolved it. Either the live read said 404, or there was no read
  // to make - a signed-out visitor on an id the mock registry does not hold.
  // Both are genuinely "no such lesson", and falling through to `null` here
  // would render a blank screen instead of saying so.
  notFound();
}

/**
 * A calm, full-screen message in the player's own bare frame — the player runs
 * without the shell, so these states carry their own way back rather than
 * relying on a nav that is not on screen.
 */
