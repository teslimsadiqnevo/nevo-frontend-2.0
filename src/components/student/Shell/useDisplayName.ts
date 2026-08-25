"use client";

import { useEffect, useState } from "react";
import { getStoredDisplayName } from "@/lib/auth/session";
import { MOCK_STUDENT } from "./studentNav";

function initialsOf(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || MOCK_STUDENT.initials
  );
}

/**
 * What to call the student. Reads the device-stored name after mount (the
 * fixture renders first so the server and client agree), so a student who
 * renames themselves is called that everywhere - not just on the screen
 * where they typed it.
 *
 * TODO(api): sourced from the profile endpoint once it exists.
 */
export function useDisplayName(): { name: string; initials: string } {
  const [name, setName] = useState(MOCK_STUDENT.name);

  useEffect(() => {
    const stored = getStoredDisplayName();
    // Post-mount hydration read of an external store, same pattern as
    // AccessibilityContext - it cannot run during render without a mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored && stored !== name) setName(stored);
  }, [name]);

  return { name, initials: initialsOf(name) };
}
