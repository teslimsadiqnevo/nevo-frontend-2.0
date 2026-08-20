import type { Metadata } from "next";
import { UploadWizard } from "@/components/teacher/Upload/UploadWizard";

export const metadata: Metadata = {
  title: "Upload a lesson - Nevo",
};

// C07 Lesson Upload (SCRUM-102.6 reconciled flow) - scope first, then the
// path the teacher chose: light for a single lesson, staged for a block.
export default function TeacherUploadPage() {
  return <UploadWizard />;
}
