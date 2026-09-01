"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { AccountSettings } from "./AccountSettings";
import { SchoolSettings } from "./SchoolSettings";

/**
 * D12 / D12b / D12c Settings (SCRUM-99), as two sections behind one route.
 *
 * The frames themselves draw the split - D12b's breadcrumb reads "Settings ·
 * Your school", D12c's reads "Settings · You" - so the tabs are the design's
 * own division rather than an invention.
 *
 * WHAT IS BLOCKED, and it is a third of this ticket:
 *
 *   - PROMOTION (D12b, "Move everyone up a year"). No endpoint. It needs a
 *     bulk year-group advance, a leavers pass, and a seven-day undo, and the
 *     API has none of the three - `PATCH /students/{id}/class` moves one
 *     student between classes, which is a different operation entirely.
 *   - TWO-STEP SIGN-IN (D12c). No endpoint anywhere: no enrolment, no secret,
 *     no verify, no recovery codes.
 *   - PROFILE EDITING (D12c). `GET /api/v1/users/me` is the only route on the
 *     users resource. There is no write, so full name, role title and work
 *     email are shown as the record has them and cannot be changed here.
 *
 * All three are absent rather than mocked. A settings screen that appears to
 * save and does not is worse than one that admits the control is not built -
 * and in the promotion case, a control that appears to move 287 children
 * between year groups and silently does nothing would be genuinely dangerous.
 */

type Tab = "school" | "you";

export function SettingsView() {
  const [tab, setTab] = useState<Tab>("school");

  return (
    <div className="mx-auto w-full max-w-[1040px] px-[38px] py-[34px] xl:px-[52px] xl:py-11">
      <div className="mx-auto max-w-[720px]">
        <h2 className="m-0 text-[28px] font-semibold tracking-[-0.018em] text-nevo-near-black">
          Settings
        </h2>

        <div
          role="tablist"
          aria-label="Settings"
          className="mt-6 flex gap-1 border-b border-nevo-near-black/10"
        >
          {(
            [
              ["school", "Your school"],
              ["you", "You"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={cn(
                "-mb-px cursor-pointer border-b-2 px-4 pb-3 pt-2 text-[14.5px] font-semibold transition-colors",
                tab === key
                  ? "border-nevo-navy text-nevo-navy"
                  : "border-transparent text-nevo-near-black/55 hover:text-nevo-near-black/80",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "school" ? <SchoolSettings /> : <AccountSettings />}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------- shared pieces */

export const SETTINGS_CARD =
  "rounded-xl bg-nevo-cream-elevated px-6 py-[26px] shadow-[0_2px_8px_rgba(0,0,0,0.06)]";

export const S_LABEL = "mb-2 block text-[13px] font-medium text-nevo-near-black/62";

export const S_FIELD =
  "w-full rounded-[10px] border border-nevo-near-black/12 bg-nevo-cream px-4 py-3 text-[15px] text-nevo-near-black outline-none transition-colors focus:border-nevo-navy disabled:cursor-not-allowed disabled:opacity-60";

export function SettingsSection({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn(SETTINGS_CARD, "mt-5")}>
      <h3 className="m-0 text-[17px] font-semibold text-nevo-near-black">{title}</h3>
      {note ? (
        <p className="m-0 mt-1 max-w-[58ch] text-[13px] leading-[1.55] text-nevo-near-black/58">
          {note}
        </p>
      ) : null}
      <div className="mt-5">{children}</div>
    </section>
  );
}

/**
 * The "not built yet" note.
 *
 * Violet, never red, and it says what is true rather than teasing a control -
 * SCRUM-39's rule that absence beats disablement applies here too. It names
 * what the section would do so a reader knows what they are missing.
 */
export function NotBuiltNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="m-0 rounded-[10px] bg-nevo-violet/[0.18] px-4 py-3.5 text-[13.5px] leading-[1.55] text-nevo-navy">
      {children}
    </p>
  );
}

/** Save button plus its quiet confirmation. */
export function SaveRow({
  phase,
  onSave,
  disabled,
  savedLabel = "Saved",
}: {
  phase: "idle" | "saving" | "saved" | "failed";
  onSave: () => void;
  disabled?: boolean;
  savedLabel?: string;
}) {
  return (
    <div className="mt-6 flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={onSave}
        disabled={disabled || phase === "saving"}
        className="cursor-pointer rounded-[10px] bg-nevo-navy px-5 py-3 text-sm font-semibold text-nevo-cream transition-[filter] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:brightness-100"
      >
        {phase === "saving" ? "Saving…" : "Save changes"}
      </button>
      {phase === "saved" ? (
        <span className="text-[13px] font-semibold text-nevo-navy motion-safe:animate-nevo-reveal">
          {savedLabel}
        </span>
      ) : null}
      {phase === "failed" ? (
        <span className="text-[13px] text-nevo-navy">
          That didn&rsquo;t save. Nothing changed - try again in a moment.
        </span>
      ) : null}
    </div>
  );
}
