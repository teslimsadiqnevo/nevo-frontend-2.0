"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

/** First onboarding step (Name & Age entry) — the primary action's destination. */
const NEXT_STEP = "/student/onboarding/name";

/**
 * Welcome Screen (UI/UX spec B.1) — first arrival for manual-path students
 * (SSO students skip this). Solid cream, Level 0, no chrome. Routes into
 * onboarding or opens the teacher-join path. See design output "01 Welcome".
 */
export function WelcomeScreen({ linkError = false }: { linkError?: boolean }) {
  const router = useRouter();

  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-nevo-cream px-6 pb-[14vh] text-nevo-near-black">
      {/* Wordmark (brand mark; the only Agile-typeface element, shipped as an asset) */}
      <Image
        src="/brand/nevo-wordmark.png"
        alt="Nevo"
        width={344}
        height={116}
        priority
        className="h-9 w-auto motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300 sm:h-10 lg:h-11"
      />

      {/* Settling character (Design System §12 illustration) */}
      <Image
        src="/illustrations/welcome-settling.png"
        alt="A calm figure settling in, sitting cross-legged"
        width={697}
        height={598}
        priority
        className="mt-7 w-[280px] max-w-full motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:delay-150 motion-safe:duration-500 sm:mt-9 sm:w-[320px]"
      />

      <div className="mt-8 flex w-full flex-col items-center motion-safe:animate-in motion-safe:fade-in motion-safe:delay-300 motion-safe:duration-500 sm:mt-9">
        {/* The single line of explanatory copy — warm, present-tense, no punctuation */}
        <p className="text-center text-base font-normal sm:text-[17px] lg:text-lg">
          Let&apos;s get you learning
        </p>

        {linkError ? (
          <p className="mt-10 w-full max-w-[480px] text-center text-sm text-nevo-near-black/70 sm:mt-11">
            This link isn&apos;t working right now, ask your teacher for a new one.
          </p>
        ) : (
          <div className="mt-10 flex w-full flex-col gap-4 sm:mt-11 sm:max-w-[480px]">
            <Button
              onClick={() => router.push(NEXT_STEP)}
              className="h-13 w-full rounded-[10px] bg-nevo-navy text-[15px] font-medium tracking-[0.005em] text-nevo-cream hover:bg-nevo-navy hover:brightness-[0.93] active:brightness-[0.86]"
            >
              I have a school code
            </Button>

            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-11 w-full rounded-[10px] text-sm font-normal text-nevo-navy hover:bg-nevo-navy/[0.06] hover:text-nevo-navy active:bg-nevo-navy/[0.12] sm:text-[15px]"
                >
                  I&apos;m joining through my teacher
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="bg-nevo-cream">
                <SheetHeader>
                  <SheetTitle className="text-nevo-navy">
                    Joining through your teacher
                  </SheetTitle>
                  <SheetDescription className="text-nevo-near-black/70">
                    Ask your teacher for your class QR code or join link. Scan it
                    or open it on this device to get started — no school code
                    needed.
                  </SheetDescription>
                </SheetHeader>
                {/* TODO: QR code scanner / quick class join (C.12). */}
              </SheetContent>
            </Sheet>
          </div>
        )}
      </div>
    </main>
  );
}
