import type { Metadata } from "next";
import { ProgressTab } from "@/components/student/Progress/ProgressTab";

export const metadata: Metadata = {
  title: "Progress - Nevo",
};

export default function StudentProgressPage() {
  return <ProgressTab />;
}
