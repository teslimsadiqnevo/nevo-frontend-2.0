import type { Metadata } from "next";
import { notFound } from "next/navigation";

// Both this and the player inherited the root layout's "Nevo", so moving
// between them changed no title and Next's route announcer said nothing.
export const metadata: Metadata = {
  title: "Lesson summary - Nevo",
};
import { SampleRegion } from "@/components/shared/SampleRegion";
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

  /*
   * `getMockLesson` resolves the two AUTHORED DEMO lessons and nothing else, so
   * everything this route can currently render is a fixture. Marked, because
   * the end-to-end test signs in and asserts no sample region is present - and
   * an unmarked fixture is invisible to it, which is worse than no test at all.
   *
   * The mark should stop appearing for a signed-in child when this route is put
   * on real lesson content; until then it is telling the truth about what is on
   * screen.
   */
  return (
    <SampleRegion kind="student:lesson-summary">
      <LessonSummaryScreen lesson={lesson} />
    </SampleRegion>
  );
}
