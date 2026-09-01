"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { schoolApi, type School } from "@/lib/api/school";
import { cn } from "@/lib/utils";
import { CheckIcon, Spinner } from "../Roster/primitives";
import {
  StepHeading,
  WIZARD_PRIMARY,
  WIZARD_SECONDARY,
  type WizardState,
} from "./OnboardingWizard";

/**
 * D1.5 School code, or SSO handover - two screens behind one step, chosen by
 * the answer at 1.2.
 *
 * Manual schools receive their code here. SSO schools are walked STRAIGHT INTO
 * provider connection rather than being left to find it later, because a
 * school that finishes onboarding without connecting has an unusable product
 * and does not know it.
 *
 * THE CODE IS RENDERED AS LINES, NEVER BOXES. That is the fixed house rule and
 * it carries real meaning: codes are lines, PINs are boxes, so a child never
 * confuses the two.
 *
 * The skip path is quiet but real - the IT step then sits outstanding on the
 * Overview, rather than vanishing.
 */

type Phase = "loading" | "ready" | "failed";

export function HandoverStep({ state }: { state: WizardState }) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [school, setSchool] = useState<School | null>(null);
  const [copied, setCopied] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connectFailed, setConnectFailed] = useState(false);

  const load = useCallback(() => {
    schoolApi
      .get()
      .then((s) => {
        setSchool(s);
        setPhase("ready");
        // Mark the wizard finished, so a resumed session knows not to restart
        // it. Best effort: a failure here must not block the workspace.
        schoolApi
          .saveOnboarding({ completedAt: new Date().toISOString() })
          .catch(() => undefined);
      })
      .catch(() => setPhase("failed"));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const schoolName = school?.name || state.schoolName.trim() || "Your school";
  const isSso = state.authMethod === "microsoft" || state.authMethod === "google";
  const providerName =
    state.authMethod === "google" ? "Google Workspace" : "Microsoft 365";

  const connect = () => {
    if (!school?.slug || !state.authMethod) return;
    setConnecting(true);
    setConnectFailed(false);
    schoolApi
      .ssoStart(school.slug, state.authMethod)
      .then((res) => {
        window.location.assign(res.authorization_url);
      })
      .catch(() => {
        setConnecting(false);
        setConnectFailed(true);
      });
  };

  if (phase === "loading") {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <Spinner />
        <p className="m-0 text-sm text-nevo-near-black/60">
          Finishing your workspace…
        </p>
      </div>
    );
  }

  /* ------------------------------------------------------------- SSO route */
  if (isSso) {
    return (
      <>
        <StepHeading
          title="You're almost there"
          sub={`${schoolName}'s workspace is created. One step left: connect ${providerName} so everyone can sign in with their school account.`}
        />

        <div className="mt-8 rounded-xl bg-nevo-cream-elevated px-5 py-5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-base font-semibold text-nevo-near-black">
              {providerName}
            </span>
            <span className="flex-none rounded-full bg-nevo-near-black/[0.07] px-3 py-1 text-[12.5px] font-semibold text-nevo-near-black/60">
              Not connected yet
            </span>
          </div>
          <ul className="m-0 mt-4 flex list-none flex-col gap-2 p-0 text-sm leading-[1.5] text-nevo-near-black/70">
            {[
              "Staff and students sign in with the account they already have.",
              "Your roster can come across automatically.",
              "Nothing else in your directory is read or changed.",
            ].map((line) => (
              <li key={line} className="flex items-start gap-2.5">
                <span
                  aria-hidden="true"
                  className="mt-[7px] size-[6px] flex-none rounded-full bg-nevo-violet"
                />
                {line}
              </li>
            ))}
          </ul>
        </div>

        {connectFailed ? (
          <p className="mt-5 rounded-[10px] bg-nevo-violet/[0.18] px-4 py-3.5 text-[13.5px] leading-[1.55] text-nevo-navy">
            That connection didn&rsquo;t complete. We&rsquo;re on it, and your
            setup so far is saved.
          </p>
        ) : null}

        {!school?.slug ? (
          <p className="mt-5 rounded-[10px] bg-nevo-violet/[0.18] px-4 py-3.5 text-[13.5px] leading-[1.55] text-nevo-navy">
            Your workspace is ready, but we can&rsquo;t start the {providerName}{" "}
            connection from here yet. Your IT lead can finish it from IT &amp;
            SSO - nothing is lost.
          </p>
        ) : null}

        <div className="mt-8 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={connect}
            disabled={connecting || !school?.slug}
            className={WIZARD_PRIMARY}
          >
            {connecting ? (
              <span className="inline-flex items-center justify-center gap-2.5">
                <Spinner />
                Connecting to {providerName}…
              </span>
            ) : connectFailed ? (
              "Try again"
            ) : (
              `Connect ${providerName}`
            )}
          </button>
          <Link href="/admin/dashboard" className={cn(WIZARD_SECONDARY, "text-center")}>
            I&rsquo;ll do this with our IT lead later
          </Link>
        </div>
      </>
    );
  }

  /* ---------------------------------------------------------- Manual route */
  const code = school?.code ?? null;

  return (
    <>
      <StepHeading
        title="You're all set up"
        sub={`${schoolName}'s workspace is ready. Share your school code so staff and students can join.`}
      />

      <div className="mt-9">
        <p className="m-0 text-[13px] font-medium text-nevo-near-black/62">
          Your school code
        </p>

        {code ? (
          <>
            {/* Lines, never boxes - codes are lines, PINs are boxes. */}
            <div className="mt-4 flex flex-wrap gap-3">
              {code.split("").map((ch, i) => (
                <span
                  key={`${ch}-${i}`}
                  className="flex w-11 justify-center border-b-2 border-nevo-navy pb-1 text-[30px] font-semibold text-nevo-navy"
                >
                  {ch === "-" ? <span className="opacity-40">&ndash;</span> : ch}
                </span>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                navigator.clipboard
                  ?.writeText(code)
                  .then(() => setCopied(true))
                  .catch(() => setCopied(false));
              }}
              className="mt-7 inline-flex cursor-pointer items-center gap-2 rounded-[10px] bg-nevo-navy px-5 py-3 text-sm font-semibold text-nevo-cream transition-[filter] hover:brightness-110"
            >
              {copied ? (
                <>
                  <span className="motion-safe:animate-nevo-pop">
                    <CheckIcon size={15} />
                  </span>
                  Copied
                </>
              ) : (
                "Copy code"
              )}
            </button>

            <p className="mt-4 text-[13.5px] leading-[1.55] text-nevo-near-black/60">
              Staff and students enter this once when they first sign in. Keep
              it somewhere you can find it.
            </p>
          </>
        ) : (
          <p className="mt-3 rounded-[10px] bg-nevo-violet/[0.18] px-4 py-3.5 text-[13.5px] leading-[1.55] text-nevo-navy">
            Your workspace is ready, but your school code hasn&rsquo;t come
            through yet. It&rsquo;ll be waiting on your dashboard - nothing is
            lost.
          </p>
        )}
      </div>

      <Link href="/admin/dashboard" className={cn(WIZARD_PRIMARY, "mt-9 block text-center")}>
        Go to your dashboard
      </Link>
    </>
  );
}
