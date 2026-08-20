import type { Metadata } from "next";
import { TeacherHome } from "@/components/teacher/Home/TeacherHome";

export const metadata: Metadata = {
  title: "Home - Nevo",
};

// C03 Home Dashboard - the teacher's 10-second morning scan.
export default function TeacherDashboardPage() {
  return <TeacherHome />;
}
