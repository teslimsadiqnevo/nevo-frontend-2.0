import type { Metadata } from "next";
import { WarmUpRun } from "@/components/student/Profiling/WarmUpRun";

export const metadata: Metadata = {
  title: "Daily warm-up - Nevo",
};

// The daily micro-dosing warm-up (SCRUM-104): one round of the day's baseline
// task, opened from the dashboard's Warm-Up Card.
export default function WarmUpPage() {
  return <WarmUpRun />;
}
