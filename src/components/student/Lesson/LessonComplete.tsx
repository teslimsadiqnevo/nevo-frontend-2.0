"use client";

import { Button, SettlingCharacter } from "@/components/shared";

/**
 * Lesson Complete (Lesson Check frame) — the calm close of a lesson. A settling
 * illustration, warm unhurried copy, and the reassurance motif ("Your progress
 * is saved"). The full break + summary flow lives in screen 18 (Break Module &
 * Completion), so "See summary" only renders once that lands — passed in via
 * `onSeeSummary`.
 */
export function LessonComplete({
  onBackToLessons,
  onSeeSummary,
}: {
  onBackToLessons: () => void;
  onSeeSummary?: () => void;
}) {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-nevo-cream px-6 text-center text-nevo-near-black">
      <div className="flex w-full max-w-[300px] flex-col items-center sm:max-w-[430px]">
        <SettlingCharacter
          priority
          className="w-[200px] sm:w-[280px] lg:w-[300px]"
        />

        <h2 className="mt-7 text-[23px] font-semibold leading-[1.35] tracking-[-0.01em] sm:text-[26px]">
          That&apos;s the lesson done. Nicely paced.
        </h2>
        <p className="mt-2.5 text-base text-nevo-near-black/70 sm:text-[17px]">
          Your progress is saved.
        </p>

        <Button className="mt-8 w-full max-w-[300px]" onClick={onBackToLessons}>
          Back to lessons
        </Button>
        {onSeeSummary && (
          <Button
            variant="ghost"
            className="mt-2 h-[46px] w-full max-w-[300px] text-[15px]"
            onClick={onSeeSummary}
          >
            See summary
          </Button>
        )}
      </div>
    </div>
  );
}
