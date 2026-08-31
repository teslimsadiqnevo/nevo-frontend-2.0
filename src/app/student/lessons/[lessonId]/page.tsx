import { LessonRoute } from "@/components/student/Lesson/LessonRoute";

// Next.js 16: `params` is a Promise and must be awaited.
//
// The resolution itself is client-side: the lesson is read live from
// `GET /api/content/lessons/{id}` with a Bearer token that lives in
// localStorage, which the server cannot see. So this stays a thin shell and
// `LessonRoute` decides - see its docblock for why deciding here made a real
// lesson answer 404 on every hard load.
export default async function StudentLessonPlayerPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;
  return <LessonRoute lessonId={lessonId} />;
}
