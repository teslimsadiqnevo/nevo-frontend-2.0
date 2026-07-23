"use client";

import { useRouter } from "next/navigation";
import { Button, NevoLockup, SettlingCharacter } from "@/components/shared";
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
 * Welcome Screen (UI/UX spec B.1) — first arrival for the manual onboarding
 * entry. SSO students never reach here: they enter through /auth/sso-callback,
 * which routes them straight to the sequence. Solid cream, Level 0, no chrome.
 * Routes into onboarding or opens the teacher-join path. See design output
 * "01 Welcome".
 */
export function WelcomeScreen({ linkError = false }: { linkError?: boolean }) {
  const router = useRouter();

  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-nevo-cream px-6 text-nevo-near-black">
      {/* Combined lockup — the primary brand mark for this first-arrival moment */}
      <NevoLockup
        priority
        className="motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300"
      />

      {/* Settling character (Design System §12 illustration) */}
      <SettlingCharacter
        priority
        className="mt-7 w-[280px] motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:delay-150 motion-safe:duration-500 sm:w-[340px] lg:w-[320px]"
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
          <div className="mt-7 flex w-full flex-col gap-2 sm:mt-8 sm:max-w-[480px]">
            <Button
              onClick={() => router.push(NEXT_STEP)}
              className="w-full"
            >
              I have a school code
            </Button>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="md" className="w-full font-normal">
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
