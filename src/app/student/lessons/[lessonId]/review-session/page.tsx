import type { Metadata } from "next";
import { LessonRoute } from "@/components/student/Lesson/LessonRoute";

export const metadata: Metadata = {
  title: "Review session - Nevo",
};

// Review session (37d): spaced retrieval that reuses the whole lesson player as
// a variant. The backend schedules these and will link students in when a
// concept is due; the route renders whatever lesson it is pointed at.
//
// Resolution goes through `LessonRoute` exactly as the ordinary player does.
// This route kept the mock-only `getMockLesson` + `notFound()` shape after the
// main one moved off it, so a real lesson id 404'd here - the same bug, left
// behind in the file next door.
//
// `GET /api/scheduler/due-reviews/{student_id}` is what sends a child here, via
// the "Ready for another look" chips on Subject Detail. Those chips were plain
// text until the entrance was wired, so this route rendered correctly and was
// reachable only by typing the URL.
export default async function ReviewSessionPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;
  return <LessonRoute lessonId={lessonId} review />;
}
