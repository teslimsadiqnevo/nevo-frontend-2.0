"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { usePermissions } from "@/hooks/usePermissions";
import { adminHomeForScopes } from "@/components/admin/Shell/adminNav";

/**
 * `/admin` is the console's door, and it now CHOOSES where to open.
 *
 * It used to redirect straight to `/admin/dashboard` for everyone, which was
 * right while the Overview was the only home. It is not any more: the Overview
 * is gated on `oversight`, so an IT contractor or a finance administrator was
 * sent to a screen that refuses them - their first sight of Nevo being a
 * refusal. D17 and D18 exist now and `adminHomeForScopes` picks between them.
 *
 * WHY HERE AND NOT IN THE PROXY. `proxy.ts` reads only the role mirror cookie,
 * and the role is `senco_admin | other_admin` - which says nothing about
 * scopes. `GET /api/v1/permissions/me` is the only source, and
 * `PermissionProvider` already fetches it above every /admin route, so this
 * costs no extra request.
 *
 * It waits for `resolved`. Redirecting on an empty scope list before the answer
 * arrives would send every admin to the fallback on every cold load.
 */
export default function AdminRootPage() {
  const router = useRouter();
  const { scopes, resolved } = usePermissions();

  useEffect(() => {
    if (!resolved) return;
    router.replace(adminHomeForScopes(scopes));
  }, [resolved, scopes, router]);

  return null;
}
