"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { setSession } from "@/lib/auth/session";
import { USER_ROLES } from "@/lib/constants";
import { TEACHER_CLASSES } from "@/lib/mocks/teacherClasses";
import {
  classCountLine,
  COMPLETE_HOLD_MS,
  TEACHER_INVITE,
  VERIFY_MS,
} from "@/lib/mocks/teacherOnboarding";

/**
 * C01 Teacher Onboarding - invite link to verified account, standalone (no
 * console shell). Most context arrives pre-filled from the school's setup;
 * the teacher only confirms and adds a light profile. No terms gate, no
 * forced tour. Four states: verify email (simulated round trip) -> join
 * confirmation (the real class fixtures - the frame's own mock data matches
 * them exactly) -> profile setup -> complete, brief hold, dashboard.
 */

type Step = "verify" | "confirm" | "profile" | "complete";

export function TeacherOnboarding() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("verify");
  const [name, setName] = useState(TEACHER_INVITE.name);
  const [subjects, setSubjects] = useState<string[]>(TEACHER_INVITE.subjects);
  const [subjectDraft, setSubjectDraft] = useState("");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  // The email round trip: "Open it and you'll come right back here."
  useEffect(() => {
    if (step !== "verify") return;
    const t = setTimeout(() => setStep("confirm"), VERIFY_MS);
    timers.current.push(t);
    return () => clearTimeout(t);
  }, [step]);

  useEffect(() => {
    if (step !== "complete") return;
    // Onboarding ends signed in - the invite is how a teacher gets a session.
    // The real flow accepts the invitation and signs in with the password the
    // teacher just set; standing in for it with a token-less session keeps
    // the route guard satisfied without faking live data.
    // TODO(api): POST /api/v1/admin/team/invitations/accept once design adds
    // the password step the backend's accept contract requires.
    setSession({
      token: "",
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      userId: "teacher-invite-demo",
      role: USER_ROLES.TEACHER,
    });
    const t = setTimeout(() => router.push("/teacher/dashboard"), COMPLETE_HOLD_MS);
    timers.current.push(t);
    return () => clearTimeout(t);
  }, [step, router]);

  const commitSubject = () => {
    const s = subjectDraft.trim().replace(/,$/, "");
    if (s && !subjects.includes(s)) setSubjects((prev) => [...prev, s]);
    setSubjectDraft("");
  };

  const firstName = name.trim().split(/\s+/)[0] || TEACHER_INVITE.name.split(" ")[0];

  return (
    <div className="relative flex h-dvh w-full items-center justify-center overflow-y-auto bg-nevo-cream px-10 text-nevo-near-black">
      {step !== "complete" && (
        <span className="absolute top-8 left-10 block h-[17px] w-[58px] overflow-hidden xl:top-9 xl:left-11 xl:h-[18px] xl:w-[62px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/logo-wordmark-purple.png"
            alt="Nevo"
            className="absolute block h-[169px] w-[169px] max-w-none -translate-x-[61px] -translate-y-[81px] xl:h-[181px] xl:w-[181px] xl:-translate-x-[66px] xl:-translate-y-[87px]"
          />
        </span>
      )}

      {step === "verify" && (
        <div className="flex w-full max-w-[460px] flex-col items-start xl:max-w-[480px]">
          <span className="text-[12px] font-semibold tracking-[0.14em] text-nevo-violet uppercase xl:text-[12.5px]">
            {`${TEACHER_INVITE.school} · ${TEACHER_INVITE.location}`}
          </span>
          <h2 className="mt-[13px] text-[29px] leading-[1.15] font-semibold tracking-[-0.02em] xl:mt-3.5 xl:text-[34px]">
            {`Welcome to ${TEACHER_INVITE.school}`}
          </h2>
          <p className="mt-3 text-[16px] leading-[1.55] text-nevo-near-black/70 xl:mt-3.5 xl:text-[17px]">
            {"You've been invited to join as a teacher."}
          </p>
          <div className="mt-[30px] flex w-full flex-col items-center rounded-[12px] bg-nevo-cream-elevated p-7 text-center shadow-elevation-1 xl:mt-9 xl:p-8">
            <span className="flex size-[58px] items-center justify-center rounded-full bg-nevo-violet/20 text-nevo-navy xl:size-16">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="xl:size-[30px]">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="M3 7l9 6 9-6" />
              </svg>
            </span>
            <h3 className="mt-[18px] text-[18px] font-semibold xl:mt-5 xl:text-[19px]">
              Check your email to verify
            </h3>
            <p className="mt-2 text-[14.5px] leading-[1.55] text-nevo-near-black/68 xl:mt-2.5 xl:text-[15px]">
              {"We sent a link to "}
              <span className="font-medium text-nevo-navy">
                {TEACHER_INVITE.email}
              </span>
              {". Open it and you'll come right back here."}
            </p>
            <span className="mt-5 flex items-center gap-2.5 text-[13.5px] text-nevo-near-black/60 xl:mt-[22px] xl:text-[14px]">
              <span
                role="status"
                aria-label="Waiting"
                className="size-[17px] rounded-full border-[2.5px] border-nevo-navy/25 border-t-nevo-navy motion-safe:animate-spin motion-safe:[animation-duration:900ms] xl:size-[18px]"
              />
              {"Waiting for verification…"}
            </span>
            <button
              type="button"
              className="mt-[18px] cursor-pointer text-[14px] font-medium text-nevo-navy xl:mt-5 xl:text-[14.5px]"
            >
              Resend the email
            </button>
          </div>
        </div>
      )}

      {step === "confirm" && (
        <div className="flex w-full max-w-[500px] flex-col items-start xl:max-w-[520px]">
          <span className="flex size-12 items-center justify-center rounded-full bg-nevo-navy text-nevo-cream motion-safe:animate-nevo-pop xl:size-[52px]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="xl:size-[26px]">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </span>
          <h2 className="mt-5 text-[29px] leading-[1.15] font-semibold tracking-[-0.02em] xl:mt-[22px] xl:text-[32px]">
            {"You're in. Here's what you're teaching:"}
          </h2>
          <p className="mt-[11px] text-[15.5px] leading-[1.55] text-nevo-near-black/70 xl:mt-3 xl:text-[16px]">
            {classCountLine(TEACHER_CLASSES.length)}
          </p>
          <div className="mt-6 flex w-full flex-col gap-[11px] xl:mt-7 xl:gap-3">
            {TEACHER_CLASSES.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-[12px] bg-nevo-cream-elevated px-5 py-4 shadow-elevation-1 xl:px-[22px] xl:py-[18px]"
              >
                <div className="min-w-0">
                  <span className="block text-[16px] font-semibold xl:text-[16.5px]">
                    {c.name}
                  </span>
                  <span className="mt-[3px] block text-[13.5px] text-nevo-near-black/60 xl:text-[14px]">
                    {c.subjects}
                  </span>
                </div>
                <span className="shrink-0 text-[14px] text-nevo-near-black/62 xl:text-[14.5px]">
                  {`${c.count} students`}
                </span>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setStep("profile")}
            className="mt-7 h-[52px] w-full cursor-pointer rounded-[10px] bg-nevo-navy text-[16px] font-semibold tracking-[-0.005em] text-nevo-cream transition-[filter,transform] duration-150 hover:brightness-93 active:scale-[0.99] xl:mt-8 xl:h-[54px]"
          >
            Set up my profile
          </button>
        </div>
      )}

      {step === "profile" && (
        <div className="flex w-full max-w-[460px] flex-col items-start xl:max-w-[480px]">
          <h2 className="text-[29px] leading-[1.15] font-semibold tracking-[-0.02em] xl:text-[32px]">
            A little about you
          </h2>
          <p className="mt-[11px] text-[15.5px] leading-[1.55] text-nevo-near-black/70 xl:mt-3 xl:text-[16px]">
            This is just so your students and colleagues recognise you.
          </p>
          <div className="mt-[26px] flex items-center gap-4 xl:mt-[30px] xl:gap-[18px]">
            {/* No filled/photo state is drawn in the frame - the dropzone is
                the whole contract (flagged). */}
            <button
              type="button"
              aria-label="Add a photo"
              className="flex size-[70px] shrink-0 cursor-pointer items-center justify-center rounded-full border-[1.5px] border-dashed border-nevo-navy/30 bg-nevo-cream-elevated text-nevo-navy xl:size-[76px]"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="xl:size-[26px]">
                <path d="M4 8h3l2-2.5h6L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
                <circle cx="12" cy="12.5" r="3.2" />
              </svg>
            </button>
            <div>
              <span className="block text-[14.5px] font-medium text-nevo-near-black xl:text-[15px]">
                Add a photo
              </span>
              <span className="mt-[3px] block text-[13px] text-nevo-near-black/55 xl:text-[13.5px]">
                Optional
              </span>
            </div>
          </div>

          <label
            htmlFor="onboarding-name"
            className="mt-6 text-[13px] font-semibold text-nevo-near-black/70 xl:mt-[26px] xl:text-[13.5px]"
          >
            Your name
          </label>
          <input
            id="onboarding-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-2 h-[50px] w-full rounded-[10px] border-[1.5px] border-nevo-near-black/16 bg-nevo-cream-elevated px-4 text-[15.5px] text-nevo-near-black transition-[border-color] duration-150 outline-none focus:border-nevo-navy xl:h-[52px] xl:text-[16px]"
          />

          <label
            htmlFor="onboarding-subject"
            className="mt-5 text-[13px] font-semibold text-nevo-near-black/70 xl:mt-[22px] xl:text-[13.5px]"
          >
            Subject area(s)
          </label>
          <div className="mt-2 flex min-h-[50px] w-full flex-wrap items-center gap-2 rounded-[10px] border-[1.5px] border-nevo-near-black/16 bg-nevo-cream-elevated px-3 py-[9px] xl:min-h-[52px]">
            {subjects.map((s) => (
              <span
                key={s}
                className="inline-flex items-center gap-[7px] rounded-full bg-nevo-violet/22 px-3 py-1.5 text-[13px] font-medium text-nevo-navy xl:text-[13.5px]"
              >
                {s}
                <button
                  type="button"
                  onClick={() => setSubjects((prev) => prev.filter((x) => x !== s))}
                  aria-label={`Remove ${s}`}
                  className="cursor-pointer text-[15px] leading-none text-nevo-navy/55"
                >
                  ×
                </button>
              </span>
            ))}
            <input
              id="onboarding-subject"
              type="text"
              value={subjectDraft}
              onChange={(e) => setSubjectDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  commitSubject();
                }
              }}
              onBlur={commitSubject}
              placeholder="Add another…"
              className="min-w-[110px] flex-1 border-none bg-transparent px-1 py-0.5 text-[14px] text-nevo-near-black outline-none placeholder:text-nevo-near-black/40 xl:text-[14.5px]"
            />
          </div>

          <button
            type="button"
            onClick={() => setStep("complete")}
            className="mt-7 h-[52px] w-full cursor-pointer rounded-[10px] bg-nevo-navy text-[16px] font-semibold text-nevo-cream transition-[filter,transform] duration-150 hover:brightness-93 active:scale-[0.99] xl:mt-[34px] xl:h-[54px]"
          >
            Continue to my dashboard
          </button>
        </div>
      )}

      {step === "complete" && (
        <div className="flex flex-col items-center text-center">
          <span className="flex size-[68px] items-center justify-center rounded-full bg-nevo-navy text-nevo-cream motion-safe:animate-nevo-pop xl:size-[72px]">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="xl:size-[34px]">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </span>
          <h2 className="mt-6 text-[27px] font-semibold tracking-[-0.015em] xl:mt-[26px] xl:text-[30px]">
            {`All set, ${firstName}.`}
          </h2>
          <p className="mt-[11px] max-w-[380px] text-[16px] leading-[1.55] text-nevo-near-black/70 xl:mt-3 xl:max-w-[400px] xl:text-[17px]">
            Taking you to your dashboard.
          </p>
        </div>
      )}
    </div>
  );
}
