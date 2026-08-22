import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StudentProfile } from "@/components/teacher/Student/StudentProfile";
import { getStudentProfile } from "@/lib/mocks/teacherStudents";

// Next.js 16: `params` is a Promise and must be awaited.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ studentId: string }>;
}): Promise<Metadata> {
  const { studentId } = await params;
  const student = getStudentProfile(studentId);
  return { title: student ? `${student.name} - Nevo` : "Student - Nevo" };
}

// C08 Student Profile (teacher view). Reached from a class roster row.
export default async function TeacherStudentDetailPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const student = getStudentProfile(studentId);
  if (!student) notFound();
  return <StudentProfile student={student} />;
}
