import type { Metadata } from "next";
import { SessionEndScreen } from "@/components/student/Auth/SessionEndScreen";

export const metadata: Metadata = {
  title: "Session ended - Nevo",
};

// Frame 28a. Reached when a 401 carries `session_revoked` - somebody signed
// this device out, from the school's side or another device of the child's own.
// Ungated like the other session-end routes: a child arriving here has just had
// their token cleared, so anything requiring one would bounce them again.
export default function SessionRevokedPage() {
  return <SessionEndScreen variant="revoked" />;
}
