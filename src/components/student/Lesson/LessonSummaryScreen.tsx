"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/shared";
import type { Lesson } from "@/lib/types";

const LESSONS_HREF = "/student/lessons";
const HOME_HREF = "/student/dashboard";

/**
 * Lesson Summary (frame 18 · Lesson Summary) — the calm after-lesson recap,
 * reached from the completion screen's "See summary". Unlike the immersive
 * player, this renders **inside the app shell** (sidebar / mobile top bar), so
 * this component owns only the content column and its pinned footer actions.
 *
 * Growth framing, never numbers: a warm recap paragraph and a "what you covered"
 * card — no score, no percentile.
 */
export function LessonSummaryScreen({ lesson }: { lesson: Lesson }) {
  const router = useRouter();
  const summary = lesson.summary;

  return (
    <div className="flex min-h-full flex-col bg-nevo-cream text-nevo-near-black">
      <div className="flex-1 px-6 pt-8 pb-6 sm:px-8 lg:px-10">
        <div className="mx-auto w-full max-w-[560px] lg:max-w-[640px]">
          <h1 className="text-2xl font-semibold tracking-[-0.01em] text-nevo-near-black sm:text-[30px] lg:text-[32px]">
            {lesson.title}
          </h1>

          {summary && (
            <>
              <p className="mt-5 text-base leading-[1.7] text-nevo-near-black/72 sm:mt-6 sm:text-[17px] lg:text-lg">
                {summary.recap}
              </p>

              <div className="mt-7 rounded-[12px] bg-nevo-cream-elevated p-[18px] shadow-elevation-1 sm:p-[22px] lg:p-6">
                <span className="font-mono text-[11px] tracking-[0.06em] text-nevo-near-black/55">
                  WHAT YOU COVERED
                </span>
                <p className="mt-2.5 text-[15px] leading-[1.6] text-nevo-near-black sm:text-base">
                  {summary.covered}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="shrink-0 px-6 pb-8 sm:px-8 lg:px-10">
        <div className="mx-auto flex w-full max-w-[560px] flex-col gap-2 sm:flex-row sm:gap-3 lg:max-w-[640px]">
          <Button
            className="w-full sm:flex-1 lg:w-[260px] lg:flex-none"
            onClick={() => router.push(LESSONS_HREF)}
          >
            Back to lessons
          </Button>
          <Button
            variant="ghost"
            className="w-full sm:w-auto sm:px-7"
            onClick={() => router.push(HOME_HREF)}
          >
            Home
          </Button>
        </div>
      </div>
    </div>
  );
}
