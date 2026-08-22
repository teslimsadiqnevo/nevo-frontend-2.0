import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StudentProfile } from "@/components/teacher/Student/StudentProfile";
import { getStudentProfile } from "@/lib/mocks/teacherStudents";

export const metadata: Metadata = {
  title: "Recommend a lesson - Nevo",
};

// C08c Recommend a Lesson - a sheet over the student's profile, addressed as
// its own route so it survives a refresh and the back button dismisses it.
export default async function RecommendLessonPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const student = getStudentProfile(studentId);
  if (!student?.recommend) notFound();
  return <StudentProfile student={student} recommendOpen />;
}
