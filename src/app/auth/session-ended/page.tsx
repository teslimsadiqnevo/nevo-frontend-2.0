import type { Metadata } from "next";
import { SessionEndScreen } from "@/components/student/Auth/SessionEndScreen";

export const metadata: Metadata = {
  title: "Signed in elsewhere - Nevo",
};

// Board 28: concurrent-session landing. The auth layer routes here later (TODO(api)).
export default function SessionEndedPage() {
  return <SessionEndScreen variant="concurrent" />;
}
