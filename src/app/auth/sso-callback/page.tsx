import type { Metadata } from "next";
import { Suspense } from "react";
import { SsoCallback } from "@/components/student/Auth/SsoCallback";

export const metadata: Metadata = {
  title: "Signing you in - Nevo",
};

// The Student App's dedicated SSO entry point: the identity provider redirects
// here, we resolve the handshake, then route first-use students into onboarding
// and returning students into the app. Kept separate from the manual Welcome →
// Steps 1–3 entry; the paths converge only at the Observed Interaction Sequence.
//
// `SsoCallback` reads `useSearchParams`, which requires a Suspense boundary.
export default function SsoCallbackPage() {
  return (
    <Suspense>
      <SsoCallback />
    </Suspense>
  );
}
