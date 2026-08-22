import type { Metadata } from "next";
import { InsightsView } from "@/components/teacher/Insights/InsightsView";

export const metadata: Metadata = {
  title: "Insights - Nevo",
};

// C09 Insights - class + learner signals, with the C14 A2 quiet-week and
// A3 no-class-selected states.
export default function TeacherInsightsPage() {
  return <InsightsView />;
}
