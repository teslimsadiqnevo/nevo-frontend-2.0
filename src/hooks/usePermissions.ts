"use client";

import { useContext } from "react";
import { PermissionContext } from "@/context/PermissionContext";
import type { PermissionScope } from "@/lib/constants";

/** Admin permission-scope checks — Admin Layer only (FE Architecture §2 & §8). */
export function usePermissions() {
  const ctx = useContext(PermissionContext);
  if (ctx === undefined) {
    throw new Error("usePermissions must be used within <PermissionProvider>");
  }
  return {
    scopes: ctx.scopes,
    hasScope: (scope: PermissionScope) => ctx.scopes.includes(scope),
  };
}
