"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { WifiOff } from "lucide-react";
import { Button } from "@/components/shared";

/**
 * Offline, full screen (board 28) - the calm takeover for network-backed
 * surfaces when the connection drops. The lesson player never uses this (the
 * cached lesson stays usable behind its quiet banner); the Downloads tab stays
 * reachable too, because that is exactly where "See saved lessons" points.
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
        No internet connection right now. Your progress is saved - and your
        downloaded lessons are still here.
      </p>
      <Button
        className="mt-7 w-full max-w-[300px]"
        onClick={() => router.push("/student/downloads")}
      >
        See saved lessons
      </Button>
      <Button
        variant="ghost"
        className="mt-2 h-[46px] w-full max-w-[300px] text-[15px]"
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
