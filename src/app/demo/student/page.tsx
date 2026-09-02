import type { Metadata } from "next";
import { StudentDemoPlayer } from "@/components/demo/StudentDemoPlayer";

/**
 * The student conference demo. Public and deterministic, like `/demo`.
 *
 * `?recording=true` adds the presenter's scene overlay - rehearsal only.
 */
export const metadata: Metadata = {
  title: "Nevo for students",
  robots: { index: false, follow: false },
};

export default async function StudentDemoPage({
  searchParams,
}: {
  searchParams: Promise<{ recording?: string }>;
}) {
  const { recording } = await searchParams;
  return <StudentDemoPlayer recording={recording === "true"} />;
}
