import type { Metadata } from "next";
import { ObservedInteractionSequence } from "@/components/student/Onboarding/ObservedInteractionSequence";

export const metadata: Metadata = {
  title: "Getting to know you - Nevo",
};

// The convergence point for both onboarding entries. Whether the run is SSO or
// manual is read from the session inside the sequence (`user.method`), not from
// the URL — so there's no spoofable `?path=sso` and no per-screen branching.
export default function OnboardingSequencePage() {
  return <ObservedInteractionSequence />;
}
