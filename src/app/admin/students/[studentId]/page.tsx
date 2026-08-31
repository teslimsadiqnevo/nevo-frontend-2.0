import type { Metadata } from "next";
import { StudentDetailView } from "@/components/admin/Students/StudentDetailView";

export const metadata: Metadata = {
  title: "Student - Nevo",
};

// D7b Student detail. Next.js 16: `params` is a Promise and must be awaited.
export default async function AdminStudentDetailPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  return <StudentDetailView studentId={studentId} />;
}
