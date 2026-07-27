import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SubjectDetail } from "@/components/student/Progress/SubjectDetail";
import { SUBJECT_DETAIL } from "@/components/student/Progress/progressData";

// Next.js 16: `params` is a Promise and must be awaited.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ subject: string }>;
}): Promise<Metadata> {
  const { subject } = await params;
  const detail = SUBJECT_DETAIL[subject];
  return { title: detail ? `${detail.name} - Nevo` : "Progress - Nevo" };
}

export default async function SubjectDetailPage({
  params,
}: {
  params: Promise<{ subject: string }>;
}) {
  const { subject } = await params;
  const detail = SUBJECT_DETAIL[subject];
  if (!detail) notFound();

  return <SubjectDetail subject={detail} />;
}
