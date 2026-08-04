"use client";

import {
  createContext,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { UserRole } from "@/lib/constants";
import {
  endEphemeralSession,
  setEphemeralStudent,
} from "@/lib/signals/ephemeralStore";

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
  /**
   * Establish a client session. Real auth will hydrate this from the FastAPI
   * session (see proxy.ts); today it's called by the SSO callback once the
   * identity provider returns, so onboarding reads `user.method` from the
   * session rather than a spoofable `?path=sso` query param.
   */
  signIn: (user: AuthUser) => void;
  /** End the client session (Sign Out Modal). TODO(auth): revoke server-side. */
  signOut: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // TODO(auth): hydrate from the session (authApi.session) once the FastAPI auth
  // contract exists (see proxy.ts). Starts unauthenticated for now.
  const [user, setUser] = useState<AuthUser | null>(null);
  const signIn = useCallback((next: AuthUser) => {
    setUser(next);
    // Ephemeral behavioural signals are tagged per student, on-device only.
    setEphemeralStudent(next.id);
  }, []);
  const signOut = useCallback(() => {
    setUser(null);
    // NDPA ephemerality (SCRUM-76): sign-out purges the on-device
    // behavioural-signal store and retires its session id.
    void endEphemeralSession();
  }, []);
  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status: user ? "authenticated" : "unauthenticated",
      signIn,
      signOut,
    }),
    [user, signIn, signOut],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
