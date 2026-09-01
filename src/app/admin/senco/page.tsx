import type { Metadata } from "next";
import { SencoView } from "@/components/admin/Senco/SencoView";

export const metadata: Metadata = {
  title: "Learning Support - Nevo",
};

// D8 Learning Support and D8b Learner Profiles - the SENCo surface.
export default function AdminSencoPage() {
  return <SencoView />;
}
