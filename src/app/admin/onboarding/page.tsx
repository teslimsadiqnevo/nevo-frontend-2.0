import type { Metadata } from "next";
import { OnboardingWizard } from "@/components/admin/Onboarding/OnboardingWizard";

// D1 School Onboarding (SCRUM-39). Pre-auth by design - `proxy.ts` exempts
// this route, because it is what creates the session everything else needs.
export const metadata: Metadata = {
  title: "Set up your school - Nevo",
  robots: { index: false, follow: false },
};

export default function AdminOnboardingPage() {
  return <OnboardingWizard />;
}
