"use client";

import { useRouter } from "next/navigation";
import { LogOut, Moon, MonitorSmartphone } from "lucide-react";
import { Button } from "@/components/shared";

/**
 * Session-end states (board 28). Three calm variants of one screen:
 * - `expired`: "You've been away for a while" - a rest, not a fault.
 * - `concurrent`: "You logged in on another device" - with the reassurance
 *   that progress is saved.
 * - `revoked`: somebody signed this device out (frame 28a, added 10 Sep).
 *
 * NO LONGER DEMO-ONLY. This carried a `TODO(api)` saying the auth layer would
 * trigger these later; it does now. Backend documents five 401 codes on all
 * 176 authenticated operations, and `sessionExpiredDoor` reads them, so which
 * variant a child lands on is the server's answer rather than which URL was
 * typed.
 *
 * WHAT EACH ONE MAY SAY. 28a's whole point is that the revoked screen says
 * nothing about the child: not that they were away, not that they did
 * anything. "Your session has ended" is a fact about the session. The expired
 * variant is the only one that may mention time, because time is the only one
 * of the three that is about them - and even then it is framed as a rest.
 *
 * All three end in a single "Log back in".
 */

const COPY = {
  expired: {
    icon: Moon,
    heading: "You've been away for a while",
    body: "Log back in to continue",
  },
  concurrent: {
    icon: MonitorSmartphone,
    heading: "You logged in on another device",
    body: "Your progress is saved",
  },
  // Verbatim from `student/28a Session Ended - Revoked`.
  revoked: {
    icon: LogOut,
    heading: "Your session has ended.",
    body: "Sign in again to continue.",
  },
} as const;

export function SessionEndScreen({
  variant,
}: {
  variant: "expired" | "concurrent" | "revoked";
}) {
  const router = useRouter();
  const { icon: Icon, heading, body } = COPY[variant];

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-nevo-cream px-8 text-center text-nevo-near-black">
      <span className="flex size-16 items-center justify-center rounded-[12px] bg-nevo-cream-elevated text-nevo-navy/60">
        <Icon className="size-7" strokeWidth={2} />
      </span>
      <h1 className="mt-6 text-[22px] font-semibold tracking-[-0.01em] sm:text-2xl">
        {heading}
      </h1>
      <p className="mt-2.5 text-[15px] leading-[1.55] text-nevo-near-black/66 sm:text-base">
        {body}
      </p>
      <Button
        className="mt-7 w-full max-w-[300px]"
        onClick={() => router.push("/auth/login")}
      >
        Log back in
      </Button>
    </div>
  );
}
