import type { Metadata } from "next";
import { SessionEndScreen } from "@/components/student/Auth/SessionEndScreen";

export const metadata: Metadata = {
  title: "Session ended - Nevo",
};

// The signed-in-elsewhere state at its own URL. `sessionExpiredDoor` routes a
// 401 to `/auth/session-expired?reason=session_replaced` rather than here, so
// this route exists for the designed flow and for anything that links it
// directly; both render the same screen.
export default function SessionEndedPage() {
  return <SessionEndScreen variant="replaced" />;
}
