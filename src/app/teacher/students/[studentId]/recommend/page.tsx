import type { Metadata } from "next";
import { StudentRoute } from "@/components/teacher/Student/StudentRoute";
import { getStudentProfile } from "@/lib/mocks/teacherStudents";

export const metadata: Metadata = {
  title: "Recommend a lesson - Nevo",
};

/**
 * C08c Recommend a Lesson - a sheet over the student's profile, addressed as
 * its own route so it survives a refresh and the back button dismisses it.
 *
 * Goes through `StudentRoute` rather than resolving the mock directly. This
 * URL used to hand a fixture child's whole profile - name, mastery, evidence,
 * sessions - to anyone who loaded it, signed in or not, because it never
 * checked for a session. One gate now covers both this URL and the profile it
 * sits over.
 */
export default async function RecommendLessonPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const fixture = getStudentProfile(studentId) ?? null;
  return (
    <StudentRoute
      fixture={fixture?.recommend ? fixture : null}
      studentId={studentId}
      recommendOpen
    />
  );
}
