import type { Metadata } from "next";
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

// The 404 decision moved into the component, and had to.
//
// A signed-in child's subjects are whatever their concept rows say - "Basic
// Science", "Further Maths", anything the school teaches - and the slugs for
// those are not in `SUBJECT_DETAIL`, which holds three designed fixtures. So
// `if (!detail) notFound()` here answered a real subject with "this page
// doesn't exist": the same shape as the mock-only lesson route, and the third
// time this pattern has turned up in the student app.
//
// The server cannot read the token, so it cannot know whose subject this is.
// The component decides: live subjects resolve by slug, and only a signed-out
// visitor on a slug no fixture covers gets the 404.
export default async function SubjectDetailPage({
  params,
}: {
  params: Promise<{ subject: string }>;
}) {
  const { subject } = await params;
  return (
    <SubjectDetail subject={SUBJECT_DETAIL[subject] ?? null} slug={subject} />
  );
}
