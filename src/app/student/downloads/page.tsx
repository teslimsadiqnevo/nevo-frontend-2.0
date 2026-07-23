import type { Metadata } from "next";
import { DownloadsTab } from "@/components/student/Downloads/DownloadsTab";

export const metadata: Metadata = {
  title: "Downloads — Nevo",
};

export default function StudentDownloadsPage() {
  return <DownloadsTab />;
}
