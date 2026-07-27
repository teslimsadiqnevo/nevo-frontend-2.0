"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

/**
 * Offline banner (Lesson Player frame) — a calm, violet-tinted strip shown when
 * the device drops offline mid-lesson. In the house style the system owns the
 * situation and reassures ("Your progress is saved"); it never blames the
 * learner or blocks the lesson (the cached content stays readable).
 *
 * Driven by real connectivity (`navigator.onLine` + online/offline events), so
 * it works today without any backend.
 */
export function OfflineBanner() {
  // Assume online for the first paint (server render has no navigator); the
  // effect corrects it on mount so SSR and client markup agree.
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const sync = () => setOffline(!navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="status"
      className="flex shrink-0 items-center gap-2.5 bg-nevo-violet/16 px-4 py-2.5"
    >
      <span className="flex size-[22px] shrink-0 items-center justify-center rounded-full bg-nevo-violet/40">
        <WifiOff className="size-[13px] text-nevo-navy" strokeWidth={2} />
      </span>
      <span className="text-[13px] font-medium leading-[1.4] text-nevo-near-black">
        You&apos;re offline - showing your saved lesson. Your progress is saved.
      </span>
    </div>
  );
}
