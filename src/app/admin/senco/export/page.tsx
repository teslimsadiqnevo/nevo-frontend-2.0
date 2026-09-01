import type { Metadata } from "next";
import { IepExporterView } from "@/components/admin/Senco/IepExporterView";

export const metadata: Metadata = {
  title: "Progress report - Nevo",
};

// D8 IEP Exporter. Review is never skippable: a named member of staff reads
// and checks the draft before anything reaches a family.
export default function AdminIepExportPage() {
  return <IepExporterView />;
}
