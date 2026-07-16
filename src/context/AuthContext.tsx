"use client";

import { createContext, useMemo, useState, type ReactNode } from "react";
import type { UserRole } from "@/lib/constants";

/** The authenticated user (Product Arch A.1–A.2). */
export interface AuthUser {
  id: string;
  role: UserRole;
  schoolId: string;
  name?: string;
  /**
   * How the student authenticated. Drives onboarding conditional branching:
   * SSO students skip Steps 1–3 (name/school/class) and enter the sequence
   * directly (Product Arch B.2). Populated from the session once auth lands.
   */
  method?: "sso" | "manual";
}

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export interface AuthContextValue {
  user: AuthUser | null;
  status: AuthStatus;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // TODO(auth): hydrate from the session (authApi.session) once the FastAPI auth
  // contract exists (see proxy.ts). Starts unauthenticated for now.
  const [user] = useState<AuthUser | null>(null);
  const value = useMemo<AuthContextValue>(
    () => ({ user, status: user ? "authenticated" : "unauthenticated" }),
    [user],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
