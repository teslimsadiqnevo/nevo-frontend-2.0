"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks";

/** Where SSO students land, skipping Welcome + Steps 1–3. */
const SEQUENCE_SSO = "/student/onboarding/sequence?path=sso";

/**
 * Onboarding conditional branching (Product Arch B.2). SSO students already have
 * an identity + school from the identity provider, so they skip Steps 1–3
 * (name/age, school connection, class confirmation) and drop straight into the
 * Observed Interaction Sequence.
 *
 * Call at the top of the Welcome + Step 1–3 screens and bail out of render while
 * redirecting:  `if (useSSOSkip()) return null;`
 *
 * Returns whether the current user is being redirected (SSO). Manual students
 * (and, until auth hydrates, everyone) render normally.
 */
export function useSSOSkip(): boolean {
  const { user } = useAuth();
  const router = useRouter();
  const isSSO = user?.method === "sso";

  useEffect(() => {
    if (isSSO) router.replace(SEQUENCE_SSO);
  }, [isSSO, router]);

  return isSSO;
}
