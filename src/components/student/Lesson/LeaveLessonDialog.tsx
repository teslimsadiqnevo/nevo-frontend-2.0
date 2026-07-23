"use client";

import { Dialog as DialogPrimitive } from "radix-ui";
import { Bookmark } from "lucide-react";
import { Button } from "@/components/shared";

/**
 * Leave Lesson dialog (Lesson Check frame) — the gentle interruption when a
 * student exits mid-lesson. It never scolds or warns about "losing" work; it
 * leads with the reassurance motif ("Your progress is saved") and offers an easy
 * way back in. Built on Radix Dialog (focus trap + Esc + scrim) as a centered
 * modal over a near-black/30 scrim (never pure black).
 */
export function LeaveLessonDialog({
  open,
  onOpenChange,
  onLeave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Confirm leaving — exit the player. */
  onLeave: () => void;
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-nevo-near-black/30 duration-200 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed top-1/2 left-1/2 z-50 w-[320px] max-w-[calc(100%-48px)] -translate-x-1/2 -translate-y-1/2 rounded-[16px] bg-nevo-cream p-8 text-center text-nevo-near-black shadow-[0_4px_16px_rgba(0,0,0,0.10)] duration-200 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 sm:w-[380px] lg:w-[400px]"
        >
          <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-nevo-violet/20">
            <Bookmark className="size-[30px] text-nevo-navy" strokeWidth={2} />
          </span>

          <DialogPrimitive.Title className="mt-[18px] text-lg font-semibold text-nevo-near-black">
            Your progress is saved
          </DialogPrimitive.Title>
          <p className="mt-2 text-sm text-nevo-near-black/60">
            You can pick up where you left off
          </p>

          <Button
            className="mt-6 w-full"
            onClick={() => onOpenChange(false)}
          >
            Keep learning
          </Button>
          <Button
            variant="ghost"
            className="mt-2 h-12 w-full text-[15px]"
            onClick={onLeave}
          >
            Leave for now
          </Button>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
