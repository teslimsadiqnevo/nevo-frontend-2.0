import type { Metadata } from "next";
import { ComplianceView } from "@/components/admin/Compliance/ComplianceView";

export const metadata: Metadata = {
  title: "NDPA compliance audit - Nevo",
};

// D22 - the drill-down behind the Overview's compliance card.
export default function AdminCompliancePage() {
  return <ComplianceView />;
}
