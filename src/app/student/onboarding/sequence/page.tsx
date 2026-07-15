import type { Metadata } from "next";
import { ObservedInteractionSequence } from "@/components/student/Onboarding/ObservedInteractionSequence";

export const metadata: Metadata = {
  title: "Getting to know you — Nevo",
};

export default function OnboardingSequencePage() {
  return <ObservedInteractionSequence />;
}
