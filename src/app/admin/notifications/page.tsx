import type { Metadata } from "next";
import { NotificationsView } from "@/components/admin/Notifications/NotificationsView";

export const metadata: Metadata = {
  title: "Notifications - Nevo",
};

// D13b Notifications - the record and the preferences (SCRUM-100). One route,
// three views: the list, the archive, and per-category preferences.
export default function AdminNotificationsPage() {
  return <NotificationsView />;
}
