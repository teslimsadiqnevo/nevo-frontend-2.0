"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Info } from "lucide-react";
import { Button } from "@/components/shared";
import { useAuth, useSignals } from "@/hooks";
import { BUSY_PHASE, BUSY_REASON, SIGNAL_EVENT_TYPES } from "@/lib/constants";
import { FIRST_LESSON_ID, resolveMockSso, SSO_RESOLVE_MS } from "@/lib/mocks";
import { randomId } from "@/lib/utils";

type Phase = "signing-in" | "success" | "error";

/** A quiet beat on "You're in" before the redirect (matches the frame). */
const SUCCESS_HOLD_MS = 900;

/**
 * SSO callback (screen 00b) — the Student App's dedicated SSO entry point. The
 * identity provider redirects here after auth; we resolve the handshake, then:
 *   • first-ever sign-in → establish the session and route into onboarding
 *     (the Observed Interaction Sequence reads `method: "sso"` from that session)
 *   • returning student → straight into the app
 *   • failure → a calm, never-red error that points to the school, not the learner
 *
 * This keeps SSO architecturally separate from the manual Welcome → Steps 1–3
 * entry; the two paths converge only at the sequence.
 */
export function SsoCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useAuth();
  const [phase, setPhase] = useState<Phase>("signing-in");
  // Short-lived signal session for the handshake window (SCRUM-94.8): waiting
  // on the identity provider is the system's time, marked so it is never read
  // as the student hesitating.
  const [signalSession] = useState(() => `auth-${randomId()}`);
  const { trackEvent } = useSignals(signalSession);

  useEffect(() => {
    if (phase !== "signing-in") return;
    trackEvent(SIGNAL_EVENT_TYPES.SYSTEM_BUSY, {
      reason: BUSY_REASON.AUTH_PENDING,
      phase: BUSY_PHASE.START,
    });
    return () =>
      trackEvent(SIGNAL_EVENT_TYPES.SYSTEM_BUSY, {
        reason: BUSY_REASON.AUTH_PENDING,
        phase: BUSY_PHASE.END,
      });
  }, [phase, trackEvent]);

  const resolveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Schedule the (mock) handshake. Only sets state asynchronously, from inside
  // the timers — never synchronously, so the mount effect stays side-effect-safe.
  const resolve = useCallback(() => {
    if (resolveTimer.current) clearTimeout(resolveTimer.current);
    resolveTimer.current = setTimeout(() => {
      // A REAL handshake, an EXPLICIT demo, or none.
      //
      // This used to resolve success by DEFAULT: landing here with no query at
      // all fabricated an SSO student and routed them into onboarding, with
      // `AuthContext.status === "authenticated"` while `useHasSession()` stayed
      // false. It looked signed in and was not - the same shape the teacher
      // callback was fixed for, though without its consequences, since the
      // route guard covers teacher and admin only and a token-less student
      // reaches nothing but fixtures.
      //
      // An identity provider returns `code` and `state`. With neither, and no
      // explicit `?mock=`, there is no handshake to complete and nothing to
      // sign in with, so the screen says so rather than inventing one.
      // TODO(api): replace with authApi.ssoCallback(query) once the contract
      // lands - the teacher side already calls it.
      const demo = searchParams.get("mock") ?? undefined;
      const hasHandshake =
        Boolean(searchParams.get("code")) && Boolean(searchParams.get("state"));
      if (!demo && !hasHandshake) {
        setPhase("error");
        return;
      }
      const result = resolveMockSso({ mock: demo });

      if (result.status === "error" || !result.user) {
        setPhase("error");
        return;
      }

      signIn(result.user);
      setPhase("success");
      redirectTimer.current = setTimeout(() => {
        router.replace(
          result.isFirstUse
            ? "/student/onboarding/sequence"
            : `/student/lessons/${FIRST_LESSON_ID}`,
        );
      }, SUCCESS_HOLD_MS);
    }, SSO_RESOLVE_MS);
  }, [searchParams, signIn, router]);

  useEffect(() => {
    resolve();
    return () => {
      if (resolveTimer.current) clearTimeout(resolveTimer.current);
      if (redirectTimer.current) clearTimeout(redirectTimer.current);
    };
  }, [resolve]);

  const retry = () => {
    setPhase("signing-in");
    resolve();
  };

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-nevo-cream px-9 text-center text-nevo-near-black">
      <Image
        src="/brand/nevo-wordmark.png"
        alt="Nevo"
        width={344}
        height={116}
        priority
        className="mb-9 h-5 w-auto"
      />

      {phase === "signing-in" && (
        <>
          <Spinner className="size-[26px]" />
          <p className="mt-6 text-base text-nevo-near-black sm:text-[17px]">
            Signing you in…
          </p>
        </>
      )}

      {phase === "success" && (
        <>
          <span className="flex size-16 items-center justify-center rounded-full bg-nevo-navy motion-safe:animate-nevo-pop">
            <Check className="size-[30px] text-nevo-cream" strokeWidth={2.4} />
          </span>
          <h1 className="mt-6 text-[21px] font-semibold tracking-[-0.01em] sm:text-[22px]">
            You&apos;re in
          </h1>
          <p className="mt-2.5 max-w-[290px] text-[15px] leading-[1.55] text-nevo-near-black/65 sm:max-w-[360px] sm:text-base">
            Taking you to Nevo…
          </p>
          <Spinner className="mt-7 size-[22px]" />
        </>
      )}

      {phase === "error" && (
        <>
          <span className="flex size-16 items-center justify-center rounded-full bg-nevo-violet/20">
            <Info className="size-[30px] text-nevo-navy" strokeWidth={2} />
          </span>
          <h1 className="mt-6 text-[21px] font-semibold tracking-[-0.01em] sm:text-[22px]">
            We couldn&apos;t sign you in
          </h1>
          <p className="mt-2.5 max-w-[290px] text-[15px] leading-[1.55] text-nevo-near-black/65 sm:max-w-[360px] sm:text-base">
            Something went wrong on our side. Let&apos;s try once more.
          </p>
          <Button className="mt-7 w-full max-w-[360px]" onClick={retry}>
            Try again
          </Button>
          <Button
            variant="ghost"
            className="mt-2 h-12 w-full max-w-[360px] text-[15px]"
            onClick={() => router.push("/auth/login")}
          >
            Contact your school
          </Button>
        </>
      )}
    </div>
  );
}

/** Navy ring spinner (DS "working" state) — honours reduced-motion via animate. */
function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Working"
      className={
        "block rounded-full border-[2.5px] border-nevo-navy/20 border-t-nevo-navy motion-safe:animate-spin motion-safe:[animation-duration:800ms] " +
        (className ?? "")
      }
    />
  );
}
