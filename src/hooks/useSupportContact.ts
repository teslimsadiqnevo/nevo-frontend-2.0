"use client";

import { useEffect, useState } from "react";
import { supportApi, type SupportContact } from "@/lib/api/support";

/**
 * NOT `useLiveQuery`, and that is the point.
 *
 * `useLiveQuery` returns early unless `getToken()` is set - correctly, since
 * every other read in this console is a teacher's own data. `GET
 * /api/v1/support-contact` is public on purpose: backend's reasoning is that a
 * teacher who cannot sign in is exactly who needs it. Routing this through
 * `useLiveQuery` would have made the help screen blank for the one person it
 * exists for, and the failure would have looked like a backend outage.
 *
 * So this fetches regardless of session, and the screen it feeds is on the
 * pre-auth allowlist in `proxy.ts`.
 */
export interface SupportContactState {
  contact: SupportContact | null;
  loading: boolean;
  failed: boolean;
}

export function useSupportContact(): SupportContactState {
  const [contact, setContact] = useState<SupportContact | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    supportApi
      .contact()
      .then((c) => {
        if (!cancelled) {
          setContact(c);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFailed(true);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { contact, loading, failed };
}
