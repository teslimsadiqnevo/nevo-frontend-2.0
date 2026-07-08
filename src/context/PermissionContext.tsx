"use client";

import { createContext, useMemo, type ReactNode } from "react";
import type { PermissionScope } from "@/lib/constants";

/** Current admin's permission scopes — Admin Layer only (FE Architecture §8). */
export interface PermissionContextValue {
  scopes: PermissionScope[];
}

export const PermissionContext = createContext<PermissionContextValue | undefined>(
  undefined,
);

export function PermissionProvider({ children }: { children: ReactNode }) {
  // TODO: derive scopes from the authenticated admin once auth is wired.
  const value = useMemo<PermissionContextValue>(() => ({ scopes: [] }), []);
  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}
