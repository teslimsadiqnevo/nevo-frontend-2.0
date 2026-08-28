import type { Metadata } from "next";
import { SsoView } from "@/components/admin/Sso/SsoView";

export const metadata: Metadata = {
  title: "IT & SSO - Nevo",
};

// D10 IT & SSO Setup, with D10b's management sections stacked into it.
export default function AdminSsoPage() {
  return <SsoView />;
}
