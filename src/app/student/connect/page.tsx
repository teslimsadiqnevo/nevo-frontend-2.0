import type { Metadata } from "next";
import { ConnectTab } from "@/components/student/Connect/ConnectTab";

export const metadata: Metadata = {
  title: "Connect — Nevo",
};

export default function StudentConnectPage() {
  return <ConnectTab />;
}
