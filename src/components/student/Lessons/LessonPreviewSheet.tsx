"use client";

import { useRouter } from "next/navigation";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/shared";
import type { LessonSummary } from "./lessonCatalog";

/**
 * Lesson Preview (screen 21) — a calm look before committing. A bottom sheet on
 * mobile, a centred modal on tablet/desktop, over the dimmed list. Shows the
 * subject, adaptive estimate, a plain-language "what you'll do", and — if the
 * student is partway — a quiet progress bar. The single action starts (or
 * continues) the lesson.
 */
export function LessonPreviewSheet({
  lesson,
  open,
  onOpenChange,
}: {
  lesson: LessonSummary | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  if (!lesson) return null;

  const inProgress = lesson.status === "in_progress";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        aria-describedby={undefined}
        className="gap-0 rounded-t-[20px] border-0! bg-nevo-cream px-6 pt-3 pb-7 text-nevo-near-black shadow-[0_-8px_32px_rgba(0,0,0,0.16)] sm:inset-x-auto! sm:top-1/2 sm:bottom-auto! sm:left-1/2! sm:w-[480px] sm:max-w-[calc(100%-48px)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[20px] sm:p-8 sm:shadow-[0_8px_32px_rgba(0,0,0,0.16)]"
      >
        {/* Drag handle — sheet form only */}
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-nevo-near-black/20 sm:hidden" />

        <SheetTitle className="text-[23px] font-semibold tracking-[-0.01em] text-nevo-near-black sm:text-2xl">
          {lesson.title}
        </SheetTitle>

        <div className="mt-3.5 flex items-center gap-2.5">
          <span className="rounded-full bg-nevo-violet/25 px-3 py-1 text-[13px] text-nevo-navy">
            {lesson.subject}
          </span>
          <span className="text-sm text-nevo-near-black/60">
            {lesson.timeEstimate.replace(/^About /, "About ")}
          </span>
        </div>

        <p className="mt-[18px] text-[15px] leading-[1.6] text-nevo-near-black sm:text-base">
          {lesson.description}
        </p>

        {inProgress && (
          <>
            <p className="mt-5 text-sm font-medium text-nevo-near-black">
              You&apos;re partway through this one
            </p>
            <div className="mt-2.5 h-[5px] overflow-hidden rounded-full bg-nevo-navy/14">
              <div
                className="h-full rounded-full bg-nevo-violet"
                style={{ width: `${Math.round((lesson.progress ?? 0) * 100)}%` }}
              />
            </div>
          </>
        )}

        <Button
          className="mt-7 w-full"
          onClick={() => router.push(`/student/lessons/${lesson.lessonId}`)}
        >
          {inProgress ? "Continue" : "Start"}
        </Button>
      </SheetContent>
    </Sheet>
  );
}
