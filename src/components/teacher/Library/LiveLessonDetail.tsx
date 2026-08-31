"use client";

import Link from "next/link";
import type { Assignment } from "@/lib/api/assignments";
import type {
  LessonClassProgress,
  LessonContentType,
  LessonDetailResponse,
  LessonModule,
  LessonSegment,
  SegmentProgress,
} from "@/lib/api/lessons";
import { cn } from "@/lib/utils";

/**
 * Lesson detail for a real lesson (C06b), built from what
 * `GET /api/content/lessons/{id}` actually returns.
 *
 * WHAT IS REAL. The segments: their order, their kind, their titles, the
 * modalities Nevo can offer each one in, and - the useful part - which of them
 * the parser wants a human to confirm, with its reasons.
 *
 * WHAT IS NOT HERE, and why. C06b's assigned layout leads with three stat
 * cards (assigned to, finished, opened) and two written notes about where the
 * class slowed. None of that has a source: the lesson carries no progress, and
 * no endpoint reports per-segment completion. Rather than draw empty bars, the
 * screen reports what it knows - who the lesson is assigned to, from the
 * assignments list - and leaves the rest out. The frame's principle for a
 * quiet week applies: the section simply is not there.
 *
 * Segments are grouped into the parser's modules when it made any, with each
 * module's preview and recap. That grouping only exists on the v1 lesson
 * alias, whose own segments drop the review flags - so the screen asks both
 * routes and joins them here rather than trading one for the other.
 *
 * PER-SEGMENT PROGRESS is live where the lesson was assigned to a class
 * (`GET /api/v1/lessons/{id}/class-progress`), which restores C06b's progress
 * rows and its "where the class slowed" note - the note is written
 * server-side, so it is quoted rather than composed here. A lesson assigned
 * only to individuals has no class to report on and simply has no progress.
 * TODO(design): C06b has no treatment for a segment needing review, which is
 * the most actionable thing this endpoint returns.
 */

const SECTION_H =
  "text-[13.5px] font-semibold tracking-[0.04em] text-nevo-near-black/55 uppercase xl:text-sm";

/** The spec's content types, in the frame's own vocabulary. */
const TYPE_LABEL: Record<LessonContentType, string> = {
  explanatory_text: "Explanatory",
  worked_example: "Worked example",
  practice_question: "Practice",
  visual_diagram: "Diagram",
  definition: "Definition",
  summary: "Summary",
  calculation: "Calculation",
};

function typeLabel(t: string): string {
  return TYPE_LABEL[t as LessonContentType] ?? t.replace(/_/g, " ");
}

/** `needs_media_review` -> "needs media review". */
function reasonLabel(r: string): string {
  return r.replace(/_/g, " ").toLowerCase();
}

function TypeTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="shrink-0 rounded-full bg-nevo-navy/9 px-[9px] py-0.5 text-[11px] font-semibold whitespace-nowrap text-nevo-near-black/55">
      {children}
    </span>
  );
}

function SegmentRow({
  segment,
  index,
  progress,
  slowest,
}: {
  segment: LessonSegment;
  index: number;
  progress?: SegmentProgress;
  slowest?: boolean;
}) {
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
          <TypeTag>{typeLabel(segment.contentType)}</TypeTag>
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
              ` – ${segment.reviewReasons.map(reasonLabel).join(", ")}`}
          </p>
        )}
      </div>
      {progress ? (
        <div className="flex shrink-0 items-center gap-3.5">
          <div className="h-1.5 w-[130px] overflow-hidden rounded-full bg-nevo-navy/14">
            <span
              /* Violet where the class slowed - C06b's rule is that a dip is
                 never red, and never reads as a scoreboard. */
              className={cn(
                "block h-full rounded-full",
                slowest ? "bg-nevo-violet" : "bg-nevo-navy",
              )}
              style={{
                width: `${Math.round(Math.max(0, Math.min(1, progress.completionRate)) * 100)}%`,
              }}
            />
          </div>
          <span className="w-[120px] text-right text-sm text-nevo-near-black/68">
            {`${progress.completionCount} of ${progress.assignedStudentCount} done`}
          </span>
        </div>
      ) : (
        segment.availableModalities.length > 0 && (
          <span className="shrink-0 text-[12.5px] text-nevo-near-black/45">
            {segment.availableModalities.join(" · ")}
          </span>
        )
      )}
    </div>
  );
}

export function LiveLessonDetail({
  lesson,
  modules,
  assignments,
  progress,
  classCount = 0,
}: {
  lesson: LessonDetailResponse;
  modules: LessonModule[];
  assignments: Assignment[];
  progress?: LessonClassProgress | null;
  /** How many classes hold this lesson; >1 means the rows name one of them. */
  classCount?: number;
}) {
  const bySegment = new Map(
    (progress?.segments ?? []).map((p) => [p.segmentId, p]),
  );
  const segments = [...lesson.segments].sort(
    (a, b) => a.sequenceOrder - b.sequenceOrder,
  );
  const needsReview = segments.filter((s) => s.needsReview).length;

  // Group by module where the parser made any. A segment the modules do not
  // claim still has to appear - a lesson that silently hid a section would be
  // worse than an ungrouped one - so leftovers land in a trailing group.
  const claimed = new Set(modules.flatMap((m) => m.segmentIds));
  const grouped =
    modules.length === 0
      ? []
      : [
          ...modules.map((m) => ({
            module: m as LessonModule | null,
            segments: segments.filter((s) => m.segmentIds.includes(s.id)),
          })),
          ...(segments.some((s) => !claimed.has(s.id))
            ? [
                {
                  module: null,
                  segments: segments.filter((s) => !claimed.has(s.id)),
                },
              ]
            : []),
        ].filter((g) => g.segments.length > 0);
  const students = new Set(assignments.map((a) => a.studentId)).size;
  const nextDue = assignments
    .map((a) => a.dueAt)
    .filter((d): d is string => Boolean(d))
    .sort()[0];

  return (
    <div className="mx-auto w-full max-w-[1040px] px-[38px] py-[34px] xl:px-[52px] xl:py-11">
      <div className="mx-auto max-w-[860px]">
        <Link
          href="/teacher/lessons"
          className="inline-flex cursor-pointer items-center gap-[7px] text-sm text-nevo-near-black/60 transition-transform active:scale-[0.99]"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M15 6l-6 6 6 6" />
          </svg>
          Lesson Library
        </Link>

        <h2 className="mt-4 text-[23px] font-semibold tracking-[-0.015em] text-nevo-near-black xl:text-[26px]">
          {lesson.title}
        </h2>
        <span className="mt-[5px] block text-[14.5px] text-nevo-near-black/60">
          {`${lesson.segmentCount} ${lesson.segmentCount === 1 ? "section" : "sections"}`}
          {students > 0 &&
            ` · Assigned to ${students} ${students === 1 ? "student" : "students"}`}
          {nextDue &&
            ` · Due ${new Date(nextDue).toLocaleDateString("en-GB", { day: "numeric", month: "long" })}`}
        </span>

        {needsReview > 0 && (
          <div className="mt-6 flex max-w-[660px] items-start gap-3.5 rounded-[12px] bg-nevo-violet/14 px-[18px] py-4">
            <span className="mt-px shrink-0 text-nevo-navy">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <circle cx="12" cy="12" r="9" />
                <path d="M12 8h.01M11 12h1v4h1" />
              </svg>
            </span>
            <p className="text-[14.5px] leading-[1.55] text-nevo-near-black/78">
              <strong className="font-semibold text-nevo-near-black">
                {`${needsReview} ${needsReview === 1 ? "section wants" : "sections want"} a look:`}
              </strong>{" "}
              Nevo wasn&rsquo;t confident it read these correctly. They&rsquo;re
              marked below.
            </p>
          </div>
        )}

        {lesson.confirmationSummary && (
          <p className="mt-4 max-w-[68ch] text-[14.5px] leading-[1.6] text-nevo-near-black/72">
            {lesson.confirmationSummary}
          </p>
        )}

        {progress?.slowdownNote && (
          <p className="mt-5 max-w-[68ch] rounded-[12px] bg-nevo-violet/14 px-[18px] py-4 text-[14.5px] leading-[1.6] text-nevo-near-black/82">
            {progress.slowdownNote}
          </p>
        )}

        <h3 className={cn(SECTION_H, "mt-8")}>
          What&rsquo;s in this lesson
          {progress && classCount > 1 && (
            <span className="ml-2 font-normal tracking-normal text-nevo-near-black/45 normal-case">
              {"progress shown for one class"}
            </span>
          )}
        </h3>
        {segments.length > 0 && grouped.length > 0 ? (
          <div className="mt-3.5 flex flex-col gap-4 xl:mt-4">
            {grouped.map((g) => (
              <div key={g.module?.id ?? "ungrouped"}>
                <h4 className="text-[14.5px] font-semibold text-nevo-near-black">
                  {g.module?.title ?? "Also in this lesson"}
                </h4>
                {g.module?.preview && (
                  <p className="mt-1 max-w-[64ch] text-[13.5px] leading-[1.5] text-nevo-near-black/62">
                    {g.module.preview}
                  </p>
                )}
                <div className="mt-2.5 divide-y divide-nevo-near-black/7 overflow-hidden rounded-[12px] bg-nevo-cream-elevated shadow-elevation-1">
                  {g.segments.map((s) => (
                    <SegmentRow
                      key={s.id}
                      segment={s}
                      index={segments.indexOf(s)}
                      progress={bySegment.get(s.id)}
                      slowest={progress?.slowestSegmentId === s.id}
                    />
                  ))}
                </div>
                {g.module?.recap && (
                  <p className="mt-2 max-w-[64ch] text-[13px] leading-[1.5] text-nevo-near-black/55 italic">
                    {g.module.recap}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : segments.length > 0 ? (
          <div className="mt-3.5 divide-y divide-nevo-near-black/7 overflow-hidden rounded-[12px] bg-nevo-cream-elevated shadow-elevation-1 xl:mt-4">
            {segments.map((s, i) => (
              <SegmentRow
                key={s.id}
                segment={s}
                index={i}
                progress={bySegment.get(s.id)}
                slowest={progress?.slowestSegmentId === s.id}
              />
            ))}
          </div>
        ) : (
          <div className="mt-3.5 rounded-[12px] bg-nevo-cream-elevated px-[22px] py-6 shadow-elevation-1">
            <p className="text-[14.5px] leading-[1.55] text-nevo-near-black/68">
              {lesson.status === "failed"
                ? "Nevo couldn’t read this file, so there are no sections to show."
                : "Nevo is still reading this lesson. Sections will appear here once it’s done."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
