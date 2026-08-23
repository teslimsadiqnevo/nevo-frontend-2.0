import type { Metadata } from "next";
import { ProfileSettings } from "@/components/teacher/Profile/ProfileSettings";

export const metadata: Metadata = {
  title: "Profile & account - Nevo",
};

// C11 Profile and Settings, with the C14 B6 save model.
export default function TeacherProfilePage() {
  return <ProfileSettings />;
}
