import type { Metadata } from "next";
import { ProfileSettings } from "@/components/student/Profile/ProfileSettings";

export const metadata: Metadata = {
  title: "Profile & Settings - Nevo",
};

export default function StudentProfilePage() {
  return <ProfileSettings />;
}
