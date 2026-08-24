"use client";

import { createContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { permissionsApi } from "@/lib/api";
import { getToken } from "@/lib/auth/session";
import { ALL_PERMISSION_SCOPES, type PermissionScope } from "@/lib/constants";

/** Current admin's permission scopes — Admin Layer only (FE Architecture §8). */
export interface PermissionContextValue {
  scopes: PermissionScope[];
  /** True once /api/v1/permissions/me has answered (or been skipped). */
  resolved: boolean;
}

export const PermissionContext = createContext<PermissionContextValue | undefined>(
  undefined,
);

export function PermissionProvider({ children }: { children: ReactNode }) {
  const [scopes, setScopes] = useState<PermissionScope[]>([]);
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const finish = () => {
      if (!cancelled) setResolved(true);
    };
    // No session, nothing to ask - admin surfaces stay scope-less until
    // login. Resolution is scheduled, never set synchronously in the effect
    // body (react-hooks/set-state-in-effect).
    if (!getToken()) {
      const t = setTimeout(finish, 0);
      return () => {
        cancelled = true;
        clearTimeout(t);
      };
    }
    permissionsApi
      .me()
      .then((me) => {
        if (cancelled) return;
        // Keep only scope strings the frontend knows; the constants mirror
        // the backend enum, so this only drops future additions.
        setScopes(
          me.scopes.filter((s): s is PermissionScope =>
            (ALL_PERMISSION_SCOPES as string[]).includes(s),
          ),
        );
      })
      .catch(() => {
        // Unreachable backend or non-admin session - scope checks simply fail
        // closed with an empty scope list.
      })
      .finally(finish);
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<PermissionContextValue>(
    () => ({ scopes, resolved }),
    [scopes, resolved],
  );
  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}
