"use client";

/**
 * Transient feedback note (Lesson Player frame) — the warm, system-owned line
 * that greets the next segment after an adaptation or a comprehension answer,
 * then fades on its own. Soft violet, a quiet dot, never a score or a scold.
 *
 * Presentational only: the player owns when it appears and auto-clears it.
 */
export function FeedbackStrip({ message }: { message: string }) {
  return (
    <div
      role="status"
      className="mb-[22px] flex items-start gap-2.5 rounded-[12px] bg-nevo-violet/16 px-4 py-3 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-1 motion-safe:duration-300"
    >
      <span className="mt-[7px] size-2 shrink-0 rounded-full bg-nevo-violet" />
      <span className="text-sm leading-[1.5] text-nevo-near-black/82">
        {message}
      </span>
    </div>
  );
}
