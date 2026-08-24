import type { Metadata } from "next";
import { ClassRoute } from "@/components/teacher/Classes/ClassRoute";
import { getTeacherClass } from "@/lib/mocks/teacherClasses";

export const metadata: Metadata = {
  title: "Class - Nevo",
};

// C05 class detail - roster, lessons, activity for one class. Ids the
// fixtures don't know may still be real assignments from the school, so the
// route resolves client-side against the live class list before 404-ing.
// Next.js 16: `params` is a Promise and must be awaited.
export default async function TeacherClassPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;
  return <ClassRoute fixture={getTeacherClass(classId)} classId={classId} />;
}
