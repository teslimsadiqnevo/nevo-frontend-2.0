import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ROLE_COOKIE } from "@/lib/auth/session";
import { isAdminRole } from "@/lib/constants/permissions";

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
 * Teacher and admin routes. Student onboarding is a long pre-auth flow with no
 * door to send anyone to, so it stays unguarded - flagged, not forgotten.
 *
 * The admin check is `isAdminRole`, never `role === "admin"`: the API returns
 * `senco_admin` or `other_admin` and nothing else, confirmed against a live
 * account rather than read off the schema.
 */

const SIGN_IN = "/auth/teacher";
const CONSOLE_HOME = "/teacher/dashboard";
const ADMIN_SIGN_IN = "/auth/admin";
const ADMIN_HOME = "/admin/dashboard";

/** The invite link lands here with no session - it is how you get one. */
const PRE_AUTH_TEACHER_ROUTES = ["/teacher/onboarding"];
/** D01 stands the workspace up before anyone can possibly have a session. */
const PRE_AUTH_ADMIN_ROUTES = ["/admin/onboarding"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const role = request.cookies.get(ROLE_COOKIE)?.value;
  const isTeacher = role === "teacher";
  const isAdmin = isAdminRole(role);

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

  if (pathname.startsWith("/admin")) {
    if (PRE_AUTH_ADMIN_ROUTES.some((p) => pathname.startsWith(p))) {
      return NextResponse.next();
    }
    if (!isAdmin) {
      const url = new URL(ADMIN_SIGN_IN, request.url);
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Nobody signed in has any use for their own door.
  if (pathname === SIGN_IN && isTeacher) {
    return NextResponse.redirect(new URL(CONSOLE_HOME, request.url));
  }
  if (pathname === ADMIN_SIGN_IN && isAdmin) {
    return NextResponse.redirect(new URL(ADMIN_HOME, request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Narrow on purpose: nothing else is guarded, so static assets and the
  // /api/backend proxy route never reach this file.
  matcher: [
    "/teacher",
    "/teacher/:path*",
    "/auth/teacher",
    "/admin",
    "/admin/:path*",
    "/auth/admin",
  ],
};
