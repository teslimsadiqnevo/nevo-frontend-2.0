import type { Metadata } from "next";
import { AdminTeamView } from "@/components/admin/Team/AdminTeamView";

export const metadata: Metadata = {
  title: "Admin team - Nevo",
};

// D03 Admin Team & Permissions - who can see and do what.
export default function AdminTeamPage() {
  return <AdminTeamView />;
}
