import type { Metadata } from "next";
import { ChangePinScreen } from "@/components/student/Profile/ChangePinScreen";

export const metadata: Metadata = {
  title: "Change PIN - Nevo",
};

// "Change PIN" (Profile & Settings) - reuses the onboarding PIN pattern.
export default function StudentChangePinPage() {
  return <ChangePinScreen />;
}
