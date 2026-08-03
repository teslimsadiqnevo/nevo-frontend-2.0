"use client";

import Link from "next/link";
import type { BaselineDimension } from "@/lib/profiling/bands";

/** The rotating chip copy - warm, never clinical (frame's rotation map). */
export const WARM_UP_CHIPS: Record<BaselineDimension, string> = {
  wmc: "Quick patterns today",
  ps: "Quick matches today",
  reading: "A short read today",
  ans: "Quick counts today",
  attention: "Quick focus today",
  domain: "A quick question today",
};

/**
 * Daily warm-up card (`Nevo Warm-Up Card`, SCRUM-104): the 45-second
 * calibration that opens the daily session, rotating one baseline dimension per
 * day. Presents as a quick warm-up, never an assessment - no score anywhere.
 */
export function WarmUpCard({ dimension }: { dimension: BaselineDimension }) {
  return (
    <div className="mt-6 flex items-center gap-6 rounded-[12px] bg-nevo-cream-elevated px-[26px] py-6 shadow-elevation-1 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-500">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="font-mono text-[11px] font-bold tracking-[0.14em] text-nevo-violet">
            DAILY WARM-UP
          </span>
          <span className="rounded-full bg-nevo-violet/20 px-2.5 py-[3px] text-[11px] font-medium text-nevo-navy">
            {WARM_UP_CHIPS[dimension]}
          </span>
        </div>
        <h3 className="mt-3 text-xl font-semibold tracking-[-0.01em] text-nevo-navy">
          A quick warm-up to begin
        </h3>
        <p className="mt-2 max-w-[420px] text-[14.5px] leading-[1.55] text-pretty text-nevo-near-black">
          About 45 seconds. No score, it just keeps Nevo tuned to how
          you&apos;re doing today.
        </p>
        <Link
          href="/student/warm-up"
          className="mt-[18px] inline-flex h-11 items-center rounded-[10px] bg-nevo-navy px-[22px] text-[15px] font-semibold text-nevo-cream transition-[filter,transform] hover:brightness-109 active:scale-[0.985]"
        >
          Begin warm-up
        </Link>
      </div>
      <div className="hidden size-[132px] shrink-0 items-center justify-center rounded-[12px] bg-nevo-cream sm:flex">
        <div className="flex gap-2.5">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className="size-4 rounded-full bg-nevo-violet motion-safe:[animation:nevo-tile-hi_2.4s_ease-in-out_infinite]"
              style={{ animationDelay: `${i * 300}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
