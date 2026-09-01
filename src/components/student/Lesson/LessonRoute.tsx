"use client";

import { notFound, useRouter } from "next/navigation";
import { useHydrated } from "@/hooks/useHydrated";
import { useStudentLesson } from "@/hooks/useStudentLesson";
import { LessonLoadingSkeleton } from "./LessonLoadingSkeleton";
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
  const { lesson, live, plan, loading, failed, empty, resumeAt, lastWorkedAt } =
    useStudentLesson(lessonId);
  const hydrated = useHydrated();

  // The server cannot read the token, so it cannot yet know whether this
  // lesson resolves. Draw the skeleton rather than deciding wrongly.
  if (!hydrated || loading) return <LessonLoadingSkeleton />;

  if (lesson) {
    return (
      <LessonPlayer
        lesson={lesson}
        plan={plan}
        live={live}
        review={review}
        startAt={resumeAt ?? 0}
        lastWorkedAt={lastWorkedAt}
      />
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
function LessonMessage({
  title,
  body,
  actionLabel,
  onAction,
  onBack,
}: {
  title: string;
  body: string;
  actionLabel: string;
  onAction: () => void;
  onBack?: () => void;
}) {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-nevo-cream px-6 text-nevo-near-black">
      <div className="w-full max-w-[420px] rounded-[16px] bg-nevo-cream-elevated p-[26px] shadow-elevation-1">
        <h1 className="text-[20px] font-semibold tracking-[-0.01em]">{title}</h1>
        <p className="mt-2.5 text-[15.5px] leading-[1.55] text-nevo-near-black/70">
          {body}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onAction}
            className="h-12 cursor-pointer rounded-[10px] bg-nevo-navy px-6 text-[15px] font-semibold text-nevo-cream transition-[filter,transform] hover:brightness-109 active:scale-[0.985]"
          >
            {actionLabel}
          </button>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="h-12 cursor-pointer rounded-[10px] px-5 text-[15px] font-medium text-nevo-navy transition-colors hover:bg-nevo-near-black/[0.05]"
            >
              Back to my lessons
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
