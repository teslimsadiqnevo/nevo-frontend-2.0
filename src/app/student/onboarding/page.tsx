import type { Metadata } from "next";
import { WelcomeScreen } from "@/components/student/Welcome/WelcomeScreen";

export const metadata: Metadata = {
  title: "Welcome - Nevo",
};

// The onboarding flow entry is the Welcome Screen (B.1). Subsequent steps
// (name, school, class) live under /student/onboarding/*.
export default function StudentOnboardingPage() {
  return <WelcomeScreen />;
}
