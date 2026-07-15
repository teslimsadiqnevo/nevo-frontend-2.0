import type { Metadata } from "next";
import { SchoolConnectionStep } from "@/components/student/Onboarding/SchoolConnectionStep";

export const metadata: Metadata = {
  title: "School code — Nevo",
};

export default function OnboardingSchoolPage() {
  return <SchoolConnectionStep />;
}
