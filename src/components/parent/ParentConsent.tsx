"use client";

import Image from "next/image";
import { useState } from "react";
import { ApiError } from "@/lib/api/client";
import { parentApi, type ParentInvitation } from "@/lib/api/parent";

/**
 * D01b Parent Consent (SCRUM-80).
 *
 * What a parent opens when the school sends a consent request. Unauthenticated,
 * phone-first, no Nevo account: a link by SMS or email. Plain language, no
 * jargon, no dark patterns.
 *
 * ONE BLANKET CONSENT, ONE TAP. Design ruled this on 7 Sep: the DSA already
 * defines the scope of processing, so the single "Yes" is correct and there are
 * no per-type toggles. `ConsentType` has three members but the invitation path
 * only ever requests `data_processing` today, so the tap grants exactly what
 * `invitation.consentTypes` carries - currently one thing.
 *
 * NO DARK PATTERNS is a literal requirement, not a tone note. "I have a question
 * first" is given equal footing rather than buried, nothing is pre-ticked, and
 * the screen never implies that declining is unavailable - it simply is not an
 * action here. A parent who does not consent closes the tab, and the child stays
 * as they were.
 */

type Phase = "idle" | "asking" | "sending" | "done" | "failed" | "gone";

const CARD =
  "rounded-[14px] bg-nevo-cream-elevated px-[22px] py-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)]";
const BODY = "mt-3 text-[15px] leading-[1.6] text-nevo-near-black/68";
const PRIMARY =
  "mt-4 flex h-[54px] w-full items-center justify-center rounded-[12px] bg-nevo-navy px-5 text-[16px] font-semibold text-nevo-cream transition-transform active:scale-[0.99] disabled:opacity-45 cursor-pointer disabled:cursor-not-allowed";
const TEXT_BTN =
  "mt-2 flex h-11 w-full items-center justify-center text-[15px] font-semibold text-nevo-navy cursor-pointer";
const GHOST =
  "mt-2 flex h-[52px] w-full items-center justify-center rounded-[12px] border-[1.5px] border-nevo-near-black/18 text-[15px] font-semibold text-nevo-near-black cursor-pointer";

/** The three promises, in the frame's order. Icons are the frame's own. */
const POINTS = [
  {
    key: "does",
    title: (c: string) => `What ${c} does`,
    body: () => "Lessons her teachers set, at her own pace.",
    icon: (
      <path d="M4 5a2 2 0 0 1 2-2h6v18H6a2 2 0 0 0-2 2zM20 5a2 2 0 0 0-2-2h-6v18h6a2 2 0 0 1 2 2z" />
    ),
  },
  {
    key: "keep",
    title: () => "What we keep",
    body: (c: string) =>
      `${c}'s name, class, and how she's getting on - shared only with her school.`,
    icon: (
      <>
        <path d="M12 3l7 3v5c0 4.4-3 8.3-7 9.5C8 21.3 5 17.4 5 13V6z" />
        <path d="M9.5 12.5l1.8 1.8 3.2-3.6" />
      </>
    ),
  },
  {
    key: "control",
    title: () => "You stay in control",
    body: () => "You can withdraw any time. Her progress is always saved.",
    icon: (
      <path d="M12 20s-6.5-4.2-9-8.2C1.5 9 3 5.5 6.2 5.5c2 0 3.2 1.2 3.8 2.3.6-1.1 1.8-2.3 3.8-2.3C21 5.5 22.5 9 21 11.8c-2.5 4-9 8.2-9 8.2z" />
    ),
  },
];

export function ParentConsent({
  token,
  invitation,
}: {
  token: string;
  invitation: ParentInvitation;
}) {
  const [phase, setPhase] = useState<Phase>("idle");

  // The API sends the LITERAL string "your child" when the school entered no
  // first name - it is a real row, not a hypothetical - so the name has to be
  // capitalised wherever it opens a sentence. See `sentenceCase` below.
  const child = invitation.studentFirstName;
  const childLead = sentenceCase(child);

  async function consent() {
    setPhase("sending");
    try {
      await parentApi.completeConsent(token);
      setPhase("done");
    } catch (e) {
      // 404 covers unknown, revoked and expired - the same dead end, and the
      // same fix: the school issues a fresh link.
      setPhase(e instanceof ApiError && e.status === 404 ? "gone" : "failed");
    }
  }

  if (phase === "gone") {
    return (
      <Shell>
        <div className={CARD}>
          <h1 className="text-[21px] font-semibold text-nevo-near-black">
            This link is no longer active
          </h1>
          <p className={BODY}>
            It may have expired or been replaced by a newer one. Contact{" "}
            {invitation.schoolName} and they can send you a fresh one.
          </p>
        </div>
      </Shell>
    );
  }

  if (phase === "done") {
    return (
      <Shell>
        <div className="flex min-h-[70dvh] flex-col items-center justify-center text-center">
          <span className="flex size-[76px] items-center justify-center rounded-full bg-nevo-navy text-nevo-cream motion-safe:animate-in motion-safe:zoom-in-50 motion-safe:duration-500">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </span>
          <h1 className="mt-6 text-[23px] font-semibold leading-[1.3] tracking-[-0.01em] text-nevo-near-black">
            Thank you &mdash; that&rsquo;s all we needed.
          </h1>
          <p className="mt-3 max-w-[300px] text-[15px] leading-[1.6] text-nevo-near-black/68">
            {childLead} can start learning with her class.
          </p>
          {/*
            * TWO THINGS FROM THE FRAME ARE DELIBERATELY NOT HERE.
            *
            * 1. "Set up my parent account" / "Maybe later". `POST
            *    /consents/parent/complete` returns a `parent_id`, so a record
            *    exists - but there is NO endpoint to give that parent
            *    credentials, and D15d Parent Growth View is unbuilt, so the
            *    button has nowhere to go. A primary call to action that does
            *    nothing is worse than none, and "Maybe later" is meaningless
            *    without it. The frame's sentence about following her progress
            *    is cut for the same reason: it promises a thing that does not
            *    exist yet.
            *
            * 2. "A copy of your consent has been sent to your phone." Nothing
            *    in the contract says a copy is sent, and the completion
            *    response does not report one. On a consent page, telling a
            *    parent they have a receipt they may not have is the kind of
            *    small untruth that costs the whole page its credibility.
            *
            * Both return the moment the API supports them. Raised.
            */}
        </div>
      </Shell>
    );
  }

  if (phase === "asking") {
    return (
      <Shell>
        <div className="flex items-center gap-3">
          {/* "Back", not "Back to the request": the ghost button at the foot
              of this screen already carries that name, and two controls with
              the same accessible name is a genuine ambiguity for anyone
              navigating by voice or a screen reader's control list. */}
          <button
            type="button"
            aria-label="Back"
            onClick={() => setPhase("idle")}
            className="flex size-[38px] cursor-pointer items-center justify-center rounded-[10px] bg-nevo-cream-elevated text-nevo-near-black"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <span className="text-[15px] font-semibold text-nevo-near-black">
            Before you decide
          </span>
        </div>

        <h1 className="mt-6 text-[22px] font-semibold leading-[1.3] tracking-[-0.01em] text-nevo-near-black">
          Any question is welcome &mdash; {child}&rsquo;s school can help.
        </h1>
        <p className={BODY}>
          Nothing happens until you&rsquo;re ready, and consent is never assumed.
          {hasContact(invitation)
            ? " Reach the school directly:"
            : " Your school can answer any question about this request."}
        </p>

        <div className="mt-5 rounded-[12px] bg-nevo-cream-elevated px-[22px] py-5">
          <div className="text-[16px] font-semibold text-nevo-near-black">
            {invitation.schoolName}
          </div>
          {/*
            * The school's own phone and email are NULL for most schools today -
            * they come from the billing contact. So this degrades to naming the
            * school rather than rendering an empty row or a dead `tel:` link,
            * and Nevo's own support line is always offered underneath.
            */}
          {hasContact(invitation) ? (
            <div className="mt-3.5 flex flex-col gap-3">
              {invitation.schoolPhone && (
                <ContactRow
                  href={`tel:${invitation.schoolPhone.replace(/\s+/g, "")}`}
                  label={invitation.schoolPhone}
                  icon={
                    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.7a2 2 0 0 1-.4 2.1L8 11.5a16 16 0 0 0 6 6l1-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.5 2.7.6a2 2 0 0 1 1.7 2z" />
                  }
                />
              )}
              {invitation.schoolEmail && (
                <ContactRow
                  href={`mailto:${invitation.schoolEmail}`}
                  label={invitation.schoolEmail}
                  icon={
                    <>
                      <rect x="3" y="5" width="18" height="14" rx="2" />
                      <path d="M3 7l9 6 9-6" />
                    </>
                  }
                />
              )}
            </div>
          ) : (
            <p className="mt-2 text-[14.5px] leading-[1.55] text-nevo-near-black/68">
              Contact the school the way you normally would &mdash; they sent you
              this request and can explain it.
            </p>
          )}
        </div>

        <p className="mt-4 text-center text-[13px] leading-[1.6] text-nevo-near-black/55">
          You can also reach Nevo at{" "}
          <a
            href="mailto:support@nevolearning.com"
            className="font-medium text-nevo-navy underline underline-offset-2"
          >
            support@nevolearning.com
          </a>
        </p>

        <button type="button" className={GHOST} onClick={() => setPhase("idle")}>
          Back to the request
        </button>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="flex justify-center">
        <Image
          src="/brand/nevo-wordmark.png"
          alt="Nevo"
          width={344}
          height={116}
          priority
          className="h-5 w-auto"
        />
      </div>

      <div className="mt-7">
        <div className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-nevo-violet">
          {invitation.schoolName}
        </div>
        <h1 className="mt-3 text-[24px] font-semibold leading-[1.25] tracking-[-0.01em] text-nevo-near-black">
          {childLead}&rsquo;s school would like your okay to get her started on
          Nevo.
        </h1>
        <p className={BODY}>
          Nevo is the school&rsquo;s learning platform &mdash; personalised
          learning for every student. As {child}&rsquo;s parent or guardian, your
          consent is all we need before she begins.
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-3.5">
        {POINTS.map((p) => (
          <div key={p.key} className="flex items-start gap-3.5">
            <span className="flex size-[38px] flex-none items-center justify-center rounded-[10px] bg-nevo-violet/20 text-nevo-navy">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                {p.icon}
              </svg>
            </span>
            <div>
              <div className="text-[14.5px] font-semibold text-nevo-near-black">
                {p.title(child)}
              </div>
              <div className="mt-1 text-[13.5px] leading-[1.5] text-nevo-near-black/64">
                {p.body(child)}
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        className={PRIMARY}
        disabled={phase === "sending"}
        onClick={() => void consent()}
      >
        {phase === "sending" ? "Recording…" : "Yes, I give my consent"}
      </button>
      <button
        type="button"
        className={TEXT_BTN}
        disabled={phase === "sending"}
        onClick={() => setPhase("asking")}
      >
        I have a question first
      </button>

      {phase === "failed" && (
        <p
          role="alert"
          className="mt-3.5 rounded-[10px] bg-nevo-violet/14 px-4 py-3 text-[14px] leading-[1.5] text-nevo-near-black/80"
        >
          We couldn&rsquo;t record that just now. Nothing has changed &mdash;
          please try again in a moment.
        </p>
      )}

      <p className="mt-4 text-center text-[12px] leading-[1.5] text-nevo-near-black/50">
        Sent to you by {invitation.schoolName}.
        <br />
        Your details are never sold or shared beyond the school.
      </p>
    </Shell>
  );
}

function ContactRow({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <a href={href} className="flex items-center gap-3 text-[14.5px] text-nevo-near-black">
      <span className="flex size-[34px] flex-none items-center justify-center rounded-[10px] bg-nevo-navy/10 text-nevo-navy">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          {icon}
        </svg>
      </span>
      {label}
    </a>
  );
}

/** Whether the school gave us anything a parent could actually dial or email. */
function hasContact(inv: ParentInvitation): boolean {
  return Boolean(inv.schoolPhone || inv.schoolEmail);
}

/**
 * Capitalise a leading word without touching the rest. Deliberately not a
 * title-caser: a real first name arrives already cased, and forcing case would
 * mangle names like "de Souza".
 */
function sentenceCase(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-dvh bg-nevo-cream px-6 py-7 text-nevo-near-black">
      <div className="mx-auto flex w-full max-w-[430px] flex-col">{children}</div>
    </main>
  );
}
