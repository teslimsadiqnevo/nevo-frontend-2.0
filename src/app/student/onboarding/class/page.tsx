import type { Metadata } from "next";
import { ClassConfirmationStep } from "@/components/student/Onboarding/ClassConfirmationStep";

export const metadata: Metadata = {
  title: "Your class - Nevo",
};

export default function OnboardingClassPage() {
  return <ClassConfirmationStep />;
}
