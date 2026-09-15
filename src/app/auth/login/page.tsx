"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { NevoKeyboard } from "@/components/shared";
import { authApi } from "@/lib/api";
import {
  classifyLoginFailure,
  type LoginFailure,
} from "@/lib/auth/loginFailure";
import { safeNextPath } from "@/lib/auth/nextPath";
import { AccountOnPauseScreen } from "@/components/student/Auth/AccountOnPauseScreen";
import {
  getRememberedProfile,
  type RememberedProfile,
} from "@/lib/auth/session";
import { useAuth } from "@/hooks";
import { STUDENT_PIN_LENGTH, type UserRole } from "@/lib/constants";
import { cn } from "@/lib/utils";

// The length the screens commit to - see `STUDENT_PIN_LENGTH` for why this is
// one number and not the contract's 4-8 range.
const PIN_LENGTH = STUDENT_PIN_LENGTH;
/** The frame's done beat before navigating home. */
const DONE_MS = 700;

/**
 * Student Login (frame 00) - the returning-student PIN unlock. The device
 * remembers who signs in here (school code + identifier + name, seeded at
 * onboarding); the student only enters their PIN. One box per digit, the Nevo pad
 * keyboard on touch, a calm violet error line - never red - and a pop-check
 * "Welcome back" beat before the dashboard.
 *
 * Wired live: a full PIN submits to POST /auth/login/pin; a rejected PIN
 * clears the boxes with the frame's error copy. A failure that is NOT about
 * the child's PIN says so instead - see `error`. A device with no remembered
 * profile has nothing to unlock - it routes to onboarding.
 */
export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [profile, setProfile] = useState<RememberedProfile | null>(null);
  const [digits, setDigits] = useState("");
  /**
   * What went wrong, not merely THAT something did.
   *
   * "credentials" is the child's PIN being wrong. "ours" is everything else -
   * a malformed request, a school code that no longer resolves, a server that
   * did not answer. All of those used to render as "That PIN didn't match",
   * which blames a child for our fault and hides the real cause: a 6-digit
   * PIN truncated to 4 read exactly like a wrong PIN, and cost an evening.
   *
   * A 401 IS NO LONGER ONE THING. Backend now names which, in the 401's own
   * documented description: `authentication_failed` when the credential is
   * wrong, `account_paused` when it is RIGHT but the account is not open, and
   * `too_many_attempts` when rate limited. Collapsing all three into
   * "credentials" told a paused child and a rate-limited child that they had
   * mistyped - the same blame-the-child shape, for two more causes.
   *
   * "paused" takes over the whole screen rather than adding a line, because the
   * PIN row underneath it would be an invitation to keep trying something that
   * cannot work.
   *
   * An UNRECOGNISED code falls back to "credentials", which is the honest
   * default for a 401: the server rejected these credentials and did not say
   * why. The set is not closed - the session-validation codes are not in the
   * document at all - so this must never assume it has seen them all.
   */
  const [error, setError] = useState<LoginFailure | null>(null);
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
        /*
         * Nothing to unlock on this device - so ask who they are, rather than
         * assuming they are new.
         *
         * This used to `replace("/student/onboarding")`, which made a RETURNING
         * child create a second account: new identifier, no history, and a class
         * they might not be able to rejoin. It happened on a cleared browser, a
         * new tablet, a reimaged school laptop, and on any shared tablet where
         * another child onboarded after them - the device remembers exactly one.
         * Nothing told them or their teacher.
         *
         * Frame 00c is the door. It carries "I'm new to Nevo" for the children
         * who really are, which is why removing this redirect loses nothing.
         */
        // The proxy sets `?next=` when it bounces a signed-out child off a
        // student route. This screen has never read it; carrying it across
        // means the sign-in lands them where they were going. Read from
        // `location` rather than `useSearchParams` - this is already a
        // client-only effect, and the hook would demand a Suspense boundary
        // for a value we only need here.
        const wanted = safeNextPath(
          new URLSearchParams(window.location.search).get("next"),
        );
        router.replace(
          wanted
            ? `/auth/sign-in?next=${encodeURIComponent(wanted)}`
            : "/auth/sign-in",
        );
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
      setError(null);
      try {
        const session = await authApi.loginPin({
          schoolCode: remembered.schoolCode,
          loginIdentifier: remembered.loginIdentifier,
          pin,
        });
        signIn({
          id: session.userId,
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
      } catch (cause) {
        setDigits("");
        // 401/403 is the server's answer about these credentials. A 422 means
        // we sent a shape it rejects - the PIN length is the live example -
        // and anything else is the network or the server. Only the first is
        // about the child.
        setError(classifyLoginFailure(cause));
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
      setError(null);
      setDigits((prev) => {
        const next = (prev + add).slice(0, PIN_LENGTH);
        if (next.length === PIN_LENGTH) void submit(next, profile);
        return next;
      });
    },
    [done, checking, profile, submit],
  );

  const backspace = useCallback(() => {
    setError(null);
    setDigits((prev) => prev.slice(0, -1));
  }, []);

  if (!profile) return null;

  /*
   * A paused account takes the whole screen, per the frame: it is shown "in
   * place of the normal login flow", not as a line under a PIN row the child
   * could keep tapping at. Rendered here rather than routed to, deliberately -
   * a `/auth/paused` URL would be a screen anyone could visit and be told their
   * account is on pause when it is not.
   */
  if (error === "paused") return <AccountOnPauseScreen />;

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
              <Check
                className="size-[34px] text-nevo-cream"
                strokeWidth={2.6}
              />
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
              {error === "credentials" &&
                "That PIN didn't match. Try again, or ask your teacher."}
              {error === "ours" &&
                "We couldn't check that just now - that's on us, not you. Try again in a moment."}
              {/* No frame covers this one; the copy is ours and deliberately
                  plain. What it must not do is what it used to: tell a child
                  who typed the right PIN too quickly that it was wrong. */}
              {error === "throttled" &&
                "That's a lot of tries in a row. Wait a moment, then try again."}
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
            {/*
              Frame 00c, state 4. The device remembers SOMEBODY, but it may not
              be the child holding it - a shared classroom tablet remembers only
              the last child to onboard on it. Without this, the only way past
              another child's avatar was to re-onboard, which created a second
              account and orphaned the history behind it.
            */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                router.push("/auth/sign-in");
              }}
              className="h-11 cursor-pointer px-4 text-[15px] font-medium text-nevo-near-black/70"
            >
              Using a different device?
            </button>
          </>
        )}
      </div>

      {kbOpen && !done && (
        <NevoKeyboard
          layout="pad"
          onKey={addDigits}
          onBackspace={backspace}
          className="shrink-0"
        />
      )}
    </main>
  );
}
