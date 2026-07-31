"use client";

import { useRouter } from "next/navigation";
import { Compass } from "lucide-react";
import { Button } from "@/components/shared";

/** 404 (board 28) - calm, never blaming, one way back. */
export default function NotFound() {
  const router = useRouter();
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-nevo-cream px-8 text-center text-nevo-near-black">
      <span className="flex size-16 items-center justify-center rounded-[12px] bg-nevo-cream-elevated text-nevo-navy/60">
        <Compass className="size-7" strokeWidth={2} />
      </span>
      <h1 className="mt-6 text-[22px] font-semibold tracking-[-0.01em] sm:text-2xl">
        This page doesn&apos;t exist
      </h1>
      <Button className="mt-7 w-full max-w-[300px]" onClick={() => router.back()}>
        Go back
      </Button>
    </div>
  );
}
