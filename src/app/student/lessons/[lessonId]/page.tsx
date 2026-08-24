import { notFound } from "next/navigation";
import { LessonPlayer } from "@/components/student/Lesson/LessonPlayer";
import { getMockAdaptation, getMockLesson } from "@/lib/mocks";

// Next.js 16: `params` is a Promise and must be awaited.
// TODO(api): replace the mock getters with the lesson-detail endpoint
// (not deployed yet) + intelligenceApi.getAdaptation once the contracts land.
export default async function StudentLessonPlayerPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;
  const lesson = getMockLesson(lessonId);
  if (!lesson) notFound();

  const plan = getMockAdaptation(lessonId);
  return <LessonPlayer lesson={lesson} plan={plan} />;
}
