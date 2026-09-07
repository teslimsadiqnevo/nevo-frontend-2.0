import type { Metadata } from "next";
import { ParentDataManagement } from "@/components/parent/ParentDataManagement";

/**
 * The parent action page (SCRUM-80, D01c).
 *
 * PUBLIC. `proxy.ts` guards /teacher, /admin and /student, so this needs no
 * exemption - but it is worth stating rather than rediscovering: a parent
 * never signs in, and putting a login in front of a statutory data right
 * would defeat the point of having it.
 *
 * Never indexed: the URL carries a token identifying one parent/child pair.
 */
export const metadata: Metadata = {
  title: "Your child's data - Nevo",
  robots: { index: false, follow: false },
};

// Next.js 16: `params` is a Promise and must be awaited.
export default async function ParentPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <ParentDataManagement token={token} />;
}
