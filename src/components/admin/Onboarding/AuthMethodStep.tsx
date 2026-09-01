"use client";

import { useState } from "react";
import { schoolApi, type SchoolAuthMethod } from "@/lib/api/school";
import { cn } from "@/lib/utils";
import { Modal, Spinner } from "../Roster/primitives";
import {
  StepHeading,
  WIZARD_PRIMARY,
  WIZARD_SECONDARY,
} from "./OnboardingWizard";

/**
 * D1.2 How everyone signs in - the most consequential choice in the product.
 *
 * It decides whether this school is an SSO school (roster syncs, no codes, the
 * IT surface live) or a manual school (school code, hand-built roster).
 * Everything in SCRUM-40 and SCRUM-97 forks here, which is why it cannot
 * commit without a confirm, and why no edit affordance for it exists anywhere
 * else in the admin app.
 *
 * The consequence notice is a PANEL, not a modal, and appears only once a card
 * is selected - it explains what the choice means before the confirm asks
 * whether you meant it.
 *
 * TODO(api): there is no field for this. `PATCH /api/v1/school` accepts
 * `{name, profile, academicConfig, retentionPolicy}` and nothing else, so the
 * answer is written into `profile.onboarding.authMethod` - a provisional
 * contract, documented in `lib/api/school.ts`, that backend needs to ratify.
 *
 * The concept does exist server-side: `auth/school-code/verify` RETURNS an
 * `authMethod`. So this is a missing write against an existing model, not a
 * missing model - which should make it the cheaper half to close. Until it is
 * closed, this screen tells the truth about permanence while storing the
 * answer somewhere backend has not yet promised to read.
 */

const OPTIONS: {
  value: SchoolAuthMethod;
  title: string;
  desc: string;
  glyph: React.ReactNode;
}[] = [
  {
    value: "microsoft",
    title: "Microsoft 365",
    desc: "Everyone signs in with the school account they already have.",
    glyph: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3" y="3" width="8" height="8" fill="currentColor" />
        <rect x="13" y="3" width="8" height="8" fill="currentColor" opacity="0.6" />
        <rect x="3" y="13" width="8" height="8" fill="currentColor" opacity="0.6" />
        <rect x="13" y="13" width="8" height="8" fill="currentColor" opacity="0.35" />
      </svg>
    ),
  },
  {
    value: "google",
    title: "Google Workspace",
    desc: "Everyone signs in with the school account they already have.",
    glyph: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v8M8 12h8" />
      </svg>
    ),
  },
  {
    value: "manual",
    title: "I'll manage accounts manually",
    desc: "We give you a school code, and you build your roster yourself.",
    glyph: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <path d="M4 7h16M4 12h16M4 17h10" />
      </svg>
    ),
  },
];

const NOTICE: Record<SchoolAuthMethod, string> = {
  microsoft:
    "Your staff and students will use their existing Microsoft 365 accounts. No school codes will be issued, and your roster can come across by sync.",
  google:
    "Your staff and students will use their existing Google Workspace accounts. No school codes will be issued, and your roster can come across by sync.",
  manual:
    "We'll generate a school code for you, and you'll build your roster by hand. Nobody needs an existing school account.",
};

type Phase = "idle" | "confirming" | "saving" | "failed";

export function AuthMethodStep({
  selected,
  onSelect,
  onBack,
  onDone,
}: {
  selected: SchoolAuthMethod | null;
  onSelect: (value: SchoolAuthMethod) => void;
  onBack: () => void;
  onDone: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("idle");

  const commit = () => {
    if (!selected) return;
    setPhase("saving");
    schoolApi
      .saveOnboarding({ authMethod: selected })
      .then(() => onDone())
      .catch(() => setPhase("failed"));
  };

  return (
    <>
      <StepHeading
        title="How will everyone sign in?"
        sub="This one is set once. Changing it later means asking us to move your school over, so take a moment."
      />

      <div className="mt-8 flex flex-col gap-3">
        {OPTIONS.map((o) => {
          const on = selected === o.value;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => onSelect(o.value)}
              aria-pressed={on}
              className={cn(
                "flex w-full cursor-pointer items-start gap-4 rounded-xl bg-nevo-cream-elevated px-5 py-5 text-left transition-colors",
                on
                  ? "border-2 border-nevo-navy bg-nevo-navy/[0.06]"
                  : "border border-nevo-near-black/10",
              )}
            >
              <span className="flex size-10 flex-none items-center justify-center rounded-[10px] bg-nevo-navy/12 text-nevo-navy">
                {o.glyph}
              </span>
              <span className="min-w-0">
                <span className="block text-[16.5px] font-semibold text-nevo-near-black">
                  {o.title}
                </span>
                <span className="mt-0.5 block text-sm leading-[1.5] text-nevo-near-black/70">
                  {o.desc}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {selected ? (
        <p className="mt-5 rounded-[10px] border border-nevo-violet/30 bg-nevo-violet/[0.12] px-4 py-3.5 text-sm leading-[1.55] text-nevo-near-black/80">
          {NOTICE[selected]}
        </p>
      ) : null}

      {phase === "failed" ? (
        <p className="mt-5 rounded-[10px] bg-nevo-violet/[0.18] px-4 py-3.5 text-[13.5px] leading-[1.55] text-nevo-navy">
          That didn&rsquo;t save, so nothing has been set. We&rsquo;re on it -
          your choice is still here.
        </p>
      ) : null}

      <div className="mt-8 flex flex-col gap-2.5">
        <button
          type="button"
          onClick={() => setPhase("confirming")}
          disabled={!selected || phase === "saving"}
          className={WIZARD_PRIMARY}
        >
          Continue
        </button>
        <button type="button" onClick={onBack} className={WIZARD_SECONDARY}>
          Back
        </button>
      </div>

      {phase === "confirming" || phase === "saving" ? (
        <Modal
          title="Set this up?"
          onClose={() => phase === "confirming" && setPhase("idle")}
          footer={
            phase === "saving" ? (
              <div className="flex flex-1 items-center justify-center gap-2.5 py-3">
                <Spinner />
                <span className="text-sm text-nevo-near-black/60">Setting it up…</span>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={commit}
                  className={cn(WIZARD_PRIMARY, "flex-1")}
                >
                  Yes, set this up
                </button>
                <button
                  type="button"
                  onClick={() => setPhase("idle")}
                  className={cn(WIZARD_SECONDARY, "flex-1")}
                >
                  Let me reconsider
                </button>
              </>
            )
          }
        >
          <p className="m-0 text-[14.5px] leading-[1.6] text-nevo-near-black/72">
            We&rsquo;ll set your school up this way. If you need to change it
            later, we can help; it isn&rsquo;t something you can switch
            yourself.
          </p>
        </Modal>
      ) : null}
    </>
  );
}
