import type { Metadata } from "next";
import { notFound } from "next/navigation";

// Both this and the player inherited the root layout's "Nevo", so moving
// between them changed no title and Next's route announcer said nothing.
export const metadata: Metadata = {
  title: "Lesson summary - Nevo",
};
import { LessonSummaryScreen } from "@/components/student/Lesson/LessonSummaryScreen";
import { getMockLesson } from "@/lib/mocks";

// Next.js 16: `params` is a Promise and must be awaited.
// TODO(api): source the recap from the backend once lesson content lands.
export default async function StudentLessonSummaryPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;
  const lesson = getMockLesson(lessonId);
  if (!lesson) notFound();

  return <LessonSummaryScreen lesson={lesson} />;
}
