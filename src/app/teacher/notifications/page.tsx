import { redirect } from "next/navigation";

// C13 is a popover from the sidebar bell, not a page - the old stub route
// redirects home so nothing links into a dead end. Flagged to design.
export default function TeacherNotificationsPage() {
  redirect("/teacher/dashboard");
}
