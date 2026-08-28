import type { Metadata } from "next";
import { AdaptationLogView } from "@/components/admin/Adaptations/AdaptationLogView";

export const metadata: Metadata = {
  title: "Adaptation log - Nevo",
};

// D21 - the receipts behind the Overview's adaptation figure.
export default function AdminAdaptationsPage() {
  return <AdaptationLogView />;
}
