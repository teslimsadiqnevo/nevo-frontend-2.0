import type { Metadata } from "next";
import { ParentSignIn } from "@/components/parent/ParentSignIn";

/**
 * D03 Parent Sign-In.
 *
 * A SEPARATE TOP-LEVEL PATH, for the same reason `/parent-portal` is one:
 * `/parent/[token]` is a dynamic route, so `/parent/sign-in` would be a static
 * segment competing with it, and a consent token that happened to equal
 * "sign-in" would silently open the wrong page. A distinct prefix removes the
 * question rather than relying on Next's resolution order.
 *
 * Never indexed: it names no one, but everything it leads to is one family's
 * data, and a sign-in page for a children's product has no reason to be in a
 * search result.
 */
export const metadata: Metadata = {
  title: "Sign in - Nevo",
  robots: { index: false, follow: false },
};

export default function ParentSignInPage() {
  return <ParentSignIn />;
}
