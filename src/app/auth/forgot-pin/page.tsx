import type { Metadata } from "next";
import { ForgotPinScreen } from "@/components/student/Auth/ForgotPinScreen";

export const metadata: Metadata = {
  title: "Forgot PIN - Nevo",
};

export default function ForgotPinPage() {
  return <ForgotPinScreen />;
}
