"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { authApi } from "@/lib/api";
import { clearSession, getSession } from "@/lib/auth/session";
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
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  // Hydrate from the live backend: a stored Bearer token is validated against
  // GET /auth/session on mount; a rejected/expired token clears quietly.
  useEffect(() => {
    let cancelled = false;
    // Sync from the external session store + backend session endpoint.
    const hydrate = () => {
      const stored = getSession();
      if (!stored) {
        setStatus("unauthenticated");
        return;
      }
      authApi
        .session()
        .then((s) => {
          if (cancelled) return;
          // TODO(api): session carries no school id yet - flagged to backend.
          setUser({ id: s.user_id, role: s.role as UserRole, schoolId: "" });
          setStatus("authenticated");
          setEphemeralStudent(s.user_id);
        })
        .catch(() => {
          if (cancelled) return;
          clearSession();
          setStatus("unauthenticated");
        });
    };
    hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback((next: AuthUser) => {
    setUser(next);
    setStatus("authenticated");
    // Ephemeral behavioural signals are tagged per student, on-device only.
    setEphemeralStudent(next.id);
  }, []);
  const signOut = useCallback(() => {
    // Server-side revoke is best-effort; the local session always clears.
    void authApi.logout().catch(() => {});
    setUser(null);
    setStatus("unauthenticated");
    // NDPA ephemerality (SCRUM-76): sign-out purges the on-device
    // behavioural-signal store and retires its session id.
    void endEphemeralSession();
  }, []);
  const value = useMemo<AuthContextValue>(
    () => ({ user, status, signIn, signOut }),
    [user, status, signIn, signOut],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
