"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, authApi } from "@/lib/api";
import { useAuth } from "@/hooks";
import type { UserRole } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * C02 Teacher Sign-In - the returning teacher's door. Email + password or
 * school SSO, never PIN (that's the students'). Wrong credentials own the
 * failure in soft violet - never red. Two views now: the form and the
 * "You're in" success bridge - reset moved to its own screen (C02d).
 *
 * Password sign-in is LIVE against POST /api/v1/auth/login/password (the
 * deployed contract); the session token is stored by authApi and the success
 * beat routes into the console. SSO is a simulated hop to C02b until school
 * SSO slugs exist backend-side. The frame draws the error banner but leaves
 * its copy blank - the messages here are ours, flagged in the PR.
 */

const SUCCESS_HOLD_MS = 1400;
const SSO_HOP_MS = 1400;
const LIVE_TIMEOUT_MS = 20000;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MISMATCH_MSG =
  "That email and password didn't match. Try again, or reset your password.";
const UNREACHABLE_MSG =
  "We couldn't reach your school's sign-in right now. Nothing on your end - try again in a moment.";

type Phase = "idle" | "signing" | "sso" | "error" | "success";

const EYE_OPEN = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EYE_OFF = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M3 3l18 18" />
    <path d="M10.6 5.1A10.9 10.9 0 0 1 12 5c6.5 0 10 7 10 7a17.4 17.4 0 0 1-3 3.9" />
    <path d="M6.1 6.1A17 17 0 0 0 2 12s3.5 7 10 7a10 10 0 0 0 3.9-.8" />
    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
  </svg>
);

function Spinner({ onNavy = false, size = 18 }: { onNavy?: boolean; size?: number }) {
  return (
    <span
      role="status"
      aria-label="Working"
      style={{ width: size, height: size }}
      className={cn(
        "shrink-0 rounded-full border-[2.4px] motion-safe:animate-spin motion-safe:[animation-duration:900ms]",
        onNavy
          ? "border-nevo-cream/40 border-t-nevo-cream"
          : "border-nevo-navy/25 border-t-nevo-navy",
      )}
    />
  );
}

export function TeacherSignIn() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useAuth();
  // The route guard appends ?next= when it turns someone away; send them
  // back where they were headed. Only same-app paths, never an open redirect.
  const nextParam = searchParams.get("next");
  const destination =
    nextParam && nextParam.startsWith("/teacher/")
      ? nextParam
      : "/teacher/dashboard";
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [errMsg, setErrMsg] = useState("");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  const validEmail = EMAIL_RE.test(email.trim());
  const canSubmit = validEmail && pw.length >= 6;
  const emailInvalid = email.trim().length > 0 && !validEmail;
  const pwInvalid = pw.length > 0 && pw.length < 6;

  const clearError = useCallback(() => {
    setPhase((p) => (p === "error" ? "idle" : p));
  }, []);

  const submit = () => {
    if (!canSubmit || phase === "signing" || phase === "success") return;
    setPhase("signing");
    const live = authApi.loginPassword({ email: email.trim(), password: pw });
    const cap = new Promise<never>((_, reject) =>
      timers.current.push(
        setTimeout(() => reject(new Error("timeout")), LIVE_TIMEOUT_MS),
      ),
    );
    Promise.race([live, cap])
      .then((session) => {
        signIn({
          id: session.user_id,
          role: session.role as UserRole,
          schoolId: "",
          method: "manual",
        });
        setPhase("success");
        timers.current.push(
          setTimeout(() => router.push(destination), SUCCESS_HOLD_MS),
        );
      })
      .catch((err: unknown) => {
        setErrMsg(
          err instanceof ApiError && (err.status === 401 || err.status === 403)
            ? MISMATCH_MSG
            : UNREACHABLE_MSG,
        );
        setPhase("error");
      });
  };

  const sso = () => {
    if (phase === "sso" || phase === "signing" || phase === "success") return;
    setPhase("sso");
    timers.current.push(
      setTimeout(() => router.push("/auth/teacher/sso-callback"), SSO_HOP_MS),
    );
  };

  // The design moved reset onto its own screen - navigate, don't swap views.
  const forgot = () => router.push("/auth/teacher/reset");

  const isSuccess = phase === "success";
  const isForm = !isSuccess;

  return (
    <div className="relative flex min-h-full w-full flex-1 items-center justify-center px-6 py-[88px]">
      <span className="absolute top-[34px] left-[clamp(24px,4vw,48px)] block h-[18px] w-[62px] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/logo-wordmark-purple.png"
          alt="Nevo"
          className="absolute block h-[181px] w-[181px] max-w-none -translate-x-[66px] -translate-y-[87px]"
        />
      </span>

      <div className="w-full max-w-[432px]">
        {isForm && (
          <div className="flex flex-col items-start">
            <span className="text-[12.5px] font-semibold tracking-[0.14em] text-nevo-violet uppercase">
              Corona Secondary School · Lagos
            </span>
            <h2 className="mt-3.5 text-[34px] leading-[1.15] font-semibold tracking-[-0.02em]">
              Welcome back
            </h2>
            <p className="mt-3 text-[16px] leading-[1.55] text-nevo-near-black/70">
              Sign in to your teacher console.
            </p>

            <label
              htmlFor="teacher-email"
              className="mt-[30px] text-[13.5px] font-semibold text-nevo-near-black/70"
            >
              Email
            </label>
            <input
              id="teacher-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearError();
              }}
              placeholder="you@yourschool.edu.ng"
              className="mt-2 h-[52px] w-full rounded-[10px] border-[1.5px] border-nevo-near-black/16 bg-nevo-cream-elevated px-4 text-[16px] text-nevo-near-black transition-[border-color,background-color] duration-150 outline-none focus:border-nevo-navy focus:bg-nevo-cream"
            />
            {emailInvalid && (
              <p className="mt-[7px] text-[13px] text-[#7c7ea8]">
                Enter a valid email address to continue.
              </p>
            )}

            <div className="mt-[22px] flex w-full items-baseline justify-between">
              <label
                htmlFor="teacher-password"
                className="text-[13.5px] font-semibold text-nevo-near-black/70"
              >
                Password
              </label>
              <button
                type="button"
                onClick={forgot}
                className="cursor-pointer text-[13.5px] font-medium text-nevo-navy"
              >
                Forgot your password?
              </button>
            </div>
            <div
              className={cn(
                "mt-2 flex h-[52px] w-full items-center rounded-[10px] border-[1.5px] bg-nevo-cream-elevated pr-3.5 pl-4 transition-[border-color] duration-150",
                // The violet mismatch border owns the field until typing
                // clears it - even while focused (the frame's error state).
                phase === "error"
                  ? "border-nevo-violet focus-within:border-nevo-violet"
                  : "border-nevo-near-black/16 focus-within:border-nevo-navy",
              )}
            >
              <input
                id="teacher-password"
                type={showPw ? "text" : "password"}
                autoComplete="current-password"
                value={pw}
                onChange={(e) => {
                  setPw(e.target.value);
                  clearError();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submit();
                }}
                placeholder="Enter your password"
                className="h-full min-w-0 flex-1 border-none bg-transparent text-[16px] text-nevo-near-black outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                aria-label={showPw ? "Hide password" : "Show password"}
                className="flex shrink-0 cursor-pointer pl-2 text-nevo-near-black/50"
              >
                {showPw ? EYE_OFF : EYE_OPEN}
              </button>
            </div>
            {pwInvalid && (
              <p className="mt-[7px] text-[13px] text-[#7c7ea8]">
                Use at least 6 characters.
              </p>
            )}

            {phase === "error" && (
              <div
                role="status"
                className="mt-3.5 flex w-full items-start gap-2.5 rounded-[10px] bg-nevo-violet/18 px-[15px] py-[13px] motion-safe:animate-nevo-reveal"
              >
                <span className="mt-px shrink-0 text-nevo-navy">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 8h.01M11 12h1v4h1" />
                  </svg>
                </span>
                <span className="text-[14px] leading-[1.5] text-nevo-near-black">
                  {errMsg}
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={submit}
              disabled={!canSubmit}
              className={cn(
                "mt-[30px] flex h-[54px] w-full items-center justify-center rounded-[10px] text-[16px] font-semibold tracking-[-0.005em] transition-[filter] duration-150",
                canSubmit
                  ? "cursor-pointer bg-nevo-navy text-nevo-cream hover:brightness-93"
                  : "cursor-not-allowed bg-nevo-navy/32 text-nevo-cream/85",
              )}
            >
              {phase === "signing" ? (
                <span className="flex items-center gap-2.5">
                  <Spinner onNavy />
                  {"Signing you in…"}
                </span>
              ) : (
                "Sign in"
              )}
            </button>

            <div className="mt-6 flex w-full items-center gap-3.5 text-[12.5px] text-nevo-near-black/40">
              <span className="h-px flex-1 bg-nevo-near-black/14" />
              or
              <span className="h-px flex-1 bg-nevo-near-black/14" />
            </div>

            <button
              type="button"
              onClick={sso}
              className="mt-6 flex h-[54px] w-full cursor-pointer items-center justify-center gap-[11px] rounded-[10px] border-[1.5px] border-nevo-navy/28 bg-nevo-cream-elevated text-[15.5px] font-semibold text-nevo-navy transition-[filter] duration-150 hover:brightness-[0.97]"
            >
              {phase === "sso" ? (
                <span className="flex items-center gap-2.5">
                  <Spinner size={16} />
                  {"Taking you to Microsoft…"}
                </span>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <rect x="3" y="4" width="18" height="16" rx="2" />
                    <path d="M3 8h18M9 4v16" />
                  </svg>
                  Continue with school SSO
                </>
              )}
            </button>
          </div>
        )}

        {isSuccess && (
          <div className="flex flex-col items-center text-center motion-safe:animate-nevo-reveal">
            <span className="flex size-[72px] items-center justify-center rounded-full bg-nevo-navy motion-safe:animate-nevo-pop">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#f7f1e6" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
            </span>
            <h2 className="mt-[26px] text-[30px] font-semibold tracking-[-0.02em]">
              {"You're in"}
            </h2>
            <p className="mt-3 text-[16px] leading-[1.55] text-nevo-near-black/70">
              Taking you to your console.
            </p>
            <span className="mt-[26px] flex items-center gap-2.5 text-[13.5px] text-nevo-near-black/55">
              <Spinner size={16} />
              {"One moment…"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
