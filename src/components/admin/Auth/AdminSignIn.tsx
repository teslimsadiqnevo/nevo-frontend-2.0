"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks";
import { ApiError, authApi } from "@/lib/api";
import type { UserRole } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * D02 Admin Sign-In - one door for every admin. Password sign-in is LIVE
 * against POST /api/v1/auth/login/password.
 *
 * Three things the frame draws that are deliberately absent, because each one
 * would be a control leading nowhere:
 *
 * - The school eyebrow ("Corona Secondary School · Lagos"). The frame resolves
 *   school identity BEFORE auth, from the school-specific URL that D10 issues.
 *   Nothing hands us a school pre-auth, so naming one would be inventing it.
 * - "Continue with Microsoft 365". The provider comes from the school's own
 *   config, and there is no admin SSO callback screen in the admin set - the
 *   teacher console has C02b, admin has no equivalent.
 * - "Forgot your password?". No reset endpoint exists anywhere in the spec and
 *   no admin reset screen is drawn.
 *
 * The success line loses the school name for the same reason: "Taking you to
 * your Overview" rather than the school's.
 *
 * TODO(api): school resolution pre-auth, an SSO start for admins, and a
 * password reset endpoint - then all three come back.
 * TODO(screen): D17 IT Admin Home and D18 Finance Home. The frame routes each
 * persona to their own landing; until those exist everyone lands on Overview.
 */

const SUCCESS_HOLD_MS = 1400;
const LIVE_TIMEOUT_MS = 20000;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** D02, verbatim. The system owns the failure - soft violet, never red. */
const MISMATCH_MSG =
  "We couldn't sign you in with those details. Check them and try again, or reset your password.";
/** Not drawn in D02; ours, and flagged. */
const UNREACHABLE_MSG =
  "We couldn't reach your school's sign-in right now. Nothing on your end - try again in a moment.";

type Phase = "idle" | "signing" | "error" | "success";

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
          ? "border-nevo-cream/30 border-t-nevo-cream"
          : "border-nevo-navy/25 border-t-nevo-navy",
      )}
    />
  );
}

export function AdminSignIn() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useAuth();
  // Same-app paths only, never an open redirect.
  const nextParam = searchParams.get("next");
  const destination =
    nextParam && nextParam.startsWith("/admin/")
      ? nextParam
      : "/admin/dashboard";

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
  const canSubmit = validEmail && pw.length > 0;

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

  if (phase === "success") {
    return (
      <div className="flex w-full max-w-[420px] flex-col items-center px-6 text-center">
        <span className="flex size-[76px] items-center justify-center rounded-full bg-nevo-navy motion-safe:animate-nevo-pop">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#f7f1e6" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </span>
        <h2 className="mt-[26px] text-[30px] font-semibold tracking-[-0.02em] text-nevo-near-black">
          You&rsquo;re in
        </h2>
        <p className="mt-3 text-[16px] leading-[1.55] text-nevo-near-black/70">
          {/* The school name is not ours to say - see the docblock. */}
          Taking you to your Overview.
        </p>
        <span className="mt-[26px] flex items-center gap-2.5 text-[13.5px] text-nevo-near-black/55">
          <Spinner />
          One moment&hellip;
        </span>
      </div>
    );
  }

  const busy = phase === "signing";
  const errored = phase === "error";

  return (
    <div className="flex w-full max-w-[440px] flex-col items-stretch px-6">
      <h2 className="text-center text-[34px] leading-[1.15] font-semibold tracking-[-0.02em] text-nevo-near-black">
        Welcome back
      </h2>
      <p className="mt-3 text-center text-[16px] leading-[1.55] text-nevo-near-black/70">
        Sign in to your school workspace.
      </p>

      <label
        htmlFor="admin-email"
        className={cn(
          "mt-7 text-[13.5px] font-semibold text-nevo-near-black/70",
          busy && "opacity-60",
        )}
      >
        Email
      </label>
      <input
        id="admin-email"
        type="email"
        autoComplete="username"
        value={email}
        disabled={busy}
        onChange={(e) => {
          setEmail(e.target.value);
          clearError();
        }}
        placeholder="you@yourschool.edu.ng"
        className={cn(
          "mt-2 h-[52px] w-full rounded-[10px] border-[1.5px] bg-nevo-cream-elevated px-4 text-[16px] text-nevo-near-black outline-none transition-colors placeholder:text-nevo-near-black/35 focus:border-nevo-navy disabled:opacity-60",
          "border-nevo-near-black/16",
        )}
      />

      <label
        htmlFor="admin-password"
        className={cn(
          "mt-[18px] text-[13.5px] font-semibold text-nevo-near-black/70",
          busy && "opacity-60",
        )}
      >
        Password
      </label>
      <div
        className={cn(
          "mt-2 flex h-[52px] w-full items-center rounded-[10px] border-[1.5px] bg-nevo-cream-elevated px-4 transition-colors focus-within:border-nevo-navy",
          errored ? "border-nevo-violet" : "border-nevo-near-black/16",
          busy && "opacity-60",
        )}
      >
        <input
          id="admin-password"
          type={showPw ? "text" : "password"}
          autoComplete="current-password"
          value={pw}
          disabled={busy}
          onChange={(e) => {
            setPw(e.target.value);
            clearError();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          placeholder="Enter your password"
          className="h-full min-w-0 flex-1 border-none bg-transparent text-[16px] text-nevo-near-black outline-none placeholder:text-nevo-near-black/35"
        />
        <button
          type="button"
          onClick={() => setShowPw((v) => !v)}
          aria-label={showPw ? "Hide password" : "Show password"}
          className="flex shrink-0 cursor-pointer pl-2 text-nevo-near-black/50"
        >
          {showPw ? EYE_OPEN : EYE_OFF}
        </button>
      </div>

      {errored && (
        <p className="mt-3 rounded-[10px] bg-nevo-violet/16 px-4 py-3 text-[13.5px] leading-[1.5] text-nevo-near-black/78">
          {errMsg}
        </p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={busy}
        className={cn(
          "mt-6 flex h-[52px] w-full items-center justify-center gap-2.5 rounded-[10px] bg-nevo-navy text-[15px] font-semibold text-nevo-cream transition-[filter]",
          canSubmit && !busy
            ? "cursor-pointer hover:brightness-93"
            : "cursor-default opacity-50",
        )}
      >
        {busy ? (
          <>
            <Spinner onNavy />
            Signing you in&hellip;
          </>
        ) : errored ? (
          "Try again"
        ) : (
          "Sign in"
        )}
      </button>
    </div>
  );
}
