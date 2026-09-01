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
 * C16d has NO LIVE SOURCE, and that is a contract fact rather than an
 * omission: the five modality variants (`textVariant`, `visualVariant`,
 * `audioVariant`, `interactiveVariant`, `calculationVariant`) are free-form
 * objects with no declared shape, and they appear ONLY on
 * `ParsedLessonSegmentResponse` - the reply to a parse or an upload. No
 * lesson READ carries them at all, so there is nothing to render for a lesson
 * a teacher already has.
 *
 * So a signed-in teacher gets the honest state rather than the fixture's
 * invented worked examples and scaffolds, which is what this route served to
 * anyone who loaded it. The designed screen stays reachable signed-out.
 *
 * TODO(api): a shape for the variant objects, and a lesson read that carries
 * them. Logged with backend.
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
