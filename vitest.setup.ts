import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

/**
 * Setup for the `dom` project. Deliberately minimal.
 *
 * An earlier version replaced `window.location` here with a recording stub, so
 * that `handleAuthFailure`'s redirect could be asserted on. It hung the jsdom
 * worker every time - sixty seconds, then "Timeout waiting for worker to
 * respond", with no stack pointing anywhere near this file. Redefining
 * `location` at module scope is not worth that, and a global stub would apply
 * to every test whether it wanted one or not.
 *
 * A test that needs the redirect should stub it for the length of that test
 * only, rather than globally. NOTE (8 Sep): this paragraph used to point at
 * `stubNavigation()` in `src/test/navigation.ts`, which has never existed in
 * this repo and which nothing imports - don't go looking for it.
 */

/**
 * jsdom implements no `matchMedia`, and the app reads it in ordinary paths -
 * `useSignals` stamps `prefers-reduced-motion` onto every event's payload. A
 * missing function there throws inside `trackEvent`, which is a long way from
 * anything the test was about.
 *
 * Adding a function jsdom simply lacks is not the same as replacing one it
 * has: this is safe where redefining `window.location` was not.
 */
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  window.sessionStorage.clear();
  // Cookies survive a storage clear, and `session.ts` writes a role mirror
  // cookie that would otherwise leak into the next test.
  for (const c of document.cookie.split(";")) {
    const name = c.split("=")[0]?.trim();
    if (name) document.cookie = `${name}=; Path=/; Max-Age=0`;
  }
  vi.restoreAllMocks();
});
