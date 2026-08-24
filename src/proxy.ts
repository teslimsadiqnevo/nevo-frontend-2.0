import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ROLE_COOKIE } from "@/lib/auth/session";

/**
 * Route guard. Next 16 renamed the `middleware` convention to `proxy`; one
 * file per project, at the same level as `app/`.
 *
 * OPTIMISTIC ONLY. It reads the role mirror cookie written by
 * `lib/auth/session.ts` - never the Bearer token, which lives in
 * localStorage and is invisible to any server. The cookie is client-written
 * and forgeable, so this decides *routing*, not access: the FastAPI Bearer
 * check is the authorization boundary, and every teacher surface still
 * fetches through the API client. What this buys is that a signed-out
 * visitor never receives console markup at all - no flash of a roster that
 * isn't theirs.
 *
 * Teacher routes only for now. Student onboarding is a long pre-auth flow
 * and the admin sign-in screen isn't built, so guarding either would send
 * people to doors that don't exist yet - flagged, not forgotten.
 */

const SIGN_IN = "/auth/teacher";
const CONSOLE_HOME = "/teacher/dashboard";

/** The invite link lands here with no session - it is how you get one. */
const PRE_AUTH_TEACHER_ROUTES = ["/teacher/onboarding"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const role = request.cookies.get(ROLE_COOKIE)?.value;
  const isTeacher = role === "teacher";

  if (pathname.startsWith("/teacher")) {
    if (PRE_AUTH_TEACHER_ROUTES.some((p) => pathname.startsWith(p))) {
      return NextResponse.next();
    }
    if (!isTeacher) {
      const url = new URL(SIGN_IN, request.url);
      // So the door can send them back where they were headed.
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // A signed-in teacher has no use for their own door.
  if (pathname === SIGN_IN && isTeacher) {
    return NextResponse.redirect(new URL(CONSOLE_HOME, request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Narrow on purpose: nothing else is guarded, so static assets and the
  // /api/backend proxy route never reach this file.
  matcher: ["/teacher", "/teacher/:path*", "/auth/teacher"],
};
