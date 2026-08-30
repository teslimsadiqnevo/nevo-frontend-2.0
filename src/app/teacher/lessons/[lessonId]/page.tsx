import type { Metadata } from "next";
import { LessonRoute } from "@/components/teacher/Library/LessonRoute";
import { getLibraryLesson } from "@/lib/mocks/teacherLibrary";

export const metadata: Metadata = {
  title: "Lesson - Nevo",
};

// C06b Lesson Detail - one lesson: its sections, and who has it.
//
// The lesson is fetched client-side: the content endpoint is behind a Bearer
// token that lives in localStorage, which the server cannot read. The fixture
// is resolved here and passed down for the signed-out designed screen only.
//
// Next.js 16: `params` is a Promise and must be awaited.
export default async function TeacherLessonPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;
  return <LessonRoute fixture={getLibraryLesson(lessonId)} lessonId={lessonId} />;
}
