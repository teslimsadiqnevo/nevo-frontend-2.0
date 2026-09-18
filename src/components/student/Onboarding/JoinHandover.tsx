"use client";

/**
 * A join link arriving on a tablet somebody is already signed into.
 *
 * THE CASE THIS CLOSES. A child taps their invitation on a shared classroom
 * tablet. Onboarding then collects a name, a school and a class and runs the
 * motor baseline - none of which knows a session is already live. The
 * measurements come from whoever is holding the tablet and are written against
 * whoever was still signed in.
 *
 * The route guard deliberately lets `?token=` through, because bouncing it
 * would discard the invitation in silence and drop the arriving child into the
 * signed-in child's dashboard - a worse version of the same bug. That was the
 * right call while there was nowhere to hand the tablet over TO.
 *
 * 28c IS WHY THIS CAN EXIST NOW. Signing the current child out used to be a
 * real cost: the device remembered exactly one child, so it meant losing them.
 * The tablet now remembers up to six, so signing out costs a PIN and nothing
 * else, and saying so is the honest thing to put on the screen.
 *
 * A FIRST NAME IS SHOWN, and no more. The same rule the picker follows: first
 * names are allowed on a shared pre-authentication screen, usernames and school
 * codes are not.
 */

import { useRouter } from "next/navigation";
import { NevoLockup } from "@/components/shared";

export function JoinHandover({
  signedInName,
  onCarryOn,
}: {
  /** The signed-in child's first name, when the device knows one. */
  signedInName?: string | null;
  onCarryOn: () => void;
}) {
  const router = useRouter();
  const name = signedInName?.trim();

  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-nevo-cream px-6 text-nevo-near-black [@media(max-height:460px)]:justify-start [@media(max-height:460px)]:py-2">
      <NevoLockup className="motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300" />

      <h1 className="mt-9 max-w-[420px] text-center text-[23px] leading-[1.25] font-medium tracking-[-0.01em] sm:text-[26px]">
        Someone new is joining
      </h1>

      <p className="mt-3.5 max-w-[420px] text-center text-[15px] leading-[1.55] text-nevo-near-black/70 sm:text-base">
        {name ? (
          <>
            {name} is signed in on this tablet. Carrying on signs {name} out.
            The tablet remembers {name}, so getting back in just takes a PIN.
          </>
        ) : (
          // No name, and none is invented. A PIN login returns a session rather
          // than a profile, so the device genuinely may not know who is here.
          <>
            Someone is already signed in on this tablet. Carrying on signs them
            out. The tablet remembers them, so getting back in just takes a PIN.
          </>
        )}
      </p>

      <button
        type="button"
        onClick={onCarryOn}
        className="mt-8 flex h-[52px] w-full max-w-[340px] cursor-pointer items-center justify-center rounded-[10px] bg-nevo-navy text-base font-medium text-nevo-cream transition-[filter] hover:brightness-110 active:scale-[0.99]"
      >
        Carry on
      </button>

      {/*
        The way back for the child who is already here - who may simply have
        been handed their own tablet and tapped the wrong thing. Their session
        is untouched until "Carry on", so this costs them nothing.
      */}
      <button
        type="button"
        onClick={() => router.replace("/student/dashboard")}
        className="mt-2 h-11 cursor-pointer px-4 text-[15px] font-medium text-nevo-near-black/70"
      >
        {name ? `Keep ${name} signed in` : "Keep me signed in"}
      </button>
    </main>
  );
}
