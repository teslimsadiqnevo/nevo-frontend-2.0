"use client";

import { useRouter } from "next/navigation";
import { Moon, MonitorSmartphone } from "lucide-react";
import { Button } from "@/components/shared";

/**
 * Session-end states (board 28). Two calm variants of one screen:
 * - `expired`: "You've been away for a while" - a rest, not a fault.
 * - `concurrent`: "You logged in on another device" - with the reassurance
 *   that progress is saved.
 * Both end in a single "Log back in". Triggered by the auth layer later
 * (TODO(api)); the routes make the states demoable now.
 */
export function SessionEndScreen({
  variant,
}: {
  variant: "expired" | "concurrent";
}) {
  const router = useRouter();
  const expired = variant === "expired";
  const Icon = expired ? Moon : MonitorSmartphone;

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-nevo-cream px-8 text-center text-nevo-near-black">
      <span className="flex size-16 items-center justify-center rounded-[12px] bg-nevo-cream-elevated text-nevo-navy/60">
        <Icon className="size-7" strokeWidth={2} />
      </span>
      <h1 className="mt-6 text-[22px] font-semibold tracking-[-0.01em] sm:text-2xl">
        {expired ? "You've been away for a while" : "You logged in on another device"}
      </h1>
      <p className="mt-2.5 text-[15px] leading-[1.55] text-nevo-near-black/66 sm:text-base">
        {expired ? "Log back in to continue" : "Your progress is saved"}
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
