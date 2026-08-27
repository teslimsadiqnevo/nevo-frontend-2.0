import type { Metadata } from "next";
import { Suspense } from "react";
import { ConnectView } from "@/components/teacher/Connect/ConnectView";

export const metadata: Metadata = {
  title: "Connect - Nevo",
};

// C10 Connect - teacher-student threads, the C10b compose modal and the C14 A4
// empty state. `?student=<slug>` opens compose addressed to that student, which
// is how "Message ..." elsewhere in the console arrives here.
export default function TeacherConnectPage() {
  return (
    <Suspense>
      <ConnectView />
    </Suspense>
  );
}
