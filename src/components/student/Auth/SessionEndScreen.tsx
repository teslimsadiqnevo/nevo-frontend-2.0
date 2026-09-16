"use client";

import { useRouter } from "next/navigation";
import { LogOut, Moon, MonitorSmartphone } from "lucide-react";
import { Button } from "@/components/shared";
import type { SessionEndReason } from "@/lib/auth/sessionEndReason";

/**
 * Session-end states (board 28), for a child.
 *
 * NO LONGER DEMO-ONLY. This carried a `TODO(api)` saying the auth layer would
 * route here later. It does now: #422 made the backend's reason survive the
 * redirect as `?reason=`, and the learner door reads it.
 *
 * WHY THE COPY IS HERE RATHER THAN FROM `sessionEndCopy`. That module is the
 * shared ruling on which of the five codes collapse into which screen, and
 * this file uses it for exactly that - `SessionEndReason` comes from there and
 * the mapping is not duplicated. What it does NOT take is the wording. The
 * `learner` audience there adapts the staff screens down a register; board 28
 * drew the child's screens directly, and they are gentler: a child is told
 * they have been away for a while, not that sessions expire after a period of
 * inactivity for their security.
 *
 * Two sets of learner copy now exist for the same states. Raised for design
 * rather than resolved here, because picking one silently is how the console
 * and the child's app drift apart in the first place.
 *
 * `paused` is not in this union. It is an account state rather than a session
 * one and the child has their own drawn frame for it, so the door renders
 * `AccountOnPauseScreen` instead - which is the same call #422 made for staff,
 * one level up.
 */

const COPY: Record<
  Exclude<SessionEndReason, "paused">,
  { icon: typeof Moon; heading: string; body: string }
> = {
  expired: {
    icon: Moon,
    heading: "You've been away for a while",
    body: "Log back in to continue",
  },
  replaced: {
    icon: MonitorSmartphone,
    heading: "You logged in on another device",
    body: "Your progress is saved",
  },
  // Verbatim from `student/28a Session Ended - Revoked`: the ordinary screen
  // with the inactivity line deleted, because this session did not time out.
  revoked: {
    icon: LogOut,
    heading: "Your session has ended.",
    body: "Sign in again to continue.",
  },
};

export function SessionEndScreen({
  variant,
}: {
  variant: Exclude<SessionEndReason, "paused">;
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
