import { redirect } from "next/navigation";

// `/teacher` is the console's root and had no page at all, so it fell through
// to the global not-found - while being listed in the proxy matcher and in
// `PRIVATE_PATHS`, which is to say it was guarded as a real route and then
// 404'd. Nothing in-app linked to it, but it is the address a teacher types
// or bookmarks.
//
// Home is `/teacher/dashboard` per `TEACHER_NAV`, so the root sends there.
export default function TeacherRootPage() {
  redirect("/teacher/dashboard");
}
