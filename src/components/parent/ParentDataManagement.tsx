"use client";

import { useState } from "react";
import { ApiError } from "@/lib/api/client";
import { parentApi, type ParentRightType } from "@/lib/api/parent";

/**
 * D01c Parent Data Management (SCRUM-80).
 *
 * The one screen where a parent can change something consequential, and the
 * reason it exists is legal rather than product: NDPA 2023 s.31 requires a
 * direct route to review, object and withdraw.
 *
 * TONE IS PART OF THE SPEC. The frame note is explicit - withdrawal is "the
 * one consequential action", carried in soft violet and navy, NEVER red. A
 * parent exercising a lawful right is not doing something dangerous, and the
 * screen should not flinch at them. No alarm colours anywhere on this page.
 *
 * TODO(api): there is no `GET /api/v1/parent/{token}`, so the token cannot be
 * resolved to a child's name, their school, or whether consent has already
 * been withdrawn. D01c is written throughout in the child's name - "Amara's
 * Data on Nevo", "Enrolled by Corona Secondary School" - and none of that can
 * be rendered. The page says "your child" and omits the school rather than
 * inventing either, and the suspended state cannot be shown on arrival at
 * all: a parent who already withdrew sees the actions again. Raised.
 */

type Phase = "idle" | "sending" | "done" | "failed" | "gone";

/** Which action produced the current outcome, so the copy can match it. */
type Outcome = { right: ParentRightType; requestId: string } | null;

const CARD =
  "rounded-[14px] bg-nevo-cream-elevated px-[22px] py-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)]";
const H3 = "text-[16px] font-semibold text-nevo-near-black";
const BODY = "mt-1.5 text-[14.5px] leading-[1.55] text-nevo-near-black/68";
const PRIMARY =
  "mt-4 w-full rounded-[10px] bg-nevo-navy px-5 py-3 text-[15px] font-semibold text-nevo-cream transition-transform active:scale-[0.99] disabled:opacity-45 cursor-pointer disabled:cursor-not-allowed";
const QUIET =
  "mt-2.5 w-full rounded-[10px] border border-nevo-navy/25 px-5 py-3 text-[15px] font-semibold text-nevo-navy transition-colors hover:bg-nevo-navy/5 cursor-pointer";

/**
 * The four transparency sections. Content is the parental-notice material
 * SCRUM-80 lists; counsel drafts the final wording, so this is deliberately
 * factual and free of framework names.
 */
const SECTIONS: { heading: string; body: string }[] = [
  {
    heading: "What Nevo collects",
    body: "Your child's name, their year group, and how they interact with each lesson - what they answer, how long they spend, and when they ask for help.",
  },
  {
    heading: "How profiling works",
    body: "Nevo adjusts each lesson to how your child is learning in the moment. It never stores a label or a diagnosis, and it never decides anything about your child on its own.",
  },
  {
    heading: "Where data is processed",
    body: "Some processing happens outside Nigeria, including in the United States, which has no adequacy decision from the NDPC. Those transfers are made under Standard Contractual Clauses.",
  },
  {
    heading: "How long data is kept",
    body: "For as long as your child's school uses Nevo. If consent is withdrawn, their account is suspended straight away and the school decides what happens next.",
  },
];

export function ParentDataManagement({ token }: { token: string }) {
  const [open, setOpen] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [outcome, setOutcome] = useState<Outcome>(null);
  const [confirming, setConfirming] = useState(false);

  async function exercise(right: ParentRightType) {
    setPhase("sending");
    try {
      const res = await parentApi.exerciseRight(token, right);
      setOutcome({ right, requestId: res.requestId });
      setPhase("done");
    } catch (e) {
      // A token the backend does not know is the end of the road, not a
      // retry: the link has been revoked, replaced, or mistyped.
      setPhase(e instanceof ApiError && e.status === 404 ? "gone" : "failed");
    }
  }

  if (phase === "gone") {
    return (
      <Shell>
        <div className={CARD}>
          <h2 className={H3}>This link is no longer active</h2>
          <p className={BODY}>
            It may have been replaced by a newer one, or the school may have
            updated your details. Contact your child&rsquo;s school and they
            can send you a fresh link.
          </p>
        </div>
        <Footer />
      </Shell>
    );
  }

  // The withdrawal outcome replaces the page: nothing else on it is true any
  // more, and offering the actions again would invite a second withdrawal.
  if (phase === "done" && outcome?.right === "withdraw_consent") {
    return (
      <Shell>
        <div className={CARD}>
          <h2 className={H3}>Your child&rsquo;s account is suspended</h2>
          <p className={BODY}>
            You withdrew consent, so they can no longer access Nevo.
          </p>
          <p className={BODY}>
            To restore access, contact your child&rsquo;s school. The school
            will work with Nevo to reactivate the account.
          </p>
        </div>
        <div className={`${CARD} mt-3.5`}>
          <h3 className={H3}>Request My Child&rsquo;s Data</h3>
          {/* Kept deliberately: the right to a copy survives withdrawal, and
              the frame says so in as many words. */}
          <p className={BODY}>You keep this right even after withdrawing consent.</p>
          <button
            type="button"
            className={PRIMARY}
            onClick={() => void exercise("request_data")}
          >
            Request my child&rsquo;s data
          </button>
        </div>
        <Footer />
      </Shell>
    );
  }

  return (
    <Shell>
      <div className={CARD}>
        {/* TODO(api): the child's name and school belong here. Without a read
            on the token there is nothing true to put, and a placeholder name
            on a legal page would be worse than none. */}
        <h1 className="text-[21px] font-semibold tracking-[-0.015em] text-nevo-near-black">
          Your child&rsquo;s data on Nevo
        </h1>
        <p className={BODY}>
          Your child&rsquo;s school enrolled them on Nevo. This page explains
          what that means, and lets you act on it.
        </p>
      </div>

      <div className="mt-3.5 overflow-hidden rounded-[14px] bg-nevo-cream-elevated shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
        {SECTIONS.map((s, i) => {
          const isOpen = open === s.heading;
          return (
            <div
              key={s.heading}
              className={i > 0 ? "border-t border-nevo-near-black/8" : ""}
            >
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? null : s.heading)}
                className="flex w-full cursor-pointer items-center justify-between px-[22px] py-4 text-left"
              >
                <span className="text-[15px] font-medium text-nevo-near-black">
                  {s.heading}
                </span>
                <span
                  aria-hidden
                  className="text-nevo-near-black/40 transition-transform"
                  style={{ transform: isOpen ? "rotate(180deg)" : undefined }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </span>
              </button>
              {isOpen && (
                <p className="px-[22px] pb-4 text-[14.5px] leading-[1.6] text-nevo-near-black/70">
                  {s.body}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className={`${CARD} mt-3.5`}>
        <h3 className={H3}>Request My Child&rsquo;s Data</h3>
        <p className={BODY}>
          We will prepare a copy of your child&rsquo;s data and send it to the
          email address your school has for you.
        </p>
        {outcome?.right === "request_data" && phase === "done" ? (
          <p className="mt-3.5 rounded-[10px] bg-nevo-violet/14 px-4 py-3 text-[14px] leading-[1.5] text-nevo-near-black/80">
            Request submitted. You will receive your child&rsquo;s data within
            5 working days.
          </p>
        ) : (
          <button
            type="button"
            className={PRIMARY}
            disabled={phase === "sending"}
            onClick={() => void exercise("request_data")}
          >
            {phase === "sending" ? "Sending…" : "Request my child’s data"}
          </button>
        )}
      </div>

      <div className={`${CARD} mt-3.5`}>
        <h3 className={H3}>Object to Processing</h3>
        <p className={BODY}>
          Tell us your concern. We will review it within 48 hours.
        </p>
        {/*
          * D01c draws a "Describe your concern" textarea here. It is NOT built,
          * and that is deliberate: `ParentRightRequest` carries `requestType`
          * and nothing else, and the API accepts and ignores extra fields -
          * `reason`, `message`, `details` and `note` all pass validation and go
          * nowhere. A parent typing their concern into a box that discards it,
          * and being told it was received, is a worse failure than not offering
          * the box. It returns when the contract has somewhere to put it.
          */}
        {outcome?.right === "object" && phase === "done" ? (
          <p className="mt-3.5 rounded-[10px] bg-nevo-violet/14 px-4 py-3 text-[14px] leading-[1.5] text-nevo-near-black/80">
            Objection submitted. We will respond within 48 hours to the email
            address your school has for you.
          </p>
        ) : (
          <button
            type="button"
            className={PRIMARY}
            disabled={phase === "sending"}
            onClick={() => void exercise("object")}
          >
            {phase === "sending" ? "Sending…" : "Object to processing"}
          </button>
        )}
      </div>

      <div className={`${CARD} mt-3.5`}>
        <h3 className={H3}>Withdraw Consent</h3>
        {!confirming ? (
          <>
            <p className={BODY}>
              This will immediately suspend your child&rsquo;s access to Nevo.
            </p>
            <button
              type="button"
              className={QUIET}
              onClick={() => setConfirming(true)}
            >
              Withdraw consent
            </button>
          </>
        ) : (
          <>
            <p className={BODY}>
              This will immediately suspend your child&rsquo;s access to Nevo.
              They will not be able to use the platform until consent is
              restored through your school.
            </p>
            <p className={BODY}>
              To restore access later, contact your child&rsquo;s school.
            </p>
            <button
              type="button"
              className={PRIMARY}
              disabled={phase === "sending"}
              onClick={() => setConfirming(false)}
            >
              Keep active
            </button>
            <button
              type="button"
              className={QUIET}
              disabled={phase === "sending"}
              onClick={() => void exercise("withdraw_consent")}
            >
              {phase === "sending" ? "Withdrawing…" : "Withdraw consent"}
            </button>
          </>
        )}
      </div>

      {phase === "failed" && (
        <p
          role="alert"
          className="mt-3.5 rounded-[10px] bg-nevo-violet/14 px-4 py-3 text-[14px] leading-[1.5] text-nevo-near-black/80"
        >
          We couldn&rsquo;t send that just now. Nothing has changed - please
          try again in a moment.
        </p>
      )}

      <Footer />
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-dvh bg-nevo-cream px-5 py-8 text-nevo-near-black">
      <div className="mx-auto w-full max-w-[560px]">{children}</div>
    </main>
  );
}

function Footer() {
  return (
    <div className="mt-7 pb-4 text-center text-[13px] leading-[1.6] text-nevo-near-black/55">
      <p className="m-0">
        Need help? Contact{" "}
        <a
          href="mailto:support@nevolearning.com"
          className="font-medium text-nevo-navy underline underline-offset-2"
        >
          support@nevolearning.com
        </a>
      </p>
      <p className="m-0 mt-1.5">
        You can also contact the Nigeria Data Protection Commission (NDPC) at{" "}
        <a
          href="https://ndpc.gov.ng"
          className="font-medium text-nevo-navy underline underline-offset-2"
          rel="noreferrer noopener"
          target="_blank"
        >
          ndpc.gov.ng
        </a>
      </p>
    </div>
  );
}
