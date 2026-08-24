import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { VariantReview } from "@/components/teacher/Library/VariantReview";
import { getLibraryLesson } from "@/lib/mocks/teacherLibrary";

export const metadata: Metadata = {
  title: "Variant review - Nevo",
};

// C16d Variant Review (SCRUM-37) - the four variants for one lesson section.
// Next.js 16: `params` and `searchParams` are Promises and must be awaited.
export default async function VariantReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ lessonId: string }>;
  searchParams: Promise<{ section?: string }>;
}) {
  const [{ lessonId }, { section }] = await Promise.all([params, searchParams]);
  const lesson = getLibraryLesson(lessonId);
  if (!lesson) notFound();

  const parsed = Number.parseInt(section ?? "1", 10);
  const sectionIndex = Number.isNaN(parsed)
    ? 1
    : Math.min(Math.max(parsed, 1), lesson.detail.sections.length);

  return <VariantReview lesson={lesson} sectionIndex={sectionIndex} />;
}
