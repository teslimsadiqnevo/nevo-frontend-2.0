import type { Metadata } from "next";
import { AdminDemoPlayer } from "@/components/demo/AdminDemoPlayer";

/** The admin conference demo. Public and deterministic, like the other two. */
export const metadata: Metadata = {
  title: "Nevo for schools",
  robots: { index: false, follow: false },
};

export default async function AdminDemoPage({
  searchParams,
}: {
  searchParams: Promise<{ recording?: string }>;
}) {
  const { recording } = await searchParams;
  return <AdminDemoPlayer recording={recording === "true"} />;
}
