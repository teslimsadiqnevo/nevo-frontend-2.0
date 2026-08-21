import type { Metadata } from "next";
import { BulkIngestion } from "@/components/teacher/Upload/BulkIngestion";

export const metadata: Metadata = {
  title: "Add a term's material - Nevo",
};

// C07h Bulk Curriculum Ingestion - a standalone takeover screen (the frame
// composes it without the sidebar), rendered as a fixed layer over the shell.
export default function BulkIngestionPage() {
  return <BulkIngestion />;
}
