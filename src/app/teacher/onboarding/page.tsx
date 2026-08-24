import type { Metadata } from "next";
import { TeacherOnboarding } from "@/components/teacher/Onboarding/TeacherOnboarding";

export const metadata: Metadata = {
  title: "Welcome - Nevo",
};

// C01 Teacher Onboarding - invite link to verified account, standalone
// (TeacherShell renders this route bare, no console chrome).
export default function TeacherOnboardingPage() {
  return <TeacherOnboarding />;
}
