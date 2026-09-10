import { redirect } from "next/navigation";

// `/admin` is the console's root and had no page at all, so it fell through to
// the global not-found - while `proxy.ts` lists it in the matcher (:131) and
// guards it at :82, which is to say it was treated as a real route and then
// 404'd for a signed-in admin who typed or bookmarked the bare address.
//
// The teacher console had the identical hole and closed it the same way; this
// mirrors `src/app/teacher/page.tsx` rather than inventing a second shape.
//
// Home is `/admin/dashboard`, which is both the first entry in `ADMIN_NAV` and
// the proxy's own `ADMIN_HOME` (:44) - so the redirect cannot disagree with
// where the guard already sends people.
export default function AdminRootPage() {
  redirect("/admin/dashboard");
}
