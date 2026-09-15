"use client";

import { useState } from "react";
import { assignmentsApi } from "@/lib/api/assignments";
import { useLessonLibrary } from "@/hooks/useLessonLibrary";
import { cn } from "@/lib/utils";

/**
 * C08c Recommend a Lesson, for a real student.
 *
 * WHAT THIS REPLACES. `RecommendSheet` next door is fixture-shaped end to end:
 * it takes `StudentProfileData` from `lib/mocks`, reads `student.recommend!`,
 * and its send button is `onClick={() => setSent(true)}` over no network call
 * at all - then tells the teacher "That's sent to Amara". It is also
 * unreachable when signed in, because `StudentRoute` drops `recommendOpen`
 * before rendering the live profile. So the most prominent action C08c draws
 * has never once assigned a lesson.
 *
 * NO NEW ENDPOINT. `docs/BUILD_STATUS.md` filed this under NEEDS BACKEND with
 * "No POST exists to send one", which was wrong: `AssignmentCreate.studentIds`
 * takes up to 500 ids, so "recommend this lesson to this one child" is an
 * assignment with one student in it. `assignmentsApi.create` is already wrapped
 * and already tested, so this reuses it rather than adding a second path to the
 * same thing.
 *
 * TWO PARTS OF THE FRAME ARE NOT BUILT, and both are deliberate:
 *
 *  1. NO NOTE FIELD. C08c draws "Add a note for Amara (optional)" and its
 *     confirmation promises "She'll see your note when she opens it."
 *     `AssignmentCreate` and `LessonAssignmentRequest` both carry
 *     `{lessonIds/lessonId, classId, studentIds, dueAt, availableFrom}` and
 *     NEITHER has a note field - verified against the deployed spec. A note
 *     input that silently discarded what a teacher wrote about a named child
 *     would be worse than not offering one, so the field is absent and the
 *     confirmation promises only what actually happens. Raised with backend.
 *  2. NO "SUGGESTED" BADGE. The frame marks one option as Nevo's suggestion.
 *     `Recommendation` is `{id, studentId, recommendationText, generatedAt}` -
 *     prose, with no lesson id - so nothing connects Nevo's sentence to a row
 *     in the library. The sentence is shown above the list, which is what the
 *     frame's "Nevo suggests" block is; the badge needs a `lessonId` on the
 *     recommendation. Raised with backend.
 */
export function LiveRecommendSheet({
  studentId,
  firstName,
  suggestion,
  onClose,
}: {
  studentId: string;
  firstName: string;
  /** Nevo's own words, when there are any. Never invented. */
  suggestion?: string | null;
  onClose: () => void;
}) {
  const { cards, live } = useLessonLibrary();
  const [choice, setChoice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const chosen = cards.find((c) => c.id === choice) ?? null;

  async function send() {
    if (!chosen || busy) return;
    setBusy(true);
    setError(null);
    try {
      await assignmentsApi.create({
        lessonIds: [chosen.id],
        studentIds: [studentId],
      });
      setSent(chosen.title);
    } catch {
      // Nothing is confirmed until something is stored. The old sheet said
      // "That's sent" unconditionally, which is the failure this guards.
      setError(
        `We couldn${"’"}t send that just now. Nothing has changed, so you can try again.`,
      );
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <Shell onClose={onClose}>
        <h2 className="text-[19px] font-semibold text-nevo-near-black">
          {`That${"’"}s sent to ${firstName}`}
        </h2>
        <p className="mt-3 text-[14.5px] leading-[1.6] text-nevo-near-black/72">
          {`${"“"}${sent}${"”"} is now waiting in ${firstName}${"’"}s lessons.`}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 h-12 w-full cursor-pointer rounded-[10px] bg-nevo-navy text-[14.5px] font-semibold text-nevo-cream transition-[filter] hover:brightness-93"
        >
          {`Back to ${firstName}${"’"}s profile`}
        </button>
      </Shell>
    );
  }

  return (
    <Shell onClose={onClose}>
      <h2 className="text-[19px] font-semibold text-nevo-near-black">
        {`Recommend a lesson to ${firstName}`}
      </h2>

      {suggestion && (
        <div className="mt-4 rounded-[12px] bg-nevo-violet/12 px-4 py-3.5">
          <p className="text-[12.5px] font-semibold tracking-[0.04em] text-nevo-navy uppercase">
            Nevo suggests
          </p>
          <p className="mt-1.5 text-[14px] leading-[1.55] text-nevo-near-black/78">
            {suggestion}
          </p>
        </div>
      )}

      <p className="mt-5 text-[13px] font-semibold tracking-[0.04em] text-nevo-near-black/55 uppercase">
        Which lesson
      </p>

      {cards.length === 0 ? (
        <p className="mt-3 text-[14px] leading-[1.55] text-nevo-near-black/62">
          {live
            ? `Your library is empty, so there is nothing to send ${firstName} yet. Upload a lesson and it will appear here.`
            : `We couldn${"’"}t reach your library just now. Nothing has changed, so you can try again.`}
        </p>
      ) : (
        <div className="mt-3 flex max-h-[280px] flex-col gap-2 overflow-y-auto">
          {cards.map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={choice === c.id}
              onClick={() => setChoice(c.id)}
              className={cn(
                "cursor-pointer rounded-[10px] border px-3.5 py-3 text-left transition-colors",
                choice === c.id
                  ? "border-nevo-navy bg-nevo-navy/6"
                  : "border-nevo-near-black/12 hover:border-nevo-navy/35",
              )}
            >
              <span className="block text-[14.5px] font-medium text-nevo-near-black">
                {c.title}
              </span>
              {c.meta && (
                <span className="mt-0.5 block text-[12.5px] text-nevo-near-black/55">
                  {c.meta}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={onClose}
          className="h-12 flex-1 cursor-pointer rounded-[10px] border border-nevo-near-black/15 text-[14.5px] font-medium text-nevo-near-black/72"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={!chosen || busy}
          onClick={() => void send()}
          className="h-12 flex-[2] cursor-pointer rounded-[10px] bg-nevo-navy text-[14.5px] font-semibold text-nevo-cream transition-[filter] hover:brightness-93 disabled:cursor-not-allowed disabled:opacity-55"
        >
          {busy ? `Sending${"…"}` : "Recommend this lesson"}
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-3 text-[13.5px] leading-[1.5] text-nevo-navy">
          {error}
        </p>
      )}
    </Shell>
  );
}

function Shell({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end justify-center bg-nevo-near-black/28 sm:items-center"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Recommend a lesson"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90dvh] w-full max-w-[460px] overflow-y-auto rounded-t-[18px] bg-nevo-cream px-6 py-7 sm:rounded-[18px]"
      >
        {children}
      </div>
    </div>
  );
}
