"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { NevoKeyboard } from "@/components/shared";
import { authApi } from "@/lib/api";
import { getRememberedProfile, type RememberedProfile } from "@/lib/auth/session";
import { useAuth } from "@/hooks";
import type { UserRole } from "@/lib/constants";
import { cn } from "@/lib/utils";

const PIN_LENGTH = 4;
/** The frame's done beat before navigating home. */
const DONE_MS = 700;

/**
 * Student Login (frame 00) - the returning-student PIN unlock. The device
 * remembers who signs in here (school code + identifier + name, seeded at
 * onboarding); the student only enters their PIN. Four boxes, the Nevo pad
 * keyboard on touch, a calm violet error line - never red - and a pop-check
 * "Welcome back" beat before the dashboard.
 *
 * Wired live: a full PIN submits to POST /auth/login/pin; a rejected PIN
 * clears the boxes with the frame's error copy. A device with no remembered
 * profile has nothing to unlock - it routes to onboarding.
 */
export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [profile, setProfile] = useState<RememberedProfile | null>(null);
  const [digits, setDigits] = useState("");
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(false);
  const [done, setDone] = useState(false);
  const [kbOpen, setKbOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const doneTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Sync from the device's remembered profile (localStorage, client-only).
    const hydrate = () => {
      const remembered = getRememberedProfile();
      if (!remembered) {
        // Nothing to unlock on this device - enter through onboarding.
        router.replace("/student/onboarding");
        return;
      }
      setProfile(remembered);
    };
    hydrate();
  }, [router]);

  useEffect(
    () => () => {
      if (blurTimer.current) clearTimeout(blurTimer.current);
      if (doneTimer.current) clearTimeout(doneTimer.current);
    },
    [],
  );

  const submit = useCallback(
    async (pin: string, remembered: RememberedProfile) => {
      setChecking(true);
      try {
        const session = await authApi.loginPin({
          school_code: remembered.schoolCode,
          login_identifier: remembered.loginIdentifier,
          pin,
        });
        signIn({
          id: session.user_id,
          role: session.role as UserRole,
          schoolId: remembered.schoolCode,
          name: remembered.displayName,
          method: "manual",
        });
        setDone(true);
        doneTimer.current = setTimeout(
          () => router.push("/student/dashboard"),
          DONE_MS,
        );
      } catch {
        // A wrong PIN and an unreachable backend read the same calm way; the
        // copy is the frame's. Detail stays in the dev console via the client.
        setDigits("");
        setError(true);
      } finally {
        setChecking(false);
      }
    },
    [router, signIn],
  );

  const addDigits = useCallback(
    (raw: string) => {
      if (done || checking || !profile) return;
      const add = raw.replace(/[^0-9]/g, "");
      if (!add) return;
      setError(false);
      setDigits((prev) => {
        const next = (prev + add).slice(0, PIN_LENGTH);
        if (next.length === PIN_LENGTH) void submit(next, profile);
        return next;
      });
    },
    [done, checking, profile, submit],
  );

  const backspace = useCallback(() => {
    setError(false);
    setDigits((prev) => prev.slice(0, -1));
  }, []);

  if (!profile) return null;

  const focusInput = () => inputRef.current?.focus();

  return (
    <main
      onClick={focusInput}
      className="flex min-h-[100dvh] cursor-text flex-col bg-nevo-cream"
    >
      {/* Hidden input - hardware keyboards type here; the pad drives touch. */}
      <input
        ref={inputRef}
        value=""
        onChange={(e) => {
          addDigits(e.target.value);
          e.target.value = "";
        }}
        onKeyDown={(e) => {
          if (e.key === "Backspace") {
            e.preventDefault();
            backspace();
          }
        }}
        onFocus={() => {
          if (blurTimer.current) clearTimeout(blurTimer.current);
          setKbOpen(true);
        }}
        onBlur={() => {
          if (blurTimer.current) clearTimeout(blurTimer.current);
          blurTimer.current = setTimeout(() => setKbOpen(false), 120);
        }}
        inputMode="none"
        aria-label="PIN"
        className="pointer-events-none absolute -left-[9999px] opacity-0"
      />

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-10 text-center">
        {/* Combined purple wordmark, cropped from the padded 1080-square file
            (frame: box 336x108 at the file's x392 y523). */}
        <span className="relative block h-[18px] w-[56px] overflow-hidden sm:h-5 sm:w-[62px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/logo-wordmark-purple.png"
            alt="Nevo"
            className="absolute block h-[180px] w-[180px] max-w-none -translate-x-[65px] -translate-y-[87px] sm:h-[200px] sm:w-[200px] sm:-translate-x-[73px] sm:-translate-y-[97px]"
          />
        </span>

        {!done && (
          <span className="mt-9 flex size-14 items-center justify-center rounded-full bg-nevo-navy text-xl font-semibold text-nevo-cream sm:size-16 sm:text-[22px]">
            {profile.initials}
          </span>
        )}

        {done ? (
          <>
            <span className="mt-6 flex size-16 items-center justify-center rounded-full bg-nevo-navy motion-safe:animate-nevo-pop">
              <Check className="size-[34px] text-nevo-cream" strokeWidth={2.6} />
            </span>
            <h2 className="mt-5 text-[23px] leading-[1.3] font-medium tracking-[-0.01em] text-nevo-near-black sm:text-[26px]">
              Welcome back, {profile.displayName}
            </h2>
            <p className="mt-2.5 text-[15px] text-nevo-near-black/60">
              Taking you to your lessons…
            </p>
          </>
        ) : (
          <>
            <h2 className="mt-5 text-[23px] leading-[1.3] font-medium tracking-[-0.01em] text-nevo-near-black sm:text-[26px]">
              Welcome back, {profile.displayName}
            </h2>
            <p className="mt-2.5 text-[15px] text-nevo-near-black/60">
              Enter your PIN to keep going
            </p>
            <div className="mt-8 flex gap-3.5">
              {Array.from({ length: PIN_LENGTH }, (_, i) => {
                const active = i === digits.length && !checking;
                return (
                  <div
                    key={i}
                    className={cn(
                      "flex size-12 items-center justify-center rounded-[10px] border-[1.5px] bg-nevo-cream shadow-[0_2px_8px_rgba(0,0,0,0.05)]",
                      active
                        ? "border-nevo-navy"
                        : error
                          ? "border-nevo-violet"
                          : "border-nevo-near-black/20",
                    )}
                  >
                    {digits.length > i && (
                      <span className="block size-3 rounded-full bg-nevo-near-black" />
                    )}
                  </div>
                );
              })}
            </div>
            <p
              role="status"
              className="mt-[18px] min-h-5 max-w-[280px] text-sm leading-[1.4] text-nevo-violet"
            >
              {error && "That PIN didn't match. Try again, or ask your teacher."}
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                router.push("/auth/forgot-pin");
              }}
              className="mt-2 h-11 cursor-pointer px-4 text-[15px] font-medium text-nevo-navy"
            >
              Forgot PIN?
            </button>
          </>
        )}
      </div>

      {kbOpen && !done && (
        <NevoKeyboard
          layout="pad"
          onKey={addDigits}
          onBackspace={backspace}
          className="shrink-0 lg:hidden"
        />
      )}
    </main>
  );
}
