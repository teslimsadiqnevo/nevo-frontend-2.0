import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ClassDetail } from "@/components/teacher/Classes/ClassDetail";
import { getTeacherClass } from "@/lib/mocks/teacherClasses";

export const metadata: Metadata = {
  title: "Class - Nevo",
};

// C05 class detail - roster, lessons, activity for one class.
// Next.js 16: `params` is a Promise and must be awaited.
export default async function TeacherClassPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;
  const klass = getTeacherClass(classId);
  if (!klass) notFound();

  return <ClassDetail klass={klass} />;
}
