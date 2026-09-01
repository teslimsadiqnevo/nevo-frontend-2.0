import type { Metadata } from "next";
import { ReportsView } from "@/components/admin/Reports/ReportsView";

export const metadata: Metadata = {
  title: "Cohort analytics - Nevo",
};

// D20 Cohort Analytics (SCRUM-65). Aggregate only - no individual learner
// appears on this screen.
export default function AdminReportsPage() {
  return <ReportsView />;
}
