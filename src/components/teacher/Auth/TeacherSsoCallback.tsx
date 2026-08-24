"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { MOCK_TEACHER } from "@/components/teacher/Shell/teacherNav";
import { useAuth } from "@/hooks";
import { TEACHER_INVITE } from "@/lib/mocks/teacherOnboarding";
import { USER_ROLES } from "@/lib/constants";

/**
 * C02b - where "Continue with school SSO" lands after the identity provider.
 * A brief auto-routing screen, a quiet success bridge, and a calm error that
 * owns the failure and points to school IT - never the teacher.
 *
 * The handshake is simulated (?mock=error forces the error state) - the
 * deployed callback (GET /api/v1/auth/sso/{provider}/callback) is a browser
 * redirect flow that needs school SSO slugs seeded backend-side first.
 */

const RESOLVE_MS = 1100;
const SUCCESS_HOLD_MS = 900;

type Phase = "signing-in" | "success" | "error";

function Ring({ size }: { size: number }) {
  return (
    <span
      role="status"
      aria-label="Working"
      style={{ width: size, height: size }}
      className="rounded-full border-[2.5px] border-nevo-navy/20 border-t-nevo-navy motion-safe:animate-spin motion-safe:[animation-duration:800ms]"
    />
  );
}

function LogoMark() {
  return (
    <span className="relative block size-[31px] overflow-hidden xl:size-[34px]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/logo-icon-purple.png"
        alt="Nevo"
        className="absolute block h-[195px] w-[195px] max-w-none -translate-x-[82px] -translate-y-[86px] xl:h-[214px] xl:w-[214px] xl:-translate-x-[90px] xl:-translate-y-[94px]"
      />
    </span>
  );
}

export function TeacherSsoCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useAuth();
  const [phase, setPhase] = useState<Phase>("signing-in");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Schedules the (mock) handshake; only ever sets state from inside the
  // timer callback, so the effect body stays setState-free.
  const schedule = useCallback(() => {
    const fails = searchParams.get("mock") === "error";
    timers.current.push(
      setTimeout(() => {
        if (fails) {
          setPhase("error");
          return;
        }
        signIn({
          id: "teacher-sso-demo",
          role: USER_ROLES.TEACHER,
          schoolId: "school-demo",
          name: MOCK_TEACHER.name,
          method: "sso",
        });
        setPhase("success");
        timers.current.push(
          setTimeout(
            () => router.replace("/teacher/dashboard"),
            SUCCESS_HOLD_MS,
          ),
        );
      }, RESOLVE_MS),
    );
  }, [router, searchParams, signIn]);

  useEffect(() => {
    const pending = timers.current;
    schedule();
    return () => pending.forEach(clearTimeout);
  }, [schedule]);

  const retry = () => {
    setPhase("signing-in");
    schedule();
  };

  return (
    <div className="flex w-full max-w-[440px] flex-col items-center px-10 text-center">
      {phase === "signing-in" && (
        <>
          <span className="mb-7">
            <LogoMark />
          </span>
          <Ring size={28} />
          <p className="mt-6 text-[16px] text-nevo-near-black xl:text-[17px]">
            {`Signing you in through ${TEACHER_INVITE.school}…`}
          </p>
        </>
      )}

      {phase === "success" && (
        <>
          <span className="mb-9 xl:mb-[38px]">
            <LogoMark />
          </span>
          <span className="flex size-[68px] items-center justify-center rounded-full bg-nevo-navy motion-safe:animate-nevo-pop xl:size-[72px]">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f7f1e6" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="xl:size-[34px]">
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          </span>
          <h2 className="mt-6 text-[24px] font-semibold tracking-[-0.015em] text-nevo-near-black xl:mt-[26px] xl:text-[26px]">
            {`You're in, ${MOCK_TEACHER.name}`}
          </h2>
          <p className="mt-[11px] max-w-[380px] text-[16px] leading-[1.55] text-nevo-near-black/65 xl:mt-3 xl:max-w-[420px] xl:text-[16.5px]">
            {"Taking you to your dashboard…"}
          </p>
          <span className="mt-7 xl:mt-[30px]">
            <Ring size={22} />
          </span>
        </>
      )}

      {phase === "error" && (
        <>
          <LogoMark />
          <span className="mt-7 flex size-[68px] items-center justify-center rounded-full bg-nevo-violet/20 xl:mt-[30px] xl:size-[72px]">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3b3f6e" strokeWidth="2" strokeLinecap="round" aria-hidden className="xl:size-[34px]">
              <circle cx="12" cy="8" r="0.9" fill="#3b3f6e" />
              <path d="M12 11.5v6" />
              <circle cx="12" cy="12" r="9" />
            </svg>
          </span>
          <h2 className="mt-6 text-[24px] font-semibold tracking-[-0.015em] text-nevo-near-black xl:mt-[26px] xl:text-[26px]">
            {"We couldn't sign you in"}
          </h2>
          <p className="mt-[11px] max-w-[400px] text-[16px] leading-[1.55] text-nevo-near-black/65 xl:mt-3 xl:max-w-[440px] xl:text-[16.5px]">
            {"Something went wrong between Nevo and your school's sign-in. Nothing on your end - let's try once more, or your school's IT admin can check the connection."}
          </p>
          <button
            type="button"
            onClick={retry}
            className="mt-[30px] h-[52px] w-[340px] max-w-full cursor-pointer rounded-[10px] bg-nevo-navy text-[15.5px] font-semibold text-nevo-cream transition-[filter,transform] duration-150 hover:brightness-108 active:scale-[0.98] xl:mt-8 xl:h-[54px] xl:w-[360px] xl:text-[16px]"
          >
            Try again
          </button>
          <button
            type="button"
            onClick={() => router.push("/auth/teacher")}
            className="mt-2 h-12 w-[340px] max-w-full cursor-pointer rounded-[10px] text-[14.5px] font-medium text-nevo-navy transition-[background-color,transform] duration-150 hover:bg-nevo-navy/6 active:scale-[0.98] xl:h-[50px] xl:w-[360px] xl:text-[15px]"
          >
            Sign in with a password instead
          </button>
        </>
      )}
    </div>
  );
}
