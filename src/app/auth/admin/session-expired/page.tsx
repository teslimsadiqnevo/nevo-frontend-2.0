import type { Metadata } from "next";
import { ConsoleSessionExpired } from "@/components/shared/ConsoleSessionExpired";

export const metadata: Metadata = {
  title: "Session expired - Nevo",
};

/** Same screen, admin door. The frame is explicitly shared between consoles. */
export default function AdminSessionExpiredPage() {
  return <ConsoleSessionExpired signInHref="/auth/admin" />;
}
