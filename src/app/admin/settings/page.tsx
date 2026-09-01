import type { Metadata } from "next";
import { SettingsView } from "@/components/admin/Settings/SettingsView";

export const metadata: Metadata = {
  title: "Settings - Nevo",
};

// D12 / D12b / D12c Settings (SCRUM-99).
export default function AdminSettingsPage() {
  return <SettingsView />;
}
