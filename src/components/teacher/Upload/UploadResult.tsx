"use client";

import Link from "next/link";
import type {
  ContentModality,
  LessonContentType,
  ParseContentResponse,
  ParsedLessonSegment,
} from "@/lib/api/content";
import { cn } from "@/lib/utils";

/**
 * What came back from a real upload (C07g step 3, honestly).
 *
 * The frame's section review groups segments into modules and shows a
 * per-segment minute estimate. Neither exists in the response: modules live in
 * the staged pipeline's `structure`, which the spec declares as a free-form
 * object with no fields, and minutes have no source at all. So this reviews
 * what the parser actually produced - the segments in order, their kind, and
 * which ones it wants confirmed and why.
 *
 * The lesson already exists by the time this renders: `POST /api/content/upload`
 * creates it. There is no separate commit step on this path, so the screen
 * says the lesson is saved rather than implying a pending decision.
 *
 * The staged `structure` is typed as of 31 Aug and gained `lessons[]` on
 * 1 Sep, so the module-grouping half of C07g is built - on the block path,
 * in `LiveStructureTree`. This screen is the SINGLE-lesson outcome and stays
 * as it is.
 */

const TYPE_LABEL: Record<LessonContentType, string> = {
  explanatory_text: "Explanatory",
  worked_example: "Worked example",
  practice_question: "Practice",
  visual_diagram: "Diagram",
  definition: "Definition",
  summary: "Summary",
  calculation: "Calculation",
};

const MODALITY_LABEL: Record<ContentModality, string> = {
  text: "text",
  audio: "audio",
  visual: "visual",
  interactive: "interactive",
};

function Segment({ segment, index }: { segment: ParsedLessonSegment; index: number }) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 px-[22px] py-4 xl:flex-row xl:items-start xl:gap-4",
        segment.needsReview && "border-l-[3px] border-nevo-violet",
      )}
    >
      <span className="w-6 shrink-0 text-[13px] text-nevo-near-black/40 tabular-nums">
        {index + 1}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-[15px] font-semibold text-nevo-near-black">
            {segment.title ?? `Section ${index + 1}`}
          </span>
          <span className="shrink-0 rounded-full bg-nevo-navy/9 px-[9px] py-0.5 text-[11px] font-semibold whitespace-nowrap text-nevo-near-black/55">
            {TYPE_LABEL[segment.contentType] ??
              segment.contentType.replace(/_/g, " ")}
          </span>
        </div>
        {segment.body && (
          <p className="mt-1.5 line-clamp-2 max-w-[62ch] text-[13.5px] leading-[1.5] text-nevo-near-black/62">
            {segment.body}
          </p>
        )}
        {segment.needsReview && (
          <p className="mt-2 text-[13px] leading-[1.5] text-nevo-navy">
            Worth a look
            {segment.reviewReasons.length > 0 &&
              ` – ${segment.reviewReasons.map((r) => r.replace(/_/g, " ").toLowerCase()).join(", ")}`}
          </p>
        )}
      </div>
      {segment.availableModalities.length > 0 && (
        <span className="shrink-0 text-[12.5px] text-nevo-near-black/45">
          {segment.availableModalities
            .map((m) => MODALITY_LABEL[m] ?? m)
            .join(" · ")}
        </span>
      )}
    </div>
  );
}

export function UploadResult({
  lesson,
  fileName,
  onUploadAnother,
}: {
  lesson: ParseContentResponse;
  fileName: string;
  onUploadAnother: () => void;
}) {
  const segments = [...lesson.segments].sort(
    (a, b) => a.sequenceOrder - b.sequenceOrder,
  );
  const review = lesson.reviewSegmentCount;

  return (
    <div className="mx-auto w-full max-w-[860px] px-6 pb-10">
      <h2 className="text-[23px] font-semibold tracking-[-0.015em] text-nevo-near-black xl:text-[26px]">
        {lesson.title}
      </h2>
      <p className="mt-[5px] text-[14.5px] text-nevo-near-black/60">
        {`From ${fileName} · ${lesson.segmentCount} ${lesson.segmentCount === 1 ? "section" : "sections"}`}
      </p>

      <div className="mt-5 flex max-w-[660px] items-start gap-3.5 rounded-[12px] bg-nevo-cream-elevated px-[22px] py-5 shadow-elevation-1">
        <span className="mt-px shrink-0 text-nevo-navy">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </span>
        <div>
          <h3 className="text-[15.5px] font-semibold text-nevo-near-black xl:text-base">
            Saved to your library
          </h3>
          <p className="mt-1.5 text-sm leading-[1.55] text-nevo-near-black/68 xl:text-[14.5px]">
            {review > 0
              ? `Nevo read your file and split it into ${lesson.segmentCount} sections. ${review} ${review === 1 ? "is worth" : "are worth"} a look before you assign it.`
              : "Nevo read your file and split it into sections. Nothing needs your attention."}
          </p>
        </div>
      </div>

      {lesson.confirmationSummary && (
        <p className="mt-4 max-w-[68ch] text-[14.5px] leading-[1.6] text-nevo-near-black/72">
          {lesson.confirmationSummary}
        </p>
      )}

      <h3 className="mt-8 text-[13.5px] font-semibold tracking-[0.04em] text-nevo-near-black/55 uppercase xl:text-sm">
        What Nevo found
      </h3>
      <div className="mt-3.5 divide-y divide-nevo-near-black/7 overflow-hidden rounded-[12px] bg-nevo-cream-elevated shadow-elevation-1 xl:mt-4">
        {segments.map((s, i) => (
          <Segment key={s.id} segment={s} index={i} />
        ))}
      </div>

      <div className="mt-7 flex flex-wrap items-center gap-3">
        <Link
          href={`/teacher/lessons/${lesson.lessonId}`}
          className="inline-flex h-[50px] cursor-pointer items-center rounded-[10px] bg-nevo-navy px-[22px] text-[15px] font-semibold text-nevo-cream transition-[filter] hover:brightness-93"
        >
          Open the lesson
        </Link>
        <button
          type="button"
          onClick={onUploadAnother}
          className="inline-flex h-[50px] cursor-pointer items-center rounded-[10px] border-[1.5px] border-nevo-navy/35 px-[22px] text-[15px] font-medium text-nevo-navy transition-colors hover:bg-nevo-navy/6"
        >
          Upload another
        </button>
      </div>
    </div>
  );
}
