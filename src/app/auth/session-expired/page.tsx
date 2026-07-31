import type { Metadata } from "next";
import { SessionEndScreen } from "@/components/student/Auth/SessionEndScreen";

export const metadata: Metadata = {
  title: "Session expired - Nevo",
};

// Board 28: idle timeout landing. The auth layer routes here later (TODO(api)).
export default function SessionExpiredPage() {
  return <SessionEndScreen variant="expired" />;
}
