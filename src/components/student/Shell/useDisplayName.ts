"use client";

import { useEffect, useState } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useHasSession } from "@/hooks/useHasSession";
import { useHydrated } from "@/hooks/useHydrated";
import { settingsApi } from "@/lib/api/settings";
import { getStoredDisplayName, getToken } from "@/lib/auth/session";
import { MOCK_STUDENT } from "./studentNav";

function initialsOf(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * What to call the student.
 *
 * Precedence: the name they chose for themselves on this device, then the
 * same choice stored against their ACCOUNT (so it follows them to a school
 * tablet), then the account's real name from `GET /api/v1/users/me` - first
 * name only, because this app speaks to children by first name - then the
 * fixture, which now only ever shows signed out.
 *
 * A signed-in student whose name has not resolved yet is briefly nameless
 * rather than briefly "Ada": being called someone else's name is worse than
 * a beat without one.
 *
 * THE HYDRATION FRAME COUNTS AS "NOT RESOLVED YET". `useHasSession()` returns
 * the SERVER's answer - false - until hydration, so gating the fixture on
 * `!signedIn` alone still called a real child "Ada" (and "AK") for one frame,
 * which is the thing the paragraph above exists to prevent. Nobody is named
 * until we know who is looking; a signed-out visitor gets the fixture one
 * frame later, which costs nothing.
 */
export function useDisplayName(): { name: string; initials: string } {
  const signedIn = useHasSession();
  const hydrated = useHydrated();
  const identity = useCurrentUser();
  const [stored, setStored] = useState<string | null>(null);
  const [account, setAccount] = useState<string | null>(null);

  useEffect(() => {
    const s = getStoredDisplayName();
    if (s) {
      // Post-mount hydration read of an external store, same pattern as
      // AccessibilityContext - it cannot run during render without a mismatch.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStored(s);
    }
  }, []);

  // The account-stored choice, for a device that has never seen this child.
  useEffect(() => {
    if (!getToken()) return;
    let cancelled = false;
    void settingsApi
      .get()
      .then((res) => {
        const name = (res.settings as { displayName?: unknown })?.displayName;
        if (!cancelled && typeof name === "string" && name.trim()) {
          setAccount(name.trim());
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const serverFirst = identity?.name?.split(/\s+/)[0] ?? null;
  const chosen = stored ?? account;
  // Only once we can actually tell a signed-out visitor from a signed-in child.
  const fixture = hydrated && !signedIn;
  const name = chosen ?? serverFirst ?? (fixture ? MOCK_STUDENT.name : "");
  const initials =
    (chosen ? initialsOf(chosen) : "") ||
    (identity?.initials ?? "") ||
    (fixture ? MOCK_STUDENT.initials : "");

  return { name, initials };
}
