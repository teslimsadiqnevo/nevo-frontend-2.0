"use client";

import Link from "next/link";
import { useHydrated } from "@/hooks/useHydrated";
import { getToken } from "@/lib/auth/session";
import type {
  LessonDetailData,
  LibraryLesson,
} from "@/lib/mocks/teacherLibrary";
import { VariantReview } from "./VariantReview";

/**
 * C16d HAD no live source. It has one now, and the paragraph that used to
 * sit here was a contract fact that stopped being true (re-checked against the
 * deployed spec, 11 Sep 2026). Both of its claims have since failed:
 *
 *  - "free-form objects with no declared shape" - each variant is a declared
 *    schema now: `textVariant` is `anyOf [TextVariant, null]`, and the other
 *    four likewise.
 *  - "they appear ONLY on `ParsedLessonSegmentResponse` ... no lesson READ
 *    carries them at all" - all five sit on `LessonSegmentResponse`, reached
 *    by `GET /api/v1/lessons/{lesson_id}` and `GET /api/content/lessons/
 *    {lesson_id}`, and are typed locally at `lib/api/variants.ts`.
 *
 * So the honest state below is now OVER-honest: it tells a signed-in teacher
 * variants are unavailable when the lesson read they came from carries them.
 * Nothing consumes `variantsApi` yet, which is why this still renders - but
 * that is unbuilt work, no longer a blocker.
 *
 * TODO(api): nothing. TODO(fe): consume the variants off the lesson read and
 * render C16d for a signed-in teacher.
 */
export function VariantReviewRoute({
  fixture,
  sectionIndex,
}: {
  fixture: (LibraryLesson & { detail: LessonDetailData }) | null;
  sectionIndex: number;
}) {
  const hydrated = useHydrated();
  if (!hydrated) return null;

  if (!getToken() && fixture) {
    const max = fixture.detail.sections.length;
    return (
      <VariantReview
        lesson={fixture}
        sectionIndex={Math.min(sectionIndex, max)}
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1040px] px-[38px] py-[34px] xl:px-[52px] xl:py-11">
      <div className="mx-auto max-w-[660px] rounded-[12px] bg-nevo-cream-elevated px-[26px] py-7 shadow-elevation-1">
        <h2 className="text-[17px] font-semibold text-nevo-near-black">
          Variants aren&rsquo;t available yet
        </h2>
        <p className="mt-2 text-sm leading-[1.55] text-nevo-near-black/62">
          Nevo builds a different version of each section for reading, seeing,
          listening and doing. We can&rsquo;t show you those yet &ndash;
          they&rsquo;re not part of what a lesson gives us back.
        </p>
        <Link
          href="/teacher/lessons"
          className="mt-5 inline-flex h-[46px] cursor-pointer items-center rounded-[10px] bg-nevo-navy px-5 text-sm font-semibold text-nevo-cream transition-[filter] hover:brightness-93"
        >
          Back to your library
        </Link>
      </div>
    </div>
  );
}
