import { notFound } from "next/navigation";
import { SampleRegion } from "@/components/shared/SampleRegion";
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
    <SampleRegion kind="student:lesson-review">
      <ReviewAnswersScreen lesson={lesson} />
    </SampleRegion>
  );
}
