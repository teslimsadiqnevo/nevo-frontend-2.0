import type { Metadata } from "next";
import { ConsoleSessionExpired } from "@/components/shared/ConsoleSessionExpired";

export const metadata: Metadata = {
  title: "Session expired - Nevo",
};

/** The teacher console's timeout landing; the door behind it is the teacher's. */
export default function TeacherSessionExpiredPage() {
  return <ConsoleSessionExpired signInHref="/auth/teacher" />;
}
