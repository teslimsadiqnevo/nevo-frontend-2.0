"use client";

import { useSyncExternalStore } from "react";

/**
 * False on the server and during hydration, true once the client is running.
 *
 * The detail routes guard on `getToken()`, which reads localStorage - and the
 * server cannot see localStorage, so every one of those checks was false on
 * the server. `useLessonDetail`'s `loading` is derived from `useHasSession`,
 * whose server snapshot is deliberately false, so the loading branch did not
 * catch it either: the render fell straight through to `notFound()`.
 *
 * The result was that a REAL lesson, class or student page returned HTTP 404
 * on any hard load - refresh, bookmark, new tab, or a link sent to a
 * colleague. Class detail did not even recover on the client: it rendered
 * "This page doesn't exist" to a signed-in teacher looking at their own class.
 *
 * So the rule is: decide nothing that depends on the token until the client is
 * actually running. `subscribe` never fires because the answer only changes
 * once, at mount, which React already re-renders for.
 */
const noop = () => () => {};

export function useHydrated(): boolean {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}
