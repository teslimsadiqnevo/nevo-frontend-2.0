import type { Metadata } from "next";
import { ParentHome } from "@/components/parent/ParentHome";

/**
 * The signed-in parent portal (D15d).
 *
 * A SEPARATE TOP-LEVEL PATH, not a segment under `/parent`. `/parent/[token]`
 * is a dynamic route, so `/parent/portal` would be a static segment competing
 * with it - Next resolves that in the static segment's favour, but it means a
 * token that happened to equal "portal" would silently open the wrong page.
 * A distinct prefix removes the question entirely.
 *
 * Never indexed: everything below it is one family's data.
 */
export const metadata: Metadata = {
  title: "How your child is growing - Nevo",
  robots: { index: false, follow: false },
};

export default function ParentPortalPage() {
  return <ParentHome />;
}
