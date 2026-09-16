import type { Metadata } from "next";
import { AccountOnPauseScreen } from "@/components/student/Auth/AccountOnPauseScreen";

export const metadata: Metadata = {
  title: "Account on pause - Nevo",
};

// Reached when a 401 carries `account_paused` MID-SESSION, which is the case
// the sign-in screens could not cover: they only ever see it when a child types
// a correct PIN into a closed account. A child whose school closes their account
// while they are in a lesson was being told their session had expired, which is
// a different thing and leaves them trying again.
//
// The screen takes no props and already carries the frame's copy, so this route
// is the whole change on this side.
export default function AccountPausedPage() {
  return <AccountOnPauseScreen />;
}
