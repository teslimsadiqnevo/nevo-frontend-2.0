"use client";

import Link from "next/link";
import { MasteryDualTrack } from "@/components/teacher/Student/MasteryDualTrack";
import { useClassInsights } from "@/hooks/useClassInsights";
import { cn } from "@/lib/utils";

/**
 * C09 Insights for a real class.
 *
 * Three sections have sources and are here: the shared misconception, the
 * class-mastery panel, and what is flagged. C09's written summary, its
 * per-student recommendations and C14 A2's "looking ahead" have none, so they
 * are absent - the frame's own principle for a quiet week is that a section
 * with nothing true to say is not drawn at all, and inventing prose about a
 * real class would be the worst kind of filler.
 *
 * A class with nothing in any of the three gets C09's sparse card, which is
 * exactly true of a class Nevo has not analysed yet.
 */

const SECTION_H =
  "mt-[26px] text-[13.5px] font-semibold tracking-[0.04em] text-nevo-near-black/55 uppercase xl:mt-[34px] xl:text-sm";

const DROP_GLYPH = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M12 5v9" />
    <path d="M8 11l4 4 4-4" />
  </svg>
);

export function LiveClassInsights({
  classId,
  className,
}: {
  classId: string;
  className: string;
}) {
  const { misconceptions, concepts, flags, loading, empty } =
    useClassInsights(classId);

  if (loading) {
    return (
      <div className="mt-8 flex flex-col gap-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-[120px] animate-pulse rounded-xl bg-nevo-cream-elevated"
          />
        ))}
      </div>
    );
  }

  if (empty) {
    return (
      <div className="mt-8 flex max-w-[640px] items-start gap-4 rounded-xl bg-nevo-cream-elevated p-7 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
        <span className="mt-px size-[22px] shrink-0 text-nevo-violet xl:size-6">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="size-full">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
        </span>
        <div>
          <h3 className="text-[17px] font-semibold text-nevo-near-black xl:text-lg">
            {`Still gathering insights for ${className}`}
          </h3>
          <p className="mt-[7px] text-[14.5px] leading-[1.55] text-nevo-near-black/68 xl:mt-2 xl:text-[15px]">
            Once students have a few sessions behind them, patterns and
            anything worth a look will appear here.
          </p>
        </div>
      </div>
    );
  }

  const lead = [...misconceptions].sort(
    (a, b) => b.studentCount - a.studentCount,
  )[0];

  return (
    <>
      {lead && (
        <div className="mt-[18px] rounded-xl bg-nevo-violet/14 px-[22px] py-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] xl:mt-[22px] xl:px-[26px] xl:py-6">
          <span className="text-[11px] font-bold tracking-[0.14em] text-nevo-navy uppercase">
            A shared sticking point
          </span>
          <h3 className="mt-2 text-[17px] font-semibold text-nevo-near-black xl:text-lg">
            {lead.conceptName}
          </h3>
          <p className="mt-[7px] max-w-[68ch] text-[14.5px] leading-[1.6] text-nevo-near-black/78 xl:text-[15px]">
            {lead.description}
          </p>
          <p className="mt-2 text-[13px] text-nevo-near-black/55">
            {`${lead.studentCount} ${lead.studentCount === 1 ? "student" : "students"} · ${lead.pattern}`}
          </p>
        </div>
      )}

      {misconceptions.length > 1 && (
        <div className="mt-3 flex flex-col gap-2">
          {misconceptions.slice(1).map((m) => (
            <div
              key={m.conceptId}
              className="rounded-[10px] bg-nevo-cream-elevated px-[18px] py-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
            >
              <span className="text-[14.5px] font-semibold text-nevo-near-black">
                {m.conceptName}
              </span>
              <span className="ml-2 text-[13px] text-nevo-near-black/55">
                {`${m.studentCount} students · ${m.pattern}`}
              </span>
              <p className="mt-1 text-[13.5px] leading-[1.5] text-nevo-near-black/72">
                {m.description}
              </p>
            </div>
          ))}
        </div>
      )}

      {flags.length > 0 && (
        <>
          <h3 className={SECTION_H}>Worth a look</h3>
          <div className="mt-3.5 flex flex-col gap-2">
            {flags.map((f) => (
              <div
                key={f.id}
                className={cn(
                  "relative rounded-[12px] bg-nevo-cream-elevated py-4 pr-[18px] pl-[22px] shadow-[0_2px_8px_rgba(0,0,0,0.06)]",
                )}
              >
                <span
                  className={cn(
                    "absolute inset-y-4 left-0 w-[3px] rounded-full",
                    f.isSudden ? "bg-nevo-navy" : "bg-nevo-violet",
                  )}
                />
                <div className="flex items-center gap-2">
                  {f.isSudden && (
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-nevo-navy text-nevo-cream">
                      {DROP_GLYPH}
                    </span>
                  )}
                  <span className="text-[15px] font-semibold text-nevo-near-black">
                    {f.name ?? "One of your students"}
                  </span>
                </div>
                <p className="mt-1.5 text-[14.5px] leading-[1.5] text-nevo-near-black/78">
                  {f.note}
                </p>
              </div>
            ))}
          </div>
        </>
      )}

      {concepts.length > 0 && (
        <>
          <h3 className={SECTION_H}>How the class is doing</h3>
          <p className="mt-2 max-w-[62ch] text-[13px] leading-[1.5] text-nevo-near-black/60">
            Each idea, and how much the reading itself is shaping the result.
          </p>
          <div className="mt-4 flex flex-col gap-5 rounded-xl bg-nevo-cream-elevated px-[22px] py-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)] xl:px-[26px]">
            {concepts.map((c) => (
              <MasteryDualTrack
                key={c.conceptId}
                concept={c.name}
                understanding={c.understanding}
                reading={c.reading}
              />
            ))}
          </div>
        </>
      )}

      <div className="mt-7">
        <Link
          href={`/teacher/classes/${classId}`}
          className="text-[14.5px] font-semibold text-nevo-navy hover:underline"
        >
          Open the class &rarr;
        </Link>
      </div>
    </>
  );
}
