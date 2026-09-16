import type { Metadata } from "next";
import { ClassCodeRoute } from "@/components/teacher/Classes/ClassCodeRoute";

export const metadata: Metadata = {
  title: "Class code - Nevo",
};

// C12 class code / QR, as its own route so a teacher can link it, bookmark it
// and reopen it between lessons - design's 15 Sep ruling. The dialog on class
// detail stays; this is the projection view with a URL.
// Next.js 16: `params` is a Promise and must be awaited.
export default async function TeacherClassCodePage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;
  return <ClassCodeRoute classId={classId} />;
}
