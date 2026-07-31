"use client";

import { useRouter } from "next/navigation";
import { CloudOff } from "lucide-react";
import { Button } from "@/components/shared";

/**
 * Generic error boundary (board 28) - calm, never red, never technical.
 * Route-level boundaries (e.g. the lesson player's) stay closer to their
 * context; this is the app-wide fallback.
 */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-nevo-cream px-8 text-center text-nevo-near-black">
      <span className="flex size-16 items-center justify-center rounded-[12px] bg-nevo-cream-elevated text-nevo-navy/60">
        <CloudOff className="size-7" strokeWidth={2} />
      </span>
      <h1 className="mt-6 text-[22px] font-semibold tracking-[-0.01em] sm:text-2xl">
        Something went wrong
      </h1>
      <p className="mt-2.5 max-w-[320px] text-[15px] leading-[1.55] text-nevo-near-black/66 sm:text-base">
        We&apos;re on it. Try again or go back.
      </p>
      <Button className="mt-7 w-full max-w-[300px]" onClick={reset}>
        Try again
      </Button>
      <Button
        variant="ghost"
        className="mt-2 h-[46px] w-full max-w-[300px] text-[15px]"
        onClick={() => router.back()}
      >
        Go back
      </Button>
    </div>
  );
}
