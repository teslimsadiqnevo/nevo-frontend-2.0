"use client";

import Image from "next/image";
import { useState } from "react";
import { ApiError } from "@/lib/api/client";
import { setSession } from "@/lib/auth/session";
import {
  apiErrorCode,
  parentApi,
  type ParentContactMethod,
  type ParentInvitation,
} from "@/lib/api/parent";

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

type Phase = "idle" | "asking" | "sending" | "done" | "skipped" | "failed" | "gone";

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
  // Where a copy of the decision actually went, straight from the receipt. The
  // line is rendered only when there IS one - the screen never assumes.
  const [receipt, setReceipt] = useState<ParentContactMethod | null>(null);

  // The API sends the LITERAL string "your child" when the school entered no
  // first name - it is a real row, not a hypothetical - so the name has to be
  // capitalised wherever it opens a sentence. See `sentenceCase` below.
  const child = invitation.studentFirstName;
  const childLead = sentenceCase(child);

  async function consent() {
    setPhase("sending");
    try {
      const res = await parentApi.completeConsent(token);
      setReceipt(res.receipt_sent_to);
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
          <p className="mt-3 max-w-[320px] text-[15px] leading-[1.6] text-nevo-near-black/68">
            {childLead} can start learning with her class. Set up an account and
            you can follow how she&rsquo;s getting on, whenever you like.
          </p>

          <AccountSetup
            token={token}
            /* Both of these used to be withheld. The button had no endpoint to
               call and nowhere to land; the receipt line promised a copy that
               nothing sent. Both exist now. */
            onSkip={() => setPhase("skipped")}
          />

          {receipt && (
            <p className="mt-6 text-center text-[12px] leading-[1.5] text-nevo-near-black/50">
              A copy of your consent has been sent to your{" "}
              {receipt === "sms" ? "phone" : "email"}.
            </p>
          )}
        </div>
      </Shell>
    );
  }

  if (phase === "skipped") {
    return (
      <Shell>
        <div className="flex min-h-[70dvh] flex-col items-center justify-center text-center">
          <h1 className="text-[23px] font-semibold leading-[1.3] tracking-[-0.01em] text-nevo-near-black">
            All done &mdash; thank you.
          </h1>
          <p className="mt-3 max-w-[320px] text-[15px] leading-[1.6] text-nevo-near-black/68">
            {childLead} can start learning with her class. You can set up an
            account later from the same link.
          </p>
          {receipt && (
            <p className="mt-6 text-[12px] leading-[1.5] text-nevo-near-black/50">
              A copy of your consent has been sent to your{" "}
              {receipt === "sms" ? "phone" : "email"}.
            </p>
          )}
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

/**
 * D01b's "Set up my parent account", which the frame has always drawn and which
 * only became buildable on 10 Sep.
 *
 * The consent token is the authorisation — it went to this parent, for this
 * child — so no email is asked for and no second link is sent. The response
 * carries a session, which is why this signs them straight in rather than
 * handing them a password and a door to find.
 *
 * MINIMUM 8 CHARACTERS is the server's rule, checked here too so a parent is
 * told before the round trip rather than after it.
 */
function AccountSetup({
  token,
  onSkip,
}: {
  token: string;
  onSkip: () => void;
}) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<"created" | "sms-only" | "exists" | null>(
    null,
  );

  const tooShort = password.length > 0 && password.length < 8;

  async function create() {
    if (password.length < 8) {
      setError("Please choose a password of at least 8 characters.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const account = await parentApi.createAccount(token, password);
      setSession({
        token: account.session.access_token,
        expiresAt: account.session.expires_at,
        userId: account.session.user_id,
        role: account.session.role,
      });
      setDone("created");
      // A hard navigation, not a router push: the session and its mirror cookie
      // must have settled before the portal is asked for.
      window.location.assign("/parent-portal");
    } catch (e) {
      setBusy(false);
      if (!(e instanceof ApiError)) {
        setError("We couldn’t set that up just now. Please try again.");
        return;
      }
      const code = apiErrorCode(e.detail);
      if (code === "parent_contact_not_email") {
        // Password sign-in is email-only. Nigeria is SMS-first, so this is a
        // real slice of parents, not an edge case - and it is not their fault,
        // so it does not read as an error.
        setDone("sms-only");
      } else if (e.status === 409) {
        setDone("exists");
      } else if (e.status === 404) {
        setError(
          "This link is no longer active. Your child’s school can send you a new one.",
        );
      } else {
        setError("We couldn’t set that up just now. Please try again.");
      }
    }
  }

  if (done === "created") {
    return (
      <p className="mt-6 text-[15px] text-nevo-near-black/68">
        Taking you to your account…
      </p>
    );
  }

  if (done === "sms-only") {
    return (
      <div className="mt-6 w-full max-w-[340px] rounded-[12px] bg-nevo-violet/14 px-5 py-4 text-left">
        <p className="text-[14.5px] leading-[1.55] text-nevo-near-black/80">
          We can&rsquo;t set up an account with a phone number just yet &mdash;
          sign-in needs an email address. Your consent is recorded either way,
          and the link the school sent you still works.
        </p>
      </div>
    );
  }

  if (done === "exists") {
    return (
      <div className="mt-6 w-full max-w-[340px] rounded-[12px] bg-nevo-violet/14 px-5 py-4 text-left">
        <p className="text-[14.5px] leading-[1.55] text-nevo-near-black/80">
          You&rsquo;ve already set up an account for {""}
          this child, so there&rsquo;s nothing more to do here. Use the password
          you chose then.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-7 w-full max-w-[340px] text-left">
      <label
        htmlFor="parent-password"
        className="block text-[14px] font-medium text-nevo-near-black/80"
      >
        Choose a password
      </label>
      <input
        id="parent-password"
        type="password"
        autoComplete="new-password"
        value={password}
        onChange={(e) => {
          setPassword(e.target.value);
          setError(null);
        }}
        className="mt-1.5 h-[52px] w-full rounded-[10px] border border-nevo-navy/20 bg-nevo-cream px-3.5 text-[16px] text-nevo-near-black outline-none focus:border-nevo-navy/45"
      />
      <p className="mt-1.5 text-[12.5px] text-nevo-near-black/50">
        At least 8 characters.
      </p>

      <button
        type="button"
        className={PRIMARY}
        disabled={busy || password.length < 8}
        onClick={() => void create()}
      >
        {busy ? "Setting up…" : "Set up my parent account"}
      </button>
      <button type="button" className={TEXT_BTN} disabled={busy} onClick={onSkip}>
        Maybe later
      </button>

      {(error || tooShort) && (
        <p role="alert" className="mt-2 text-[13.5px] leading-[1.5] text-nevo-navy">
          {error ?? "Please choose a password of at least 8 characters."}
        </p>
      )}
    </div>
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
