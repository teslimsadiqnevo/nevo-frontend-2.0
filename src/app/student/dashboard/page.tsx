import type { Metadata } from "next";
import { HomeDashboard } from "@/components/student/Home/HomeDashboard";

export const metadata: Metadata = {
  title: "Home — Nevo",
};

export default function StudentDashboardPage() {
  return <HomeDashboard />;
}
