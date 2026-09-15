import type { Metadata } from "next";
import { LessonEndingRoute } from "@/components/student/Lesson/LessonEndingRoute";

// This and the player both inherited the root layout's "Nevo", so moving
// between them changed no title and Next's route announcer said nothing.
export const metadata: Metadata = {
  title: "Review answers - Nevo",
};

/**
 * Was `getMockLesson(lessonId)` + `notFound()`, which resolved the two authored
 * demo lessons and dropped every real one out of the app onto "This page
 * doesn't exist". Now a client route over the same read the player uses, so a
 * real lesson's ending is its own.
 *
 * Next.js 16: `params` is a Promise and must be awaited.
 */
export default async function StudentLessonReviewPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;
  return <LessonEndingRoute lessonId={lessonId} screen="review" />;
}
