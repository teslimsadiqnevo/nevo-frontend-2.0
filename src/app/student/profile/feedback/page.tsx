import type { Metadata } from "next";
import { StudentFeedbackScreen } from "@/components/student/Feedback/StudentFeedbackScreen";

export const metadata: Metadata = {
  title: "Share feedback - Nevo",
};

// "Tell us something" (Profile & Settings) - the student feedback view (SCRUM-68).
export default function StudentFeedbackPage() {
  return <StudentFeedbackScreen />;
}
