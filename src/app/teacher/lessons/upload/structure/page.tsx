import type { Metadata } from "next";
import { StructureTree } from "@/components/teacher/Upload/StructureTree";

export const metadata: Metadata = {
  title: "Review the structure - Nevo",
};

// C07d Structure Preview (SCRUM-102.2/102.5) - the parsed block as an
// editable three-level tree, a full page with a pinned commit bar.
export default function StructurePreviewPage() {
  return <StructureTree />;
}
