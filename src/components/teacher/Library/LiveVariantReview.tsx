"use client";

import Link from "next/link";
import { useState } from "react";
import { IllustrationWrapper } from "@/components/shared/IllustrationWrapper";
import type { LessonSegment } from "@/lib/api/lessons";
import type { SegmentReviewReason } from "@/lib/api/lessons";
import { VARIANT_ORIENTATION, VARIANT_TABS, type VariantTab } from "@/lib/mocks/teacherIntelligence";
import { cn } from "@/lib/utils";

/**
 * Variant review, on the teacher's OWN lesson (C16d).
 *
 * The designed screen next door (`VariantReview.tsx`) renders hand-written
 * preview paragraphs, and this one reads the real thing.
 *
 * THE FIELDS WERE NEVER MISSING, which is not what this console believed.
 * Backend, 11 Sep: both `GET /api/content/lessons/{id}` and
 * `GET /api/v1/lessons/{id}` have carried `textVariant`, `visualVariant`,
 * `audioVariant`, `interactiveVariant`, `calculationVariant` and
 * `comprehensionCheckpoints` on every segment THROUGHOUT. What was missing was
 * CONTENT: the parse was silently falling back to deterministic text on every
 * lesson for weeks, so the fields were present and always null - and we read
 * "always null" as "not in the contract" and wrote that down as a contract
 * fact. `docs/BUILD_STATUS.md` then carried it as a backend blocker.
 *
 * The lesson worth keeping: a field that is always null is not evidence of a
 * missing field. Check the schema, not the payload.
 *
 * So this screen asks for nothing new - it reads what `useLessonDetail` had
 * already loaded for the lesson page and thrown away.
 *
 * FOUR TABS, NOT FIVE, and that is deliberate. `calculationVariant` is the
 * fifth variant on the contract and C16d draws no tab for it, so adding one
 * would mean inventing a tab, its label and its layout. Raised with design;
 * until they answer, a segment's calculation variant is simply not shown here,
 * which is a gap worth knowing about rather than a gap worth guessing at.
 *
 * WHAT IS NOT RENDERED, and why:
 *  - `interactiveVariant.answerKey`. The frame draws nothing for it, and a
 *    teacher reviewing whether a variant reads well does not need the answer to
 *    do that. Easy to add if design asks.
 *  - An audio PLAYER. `AudioVariant.requiresAuthentication` is true for private
 *    storage URLs, and `urlExpiresInSeconds` means a URL can age out, so a bare
 *    `<audio src>` would render a control that silently fails. The script is
 *    what tells a teacher whether the narration is any good; the player can come
 *    when there is a refresh path through `POST /api/content/media/url`.
 */

/**
 * DEVIATION FROM THE FRAME, flagged rather than hidden: C16d draws no review
 * banner, because when it was drawn there was nothing to put in one.
 * `needsReview` and `reviewReasons` are now required fields on every segment,
 * and the contract's own description of the reason enum says the console is
 * meant to render copy per reason - "Enumerated so the console can render its
 * own copy per reason instead of printing the raw token with underscores
 * swapped for spaces."
 *
 * A screen called variant review that hides the backend's own "this needs
 * review, and here is why" would be the wrong reading of the frame's silence.
 * Design to confirm the placement and wording.
 */
const REVIEW_REASON_COPY: Record<SegmentReviewReason, string> = {
  deterministic_parse_used:
    "Nevo could not read this lesson's structure on its own, so this section was split by a simpler rule. Worth checking the section starts and ends where you would put them.",
  fewer_than_two_modalities:
    "Only one way of presenting this section came through, so there is little for Nevo to choose between when a student needs it differently.",
  audio_generation_failed: "The narrated version did not generate.",
  calculation_audio_generation_failed:
    "The narration for the worked steps did not generate.",
  visual_generation_failed: "The visual version did not generate.",
  visual_variant_image_generation_failed:
    "The picture for the visual version did not generate.",
};

/**
 * A reason the backend adds after this console ships still has to read as
 * English. The fallback deliberately does NOT repeat the banner heading - the
 * first draft did, and a segment with an unknown reason showed the same
 * sentence twice.
 */
function reasonCopy(reason: string): string {
  return (
    REVIEW_REASON_COPY[reason as SegmentReviewReason] ??
    "Nevo gave a reason this console doesn’t recognise yet."
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[13.5px] leading-[1.6] text-nevo-near-black/55 italic">
      {children}
    </p>
  );
}

function Para({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[13.5px] leading-[1.6] text-nevo-near-black/72">
      {children}
    </p>
  );
}

function VariantBody({ tab, segment }: { tab: VariantTab; segment: LessonSegment }) {
  if (tab === "Text") {
    const v = segment.textVariant;
    if (!v) return <Empty>Nevo has not generated a written version of this section.</Empty>;
    return (
      <div className="flex flex-col gap-2.5">
        <Para>{v.body}</Para>
        {v.keyPoints.length > 0 && (
          <ul className="mt-0.5 flex flex-col gap-1.5">
            {v.keyPoints.map((point) => (
              <li
                key={point}
                className="flex gap-2 text-[13.5px] leading-[1.6] text-nevo-near-black/72"
              >
                <span aria-hidden className="text-nevo-navy/50">
                  •
                </span>
                {point}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  if (tab === "Visual") {
    const v = segment.visualVariant;
    if (!v) return <Empty>Nevo has not generated a visual version of this section.</Empty>;
    return (
      <div className="flex flex-col gap-3">
        {v.imageUrl && (
          <IllustrationWrapper
            src={v.imageUrl}
            alt={v.caption || "Visual version of this section"}
            width={720}
            height={420}
            className="rounded-[10px]"
          />
        )}
        {v.caption && <Para>{v.caption}</Para>}
        {/* The frame draws no sign-off line, but "reviewed by nobody" is the
            thing a reviewer most wants to know on a review screen. */}
        <p className="text-[12.5px] text-nevo-near-black/55">
          {v.reviewedBy
            ? `Signed off by ${v.reviewedBy}.`
            : "No one has signed this picture off yet."}
        </p>
      </div>
    );
  }

  if (tab === "Audio") {
    const v = segment.audioVariant;
    if (!v) return <Empty>Nevo has not generated a narrated version of this section.</Empty>;
    const seconds = Math.round(v.durationMs / 1000);
    return (
      <div className="flex flex-col gap-2.5">
        <Para>{v.script}</Para>
        {seconds > 0 && (
          <p className="text-[12.5px] text-nevo-near-black/55">
            {`About ${Math.max(1, Math.round(seconds / 60))} minute${
              seconds >= 90 ? "s" : ""
            } of narration.`}
          </p>
        )}
      </div>
    );
  }

  const v = segment.interactiveVariant;
  if (!v) return <Empty>Nevo has not generated an interactive version of this section.</Empty>;
  return (
    <div className="flex flex-col gap-2.5">
      <Para>{v.prompt}</Para>
      {v.instructions && <Para>{v.instructions}</Para>}
      {v.options.length > 0 && (
        <ul className="mt-0.5 flex flex-col gap-1.5">
          {v.options.map((o, i) => (
            <li
              key={`${String(o)}-${i}`}
              className="rounded-[8px] bg-nevo-cream px-3 py-2 text-[13.5px] leading-[1.5] text-nevo-near-black/72"
            >
              {String(o)}
            </li>
          ))}
        </ul>
      )}
      {v.expectedInteraction && (
        <p className="text-[12.5px] text-nevo-near-black/55">
          {`Students respond by: ${v.expectedInteraction}.`}
        </p>
      )}
    </div>
  );
}

export function LiveVariantReview({
  lessonId,
  lessonTitle,
  segment,
  sectionIndex,
}: {
  lessonId: string;
  lessonTitle: string;
  segment: LessonSegment;
  sectionIndex: number;
}) {
  const [tab, setTab] = useState<VariantTab>("Text");

  return (
    <div className="mx-auto w-full max-w-[1040px] px-[38px] py-[34px] xl:px-[52px] xl:py-11">
      <div className="mx-auto max-w-[680px] xl:max-w-[820px]">
        <Link
          href={`/teacher/lessons/${lessonId}`}
          className="inline-flex cursor-pointer items-center gap-[7px] text-[13px] text-nevo-near-black/55 transition-transform active:scale-[0.99] xl:text-[13.5px]"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M15 6l-6 6 6 6" />
          </svg>
          Lesson Library · Variant review
        </Link>

        <h2 className="mt-0.5 text-[22px] font-semibold tracking-[-0.018em] text-nevo-near-black xl:text-[26px]">
          {`${lessonTitle} · Section ${sectionIndex}`}
        </h2>
        {segment.title && (
          <p className="mt-1 text-[14px] text-nevo-near-black/60">{segment.title}</p>
        )}

        <p className="mt-4 text-[13px] leading-[1.6] text-nevo-near-black/60 italic">
          {VARIANT_ORIENTATION}
        </p>

        {segment.needsReview && (
          <div className="mt-4 rounded-[12px] border border-nevo-violet/35 bg-nevo-violet/10 px-[18px] py-4">
            <p className="text-[13.5px] font-semibold text-nevo-near-black">
              Nevo flagged this section for a look
            </p>
            <div className="mt-1.5 flex flex-col gap-1.5">
              {segment.reviewReasons.map((reason) => (
                <p
                  key={reason}
                  className="text-[13px] leading-[1.55] text-nevo-near-black/72"
                >
                  {reasonCopy(reason)}
                </p>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2 xl:flex-nowrap" role="tablist" aria-label="Lesson variants">
          {VARIANT_TABS.map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={cn(
                "inline-flex h-9 cursor-pointer items-center rounded-[8px] px-[18px] text-[13px] transition-[background-color,transform] active:scale-[0.99]",
                tab === t
                  ? "bg-nevo-navy font-semibold text-nevo-cream"
                  : "bg-nevo-cream-elevated font-medium text-nevo-near-black/70 hover:bg-nevo-navy/8",
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="mt-4 rounded-[12px] bg-nevo-cream-elevated p-[22px] xl:p-6">
          <h3 className="text-[14px] font-semibold text-nevo-near-black xl:text-[15px]">
            {`${tab} variant`}
          </h3>
          <div className="mt-3">
            <VariantBody tab={tab} segment={segment} />
          </div>
        </div>
      </div>
    </div>
  );
}
