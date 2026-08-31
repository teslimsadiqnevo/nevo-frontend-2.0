import type { Metadata } from "next";
import { TeacherDetailView } from "@/components/admin/Teachers/TeacherDetailView";

export const metadata: Metadata = {
  title: "Teacher - Nevo",
};

// D6 teacher detail. Next.js 16: `params` is a Promise and must be awaited.
export default async function AdminTeacherDetailPage({
  params,
}: {
  params: Promise<{ teacherId: string }>;
}) {
  const { teacherId } = await params;
  return <TeacherDetailView teacherId={teacherId} />;
}
