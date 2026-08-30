import { BookOpen, Download, House, MessageCircle, Sprout, UserRound } from "lucide-react";
import type { NavItem } from "@/components/shared";

/** Student App primary navigation (Product Arch B.5) — sidebar + bottom nav. */
export const STUDENT_NAV: NavItem[] = [
  { label: "Home", href: "/student/dashboard", icon: House },
  { label: "Lessons", href: "/student/lessons", icon: BookOpen },
  // Growth, not scores — a sprout rather than a chart.
  { label: "Progress", href: "/student/progress", icon: Sprout },
  { label: "Downloads", href: "/student/downloads", icon: Download },
  { label: "Connect", href: "/student/connect", icon: MessageCircle },
  { label: "Profile", href: "/student/profile", icon: UserRound },
];

/**
 * The fixture student, for the signed-out designed screens only - a live
 * session reads its name through `useDisplayName`, which prefers the
 * device-chosen name, then `users/me`. `subtitle` still has no live source
 * (users/me carries no year group) and ProfilingFlow's band selection reads
 * it - flagged.
 */
export const MOCK_STUDENT = {
  name: "Ada",
  subtitle: "Year 4",
  initials: "AK",
};
