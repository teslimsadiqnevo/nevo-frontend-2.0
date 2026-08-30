import { notFound } from "next/navigation";
import { LessonPlayer } from "@/components/student/Lesson/LessonPlayer";
import { getMockAdaptation, getMockLesson } from "@/lib/mocks";

// Next.js 16: `params` is a Promise and must be awaited.
// TODO(api): `GET /api/content/lessons/{id}` is deployed and typed - the
// teacher side reads it - so the mock getters can be replaced here too;
// intelligenceApi.getAdaptation is the remaining unknown.
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
