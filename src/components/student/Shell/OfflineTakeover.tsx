"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { WifiOff } from "lucide-react";
import { Button } from "@/components/shared";

/**
 * Offline, full screen (board 28) - the calm takeover for network-backed
 * surfaces when the connection drops. The lesson player never uses this: an
 * open lesson stays readable behind its quiet banner.
 *
 * IT CLAIMED DOWNLOADED LESSONS THAT DO NOT EXIST. "Your downloaded lessons
 * are still here" and a "See saved lessons" button pointing at Downloads -
 * which caches nothing, and which now tells a signed-in child plainly that
 * offline saving is not ready. The button led from a promise to its own
 * retraction.
 *
 * Progress is a different matter and is now true: `useLessonProgress` holds the
 * newest unsent position and re-sends it on reconnect.
 */
export function OfflineTakeover() {
  const router = useRouter();
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-8 py-12 text-center text-nevo-near-black motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-300">
      <span className="flex size-16 items-center justify-center rounded-[12px] bg-nevo-cream-elevated text-nevo-navy/60">
        <WifiOff className="size-7" strokeWidth={2} />
      </span>
      <h1 className="mt-6 text-[22px] font-semibold tracking-[-0.01em] sm:text-2xl">
        You&apos;re offline
      </h1>
      <p className="mt-2.5 max-w-[340px] text-[15px] leading-[1.55] text-nevo-near-black/66 sm:text-base">
        No internet connection right now. Anything you were part-way through is
        safe, and it will save as soon as you&apos;re back.
      </p>
      <Button
        className="mt-7 w-full max-w-[300px]"
        onClick={() => router.refresh()}
      >
        Try again
      </Button>
    </div>
  );
}

/** Live online/offline state (mirrors the player banner's listener). */
export function useOnline(): boolean {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    // Client-only navigator read, then event-driven - hydration-safe.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOnline(navigator.onLine);
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, []);
  return online;
}
