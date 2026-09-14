import Link from "next/link";
import type { UploadStage } from "@/lib/api/uploads";
import { cn } from "@/lib/utils";

/**
 * Block-path parse progress (C07e, SCRUM-102.3): one calm present-tense line
 * at a time, the non-numeric four-rung ladder showing position, and the plain
 * leave-and-return note. As soon as a level is identified the teacher can
 * open it and start steering while later levels run - the done rungs carry
 * "Open and steer" into the structure tree.
 *
 * Presentational: the wizard owns the stage clock (mock until the parse
 * seam). NOTE: the C07e frame's own head reads "STEP 2 OF 5 / 40%", which
 * contradicts the C07g flow map (parse = step 3) - the wizard keeps 3 OF 5
 * at 50% per the audit; flagged to design.
 */

/**
 * THREE RUNGS, ONE PER `UploadStage`, and that is the whole rule.
 *
 * Design, 14 Sep: "never draw a rung the backend doesn't report." The ladder
 * had four rungs invented to match C07e's drawing, driven by a mock clock, and
 * `UploadStage` reports three - `lessons | structure | complete`. So a teacher
 * watched a four-step story about a three-step process, and on the LIVE path
 * did not see the ladder at all: a real upload id routed to a plain spinner,
 * because there was no honest way to map three values onto four rungs.
 *
 * Labels are design's own words. `complete` is a rung like the others rather
 * than the ladder resolving, which was the reading design confirmed after I
 * flagged that "three rungs" and "completion is the whole ladder resolved"
 * pulled in different directions - `complete` is reported, so it ticks.
 *
 * Keyed by the enum rather than positional, so a new stage value cannot
 * silently shift a teacher onto the wrong rung.
 */
export const PARSE_STAGES: { stage: UploadStage; label: string }[] = [
  { stage: "lessons", label: "Reading your upload" },
  { stage: "structure", label: "Breaking it into segments" },
  { stage: "complete", label: "Ready to review" },
];

/**
 * Where a stage sits on the ladder. `-1` for a value we do not know, and for
 * `null` - which the hook uses before the first poll answers.
 */
export function rungFor(stage: UploadStage | null | undefined): number {
  return PARSE_STAGES.findIndex((s) => s.stage === stage);
}

export function ParseProgress({ stage }: { stage: number }) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center">
      <div className="flex w-full max-w-[460px] flex-col items-center">
        <div className="flex flex-col items-center gap-[18px]">
          <span className="size-[52px] shrink-0 rounded-full border-4 border-nevo-navy/16 border-t-nevo-navy motion-safe:animate-spin motion-safe:[animation-duration:950ms]" />
          <div className="text-center text-[19px] font-semibold tracking-[-0.01em] text-nevo-near-black xl:text-[21px]">
            {PARSE_STAGES[stage]?.label ?? PARSE_STAGES[0].label}
          </div>
        </div>

        <div className="mt-[30px] flex w-full flex-col gap-[9px]">
          {PARSE_STAGES.map((s, i) => {
            const done = i < stage;
            const active = i === stage;
            return (
              <div
                key={s.stage}
                className={cn(
                  "flex items-center gap-[13px] rounded-xl px-[15px] py-[11px]",
                  active && "bg-nevo-violet/20",
                  done && "bg-nevo-navy/7",
                )}
              >
                <span
                  className={cn(
                    "flex size-[26px] shrink-0 items-center justify-center rounded-full",
                    done && "bg-nevo-navy text-nevo-cream",
                    active &&
                      "bg-nevo-violet text-nevo-cream motion-safe:animate-nevo-stage-pulse",
                    !done && !active && "bg-nevo-near-black/10 text-nevo-near-black/40",
                  )}
                >
                  {done ? (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M5 12l4 4L19 6" />
                    </svg>
                  ) : (
                    <span className="text-xs font-bold">{i + 1}</span>
                  )}
                </span>
                <span
                  className={cn(
                    "min-w-0 flex-1 text-sm",
                    active
                      ? "font-bold text-nevo-near-black"
                      : done
                        ? "font-medium text-nevo-near-black/72"
                        : "font-medium text-nevo-near-black/40",
                  )}
                >
                  {s.label}
                </span>
                {active && (
                  <span className="text-[11.5px] font-semibold whitespace-nowrap text-nevo-navy">
                    Working&hellip;
                  </span>
                )}
                {done && (
                  <Link
                    href="/teacher/lessons/upload/structure"
                    className="inline-flex cursor-pointer items-center rounded-lg border-[1.5px] border-nevo-navy/30 px-[11px] py-[5px] text-[11.5px] font-semibold whitespace-nowrap text-nevo-navy transition-colors hover:bg-nevo-navy/6"
                  >
                    Open and steer
                  </Link>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex w-full items-center gap-2.5 rounded-xl bg-nevo-violet/14 px-4 py-3">
          <span className="shrink-0 text-nevo-navy">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <path d="M16 17l5-5-5-5M21 12H9" />
            </svg>
          </span>
          <span className="min-w-0 flex-1 text-[13px] leading-[1.5] text-nevo-near-black/75">
            You can leave this - we&rsquo;ll keep going and save a draft.
          </span>
        </div>
      </div>
    </div>
  );
}
