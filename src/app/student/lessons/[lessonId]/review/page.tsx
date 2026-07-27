import { notFound } from "next/navigation";
import { ReviewAnswersScreen } from "@/components/student/Lesson/ReviewAnswersScreen";
import { getMockLesson } from "@/lib/mocks";

// Next.js 16: `params` is a Promise and must be awaited.
// TODO(api): the student's attempt will come from the backend once it lands.
export default async function StudentLessonReviewPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;
  const lesson = getMockLesson(lessonId);
  if (!lesson) notFound();

  return <ReviewAnswersScreen lesson={lesson} />;
}
