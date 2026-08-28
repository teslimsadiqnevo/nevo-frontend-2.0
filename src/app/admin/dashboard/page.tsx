import type { Metadata } from "next";
import { OverviewView } from "@/components/admin/Overview/OverviewView";

export const metadata: Metadata = {
  title: "Overview - Nevo",
};

// D04 Overview Dashboard - the general-oversight admin's landing.
export default function AdminOverviewPage() {
  return <OverviewView />;
}
