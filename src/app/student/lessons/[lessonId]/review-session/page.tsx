import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LessonPlayer } from "@/components/student/Lesson/LessonPlayer";
import { getMockAdaptation, getMockLesson } from "@/lib/mocks";

export const metadata: Metadata = {
  title: "Review session - Nevo",
};

// Review session (37d): spaced retrieval that reuses the whole lesson player
// as a variant. The backend schedules these and will link students in when a
// concept is due; the route renders whatever lesson it is pointed at.
// TODO(api): swap the mock getters for the scheduled-review contract.
export default async function ReviewSessionPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;
  const lesson = getMockLesson(lessonId);
  if (!lesson) notFound();

  const plan = getMockAdaptation(lessonId);
  return <LessonPlayer lesson={lesson} plan={plan} review />;
}
