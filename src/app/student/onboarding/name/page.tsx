import type { Metadata } from "next";
import { NameAndAgeStep } from "@/components/student/Onboarding/NameAndAgeStep";

export const metadata: Metadata = {
  title: "Your name — Nevo",
};

export default function OnboardingNamePage() {
  return <NameAndAgeStep />;
}
