import type { Metadata } from "next";
import { ParentPortal } from "@/components/parent/ParentPortal";

/**
 * The parent action page (SCRUM-80, D01b and D01c).
 *
 * ONE URL, TWO SCREENS. A parent gets a single link and may tap it before
 * deciding or long after; `ParentPortal` reads the record and shows whichever
 * is true - the consent request, or data management. See that file for why the
 * route does not choose.
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
  return <ParentPortal token={token} />;
}
