import { redirect } from "next/navigation";

// `/student` is the console's root and had no page at all, so it fell through
// to the global not-found. Nothing in-app links to it - it is the address a
// child types or bookmarks, and the one a parent or teacher would write down.
// It is already declared a product surface in `PRIVATE_PATHS`, so it was
// treated as a real route everywhere except in having one.
//
// The same defect was fixed for `/teacher` on 5 Sep; this is that fix.
//
// Home is `/student/dashboard` per `STUDENT_NAV`, so the root sends there.
// Deliberately unconditional: unlike `/teacher`, student routes are not
// guarded by `proxy.ts` - onboarding is a long pre-auth flow - and the
// dashboard already draws the signed-out walkthrough for a visitor with no
// session. Sending a signed-out child to a sign-in page here would be the
// behaviour change, not the redirect.
export default function StudentRootPage() {
  redirect("/student/dashboard");
}
