import type { Metadata } from "next";
import { ConnectView } from "@/components/teacher/Connect/ConnectView";

export const metadata: Metadata = {
  title: "Connect - Nevo",
};

// C10 Connect - teacher-student threads with optional parent inclusion, plus
// the C10b compose modal and the C14 A4 empty state.
export default function TeacherConnectPage() {
  return <ConnectView />;
}
