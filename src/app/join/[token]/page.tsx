import type { Metadata } from "next";
import { JoinLanding } from "@/components/admin/Invitations/JoinLanding";

// Public, and the one parent/student-facing surface in D19. Never indexed:
// the URL carries a single-use invitation token.
export const metadata: Metadata = {
  title: "Join your school - Nevo",
  robots: { index: false, follow: false },
};

// Next.js 16: `params` is a Promise and must be awaited.
export default async function JoinPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <JoinLanding token={token} />;
}
