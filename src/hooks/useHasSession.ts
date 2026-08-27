"use client";

import { useSyncExternalStore } from "react";
import { getToken } from "@/lib/auth/session";

/**
 * Whether a real signed-in session exists on this device.
 *
 * The teacher console ships with a fixture persona - Ms. Adeyemi - which is
 * right for the designed screens and wrong the moment somebody actually signs
 * in, because the session payload carries a `user_id` and a role and no name
 * at all. So the rule is: with a session, we do not know who this is, and the
 * UI says nothing rather than saying the wrong thing.
 *
 * Deliberately not derived from the class fetch: a teacher whose classes fail
 * to load is still not Ms. Adeyemi.
 *
 * The token lives in localStorage, which the server cannot see. Reading it
 * through `useSyncExternalStore` keeps the server snapshot false and lets the
 * client settle on the truth without a hydration mismatch - and the `storage`
 * subscription means signing out in another tab updates this one.
 *
 * TODO(api): a teacher profile endpoint, after which this becomes a name
 * rather than the absence of one.
 */
function subscribe(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

const clientSnapshot = () => Boolean(getToken());
const serverSnapshot = () => false;

export function useHasSession(): boolean {
  return useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
}
