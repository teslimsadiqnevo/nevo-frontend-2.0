import type { Metadata } from "next";
import { InvitationsView } from "@/components/admin/Invitations/InvitationsView";

export const metadata: Metadata = {
  title: "Invitations - Nevo",
};

// D19 School Invitations (SCRUM-79) - the single home for inviting teachers
// and students. D6 and D7 both defer here.
export default function AdminInvitationsPage() {
  return <InvitationsView />;
}
