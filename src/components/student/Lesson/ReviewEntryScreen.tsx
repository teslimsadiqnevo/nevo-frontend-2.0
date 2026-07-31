"use client";

import { Button } from "@/components/shared";

/**
 * Review session entry (37d, Intelligence Layer). Spaced retrieval, timed to
 * reinforce memory just as it starts to fade - not homework, not repetition.
 * A calm landing that names the lesson and why it's back, then hands over to
 * the ordinary player (the session itself reuses it wholesale).
 */
export function ReviewEntryScreen({
  lessonTitle,
  note = "You worked on this two weeks ago. Let's see what's stuck.",
  onBegin,
}: {
  lessonTitle: string;
  /** Recency line - backend-supplied later; frame copy as the mock default. */
  note?: string;
  onBegin: () => void;
}) {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-nevo-cream px-10 text-center text-nevo-near-black motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-300">
      <span className="flex h-7 items-center rounded-[20px] bg-nevo-violet px-3 text-[11px] font-bold tracking-[0.16em] text-nevo-cream">
        REVIEW SESSION
      </span>
      <h1 className="mt-6 text-2xl font-bold tracking-[-0.01em] text-nevo-navy sm:text-[28px] lg:text-[30px]">
        {lessonTitle}
      </h1>
      <p className="mt-2 max-w-[340px] text-[15px] leading-[1.55] text-nevo-near-black sm:text-base">
        {note}
      </p>
      <Button className="mt-8 w-auto px-8" onClick={onBegin}>
        Begin review
      </Button>
    </div>
  );
}
