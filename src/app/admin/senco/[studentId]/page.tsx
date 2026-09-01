import type { Metadata } from "next";
import { LearnerProfileView } from "@/components/admin/Senco/LearnerProfileView";

export const metadata: Metadata = {
  title: "Learner profile - Nevo",
};

// D8b Learner Profile. Next.js 16: `params` is a Promise and must be awaited.
export default async function AdminLearnerProfilePage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  return <LearnerProfileView studentId={studentId} />;
}
