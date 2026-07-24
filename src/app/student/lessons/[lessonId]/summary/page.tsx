import { notFound } from "next/navigation";
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
