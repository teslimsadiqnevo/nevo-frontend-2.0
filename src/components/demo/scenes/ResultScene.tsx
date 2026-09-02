"use client";

import { DEMO_RECOMMENDATION, DEMO_STUDENT } from "@/lib/demo/demoData";
import { cn } from "@/lib/utils";
import { Reveal } from "../chrome";

/**
 * Scene 7. It landed.
 *
 * A demo that ends at "the teacher clicked a button" has not made its case.
 * The audience needs to see the loop close: the recommendation is now on the
 * learner's record, her status has moved from "worth a glance" to something
 * in hand, and the teacher can see that without hunting for it.
 *
 * The confirmation sentence is built from the same fixture the sheet used, so
 * the lesson named here is necessarily the lesson chosen there - it cannot
 * drift into naming something the audience did not just watch being picked.
 *
 * Kept deliberately quiet. The product's register is matter-of-fact, never
 * celebratory, and a burst of confetti over a child's learning would be the
 * wrong note in front of a room of educators.
 */

const TIMELINE_AFTER = [
  {
    when: "Just now",
    title: "Listen-first version recommended",
    detail: "Waiting for Amara's next session",
    accent: true,
  },
  {
    when: "Yesterday",
    title: "Solving linear equations",
    detail: "Finished · steady throughout",
    accent: false,
  },
  {
    when: "Monday",
    title: "Comprehension: prose texts",
    detail: "Finished · strongest session this week",
    accent: false,
  },
];

export function ResultScene({ progress }: { progress: number }) {
  const lesson = DEMO_RECOMMENDATION
    ? DEMO_RECOMMENDATION.version
      ? `${DEMO_RECOMMENDATION.lesson} · ${DEMO_RECOMMENDATION.version}`
      : DEMO_RECOMMENDATION.lesson
    : "the recommended lesson";

  return (
    <div className="flex h-full w-full flex-col bg-nevo-cream px-[110px] pb-[190px] pt-[62px]">
      <Reveal show={progress > 0.02}>
        <p className="m-0 text-[19px] font-medium uppercase tracking-[0.14em] text-nevo-navy/70">
          {DEMO_STUDENT.name} &middot; {DEMO_STUDENT.className}
        </p>
        <h2 className="m-0 mt-3 text-[46px] font-semibold leading-none tracking-[-0.024em] text-nevo-near-black">
          Recommended, and on her next session
        </h2>
      </Reveal>

      {/* Centred rather than top-aligned: the two columns are shorter than
          the stage, and left at the top they stranded a band of empty cream
          above the caption. */}
      <div className="mt-11 grid min-h-0 flex-1 grid-cols-[1fr_1.1fr] items-center gap-14">
        {/* The status change, stated plainly. */}
        <div className="flex flex-col gap-6">
          <Reveal show={progress > 0.1} delay={150}>
            <div className="rounded-2xl bg-nevo-navy px-9 py-8 text-nevo-cream">
              <p className="m-0 text-[17px] font-medium uppercase tracking-[0.12em] text-nevo-cream/65">
                Now waiting for her
              </p>
              <p className="m-0 mt-4 text-[32px] font-semibold leading-[1.25] tracking-[-0.016em]">
                {lesson}
              </p>
            </div>
          </Reveal>

          <Reveal show={progress > 0.16} delay={280}>
            <div className="rounded-2xl bg-nevo-cream-elevated px-9 py-8 shadow-[0_2px_10px_rgba(43,43,47,0.06)]">
              <p className="m-0 text-[17px] font-medium uppercase tracking-[0.12em] text-nevo-near-black/45">
                Her status
              </p>
              <div className="mt-5 flex items-center gap-5">
                <span className="rounded-full bg-nevo-near-black/8 px-5 py-2.5 text-[19px] font-medium text-nevo-near-black/45 line-through">
                  Worth a glance
                </span>
                <span className="text-[24px] text-nevo-near-black/35">&rarr;</span>
                <span className="rounded-full bg-nevo-navy/12 px-5 py-2.5 text-[19px] font-semibold text-nevo-navy">
                  Support in place
                </span>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Her timeline, with the new entry at the top. */}
        <div className="flex flex-col">
          <Reveal show={progress > 0.12} delay={220}>
            <h3 className="m-0 text-[21px] font-semibold uppercase tracking-[0.1em] text-nevo-near-black/45">
              Her timeline
            </h3>
          </Reveal>

          <div className="mt-6 flex flex-col gap-4">
            {TIMELINE_AFTER.map((row, i) => (
              <Reveal key={row.title} show={progress > 0.18} delay={320 + i * 160}>
                <div
                  className={cn(
                    "flex items-start gap-5 rounded-2xl px-8 py-6",
                    row.accent
                      ? "bg-nevo-cream-elevated ring-2 ring-nevo-navy/40"
                      : "bg-nevo-cream-elevated/70",
                  )}
                >
                  <span
                    className={cn(
                      "mt-2 size-3 flex-none rounded-full",
                      row.accent ? "bg-nevo-navy" : "bg-nevo-near-black/20",
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="text-[22px] font-semibold tracking-[-0.012em] text-nevo-near-black">
                        {row.title}
                      </span>
                      <span className="flex-none text-[16px] text-nevo-near-black/50">
                        {row.when}
                      </span>
                    </div>
                    <p className="m-0 mt-1.5 text-[18px] text-nevo-near-black/65">
                      {row.detail}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
