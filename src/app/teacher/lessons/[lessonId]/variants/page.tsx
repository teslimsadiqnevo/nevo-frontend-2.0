import type { Metadata } from "next";
import { VariantReviewRoute } from "@/components/teacher/Library/VariantReviewRoute";
import { getLibraryLesson } from "@/lib/mocks/teacherLibrary";

export const metadata: Metadata = {
  title: "Variant review - Nevo",
};

/**
 * C16d Variant Review (SCRUM-37) - the four variants for one lesson section.
 *
 * This route used to resolve the lesson straight from the 8-slug fixture
 * table and `notFound()` on a miss. Two consequences: every REAL lesson 404d
 * on its own variants URL, because live ids are UUIDs; and for the eight
 * fixture slugs it served invented pedagogical prose - worked examples,
 * scaffolds, the lot - to whoever loaded it, with no session check and no
 * sample label.
 *
 * The gate now lives client-side in `VariantReviewRoute`, the same shape the
 * lesson, class and student routes use. Next.js 16: `params` and
 * `searchParams` are Promises and must be awaited.
 */
export default async function VariantReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ lessonId: string }>;
  searchParams: Promise<{ section?: string }>;
}) {
  const [{ lessonId }, { section }] = await Promise.all([params, searchParams]);
  const fixture = getLibraryLesson(lessonId) ?? null;
  const parsed = Number.parseInt(section ?? "1", 10);
  return (
    <VariantReviewRoute
      fixture={fixture}
      sectionIndex={Number.isNaN(parsed) ? 1 : Math.max(parsed, 1)}
    />
  );
}
