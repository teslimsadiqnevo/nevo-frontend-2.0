import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LessonDetail } from "@/components/teacher/Library/LessonDetail";
import { getLibraryLesson } from "@/lib/mocks/teacherLibrary";

export const metadata: Metadata = {
  title: "Lesson - Nevo",
};

// C06b Lesson Detail - one lesson: contents, assignments, class progress.
// Next.js 16: `params` is a Promise and must be awaited.
export default async function TeacherLessonPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;
  const lesson = getLibraryLesson(lessonId);
  if (!lesson) notFound();

  return <LessonDetail lesson={lesson} />;
}
