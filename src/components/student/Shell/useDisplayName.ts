"use client";

import { useEffect, useState } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useHasSession } from "@/hooks/useHasSession";
import { getStoredDisplayName } from "@/lib/auth/session";
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
 * Precedence: the name they chose for themselves on this device (an explicit
 * act, and it survives the server disagreeing), then the account's real name
 * from `GET /api/v1/users/me` - first name only, because this app speaks to
 * children by first name - then the fixture, which now only ever shows
 * signed out.
 *
 * A signed-in student whose name has not resolved yet is briefly nameless
 * rather than briefly "Ada": being called someone else's name is worse than
 * a beat without one.
 */
export function useDisplayName(): { name: string; initials: string } {
  const signedIn = useHasSession();
  const identity = useCurrentUser();
  const [stored, setStored] = useState<string | null>(null);

  useEffect(() => {
    const s = getStoredDisplayName();
    // Post-mount hydration read of an external store, same pattern as
    // AccessibilityContext - it cannot run during render without a mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (s) setStored(s);
  }, []);

  const serverFirst = identity?.name?.split(/\s+/)[0] ?? null;
  const name = stored ?? serverFirst ?? (signedIn ? "" : MOCK_STUDENT.name);
  const initials =
    (stored ? initialsOf(stored) : "") ||
    (identity?.initials ?? "") ||
    (signedIn ? "" : MOCK_STUDENT.initials);

  return { name, initials };
}
