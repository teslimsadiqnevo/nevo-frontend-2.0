"use client";

import type { ReactNode } from "react";
import { useLandingMotion } from "./useLandingMotion";

/**
 * The landing page's only reason to be a client component.
 *
 * `LandingPage` used to carry `"use client"` itself, purely so it could call
 * `useLandingMotion()`. That one directive pulled the ENTIRE page into the
 * client bundle - roughly 3,200 lines across five files, almost all of it
 * static marketing markup with no state, no handlers and nothing to hydrate.
 * `ProofSections` and `StorySections` have zero hooks between them, and were
 * being shipped to the browser anyway because their parent was a client
 * component.
 *
 * This wrapper is the boundary instead. Children passed INTO a client
 * component from a server component stay server-rendered - React does not
 * pull them across - so the sections render to HTML and never reach the
 * browser as JavaScript.
 *
 * The hook needs nothing from React to do its work: it takes no arguments and
 * reaches the DOM through `document`, so it does not care which side rendered
 * the markup it animates.
 */
export function LandingMotion({ children }: { children: ReactNode }) {
  useLandingMotion();
  return <>{children}</>;
}
